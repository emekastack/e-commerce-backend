import { z } from "zod";
import OrderModel, {
  OrderStatus,
  PaymentStatus,
} from "../../database/models/order.model";
import CartModel from "../../database/models/cart.model";
import ProductModel from "../../database/models/product.model";
import UserModel from "../../database/models/user.model";
import {
  BadRequestException,
  NotFoundException,
} from "../../common/utils/catch-errors";
import { PaystackService } from "../paystack/paystack.service";
import mongoose from "mongoose";
import { PaginationResult } from "../../common/interface/product.inteface";

interface CreateOrderData {
  userId: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
  };
  paymentMethod?: string;
}

interface OrderFilters {
  userId?: string;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class OrderService {
  private paystackService: PaystackService;

  constructor() {
    this.paystackService = new PaystackService();
  }

  // HANDLE SUCCESSFUL PAYMENT FROM WEBHOOK
  public async handleSuccessfulPayment(reference: string, paymentData: any) {
    const order = await OrderModel.findOne({ paymentReference: reference });
    if (!order) {
      throw new NotFoundException("Order not found for payment reference");
    }

    // Only update if payment is still pending
    if (order.paymentStatus === PaymentStatus.PENDING) {
      order.paymentStatus = PaymentStatus.SUCCESS;
      order.orderStatus = OrderStatus.PROCESSING;

      // Store additional payment data if needed
      if (paymentData.authorization) {
        order.paymentMethod =
          paymentData.authorization.brand || order.paymentMethod;
      }

      await order.save();

      // Here you could add additional logic like:
      // - Send confirmation email to customer
      // - Update inventory
      // - Notify admin
      // - Log the transaction

      console.log(`Order ${order._id} payment confirmed via webhook`);
    }
    return order;
  }

  // HANDLE FAILED PAYMENT FROM WEBHOOK
  public async handleFailedPayment(reference: string, paymentData: any) {
    const order = await OrderModel.findOne({ paymentReference: reference });
    if (!order) {
      throw new NotFoundException("Order not found for payment reference");
    }

    // Only update if payment is still pending
    if (order.paymentStatus === PaymentStatus.PENDING) {
      order.paymentStatus = PaymentStatus.FAILED;
      // Optionally cancel the order or keep it pending for retry
      // order.orderStatus = OrderStatus.CANCELLED;

      await order.save();

      // Here you could add additional logic like:
      // - Send payment failed email to customer
      // - Log the failed transaction
      // - Notify admin of failed payment

      console.log(`Order ${order._id} payment failed via webhook`);
    }

    return order;
  }

  // GET PAYMENT STATUS (for frontend polling if needed)
  public async getPaymentStatus(reference: string) {
    const order = await OrderModel.findOne({ paymentReference: reference })
      .select("paymentStatus orderStatus paymentReference")
      .lean();

    if (!order) {
      throw new NotFoundException("Order not found");
    }

    return {
      reference: order.paymentReference,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      isPaid: order.paymentStatus === PaymentStatus.SUCCESS,
      isFailed: order.paymentStatus === PaymentStatus.FAILED,
    };
  }

  // CREATE ORDER FROM CART
  public async createOrder(orderData: CreateOrderData) {
    const { userId, shippingAddress, paymentMethod = "paystack" } = orderData;

    // Validate user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Get user's cart
    const cart = await CartModel.findOne({ userId }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      throw new BadRequestException("Cart is empty");
    }

    // Validate cart items and check stock
    const orderItems = [];
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      const product = await ProductModel.findById(cartItem.product);
      if (!product) {
        throw new BadRequestException(`Product ${cartItem.product} not found`);
      }

      if (product.outOfStock) {
        throw new BadRequestException(
          `Product ${product.name} is out of stock`
        );
      }

      const orderItem = {
        product: product._id,
        quantity: cartItem.quantity,
        price: product.price, // Use current product price
        name: product.name,
        imageUrl: product.imageUrl,
      };

      orderItems.push(orderItem);
      totalAmount += product.price * cartItem.quantity;
    }

    // Generate payment reference
    const paymentReference = this.paystackService.generateReference();

    // Create order
    const order = await OrderModel.create({
      userId,
      items: orderItems,
      totalAmount,
      shippingAddress,
      paymentReference,
      paymentMethod,
      orderStatus: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });

    // Initialize payment
    const paymentData = await this.paystackService.initializeTransaction(
      user.email,
      totalAmount,
      paymentReference,
      {
        orderId: order._id,
        userId: user._id,
        customerName: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
      }
    );

    // Clear cart after order creation
    await CartModel.findOneAndUpdate(
      { userId },
      { $set: { items: [], totalAmount: 0 } }
    );

    // const populatedOrder = await OrderModel.findById(order._id)
    //     .populate("items.product", "name imageUrl");

    return {
      paymentUrl: paymentData.data.authorization_url,
    };
  }

  // Reinitialize payment (if needed)
  public async reinitializePayment(orderId: string, userId: string) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const order = await OrderModel.findById(orderId);
    if (!order) throw new NotFoundException("Order not found");

    if (order.paymentStatus === PaymentStatus.SUCCESS) {
      throw new BadRequestException("Order already paid");
    }

    // Generate new payment reference
    const newReference = this.paystackService.generateReference();

    // Initialize payment with Paystack
    const paymentData = await this.paystackService.initializeTransaction(
      user.email,
      order.totalAmount,
      newReference,
      {
        orderId: order._id,
        userId: order.userId,
        customerName:
          order.shippingAddress.firstName +
          " " +
          order.shippingAddress.lastName,
      }
    );

    // Update order with new payment reference
    order.paymentReference = newReference;
    await order.save();

    return { paymentUrl: paymentData.data.authorization_url };
  }

  // GET USER ORDERS
  public async getUserOrders(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginationResult<any>> {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid user ID");
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      OrderModel.find({ userId })
        .populate("items.product", "name imageUrl")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments({ userId }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: orders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
  }

  // GET ORDER BY ID
  public async getOrderById(orderId: string) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException("Invalid order ID");
    }

    const filter: any = { _id: orderId };
    // if (userId) {
    //   filter.userId = userId;
    // }

    const order = await OrderModel.findOne(filter);

    if (!order) {
      throw new NotFoundException("Order not found");
    }
    return { order };
  }

  // GET USER'S LAST SHIPPING ADDRESS
  public async getUserLastShippingAddress(userId: string) {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid user ID");
    }

    const filter: any = { userId };
    const lastOrder = await OrderModel.findOne(filter)
      .select("shippingAddress")
      .sort({ createdAt: -1 })
      .lean();

    if (!lastOrder) {
      throw new NotFoundException("No previous orders found");
    }

    return { ...lastOrder.shippingAddress };
  }

  // UPDATE ORDER STATUS (Admin only)
  public async updateOrderStatus(orderId: string, orderStatus: OrderStatus) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException("Invalid order ID");
    }

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    order.orderStatus = orderStatus;
    await order.save();

    // const populatedOrder = await OrderModel.findById(order._id);
    // .populate("items.product", "name imageUrl")
    // .populate("userId", "name email");

    return { message: "Order updated successful" };
  }

  // GET ALL ORDERS (Admin only)
  public async getAllOrders(
    filters: OrderFilters = {}
  ): Promise<PaginationResult<any>> {
    const {
      userId,
      orderStatus,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters;

    // Build filter object
    const filter: any = {};

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      filter.userId = new mongoose.Types.ObjectId(userId);
    }

    if (orderStatus) {
      filter.orderStatus = orderStatus;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate;
      if (endDate) filter.createdAt.$lte = endDate;
    }

    const skip = (page - 1) * limit;

    const [orders, totalCount] = await Promise.all([
      OrderModel.find(filter)
        .select("userId items totalAmount orderStatus paymentStatus createdAt")
        .populate("userId", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      OrderModel.countDocuments(filter),
    ]);

    const processedOrders = orders.map((order) => ({
      ...order,
      items: Array.isArray(order.items) ? order.items.length : 0,
    }));

    const totalPages = Math.ceil(totalCount / limit);

    return {
      data: processedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
        limit,
      },
    };
  }

  // CANCEL ORDER
  public async cancelOrder(orderId: string, userId?: string) {
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      throw new BadRequestException("Invalid order ID");
    }

    const filter: any = { _id: orderId };
    if (userId) {
      filter.userId = userId;
    }

    const order = await OrderModel.findOne(filter);
    if (!order) {
      throw new NotFoundException("Order not found");
    }

    // Only allow cancellation if order is pending or processing
    if (
      order.orderStatus !== OrderStatus.PENDING &&
      order.orderStatus !== OrderStatus.PROCESSING
    ) {
      throw new BadRequestException("Order cannot be cancelled at this stage");
    }

    order.orderStatus = OrderStatus.CANCELLED;
    await order.save();

    const populatedOrder = await OrderModel.findById(order._id).populate(
      "items.product",
      "name imageUrl"
    );

    return { order: populatedOrder, message: "Order cancelled successfully" };
  }

  // GET DASHBOARD STATISTICS
  public async getDashboardStats() {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const previousMonthStart = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1
    );
    const previousMonthEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      0,
      23,
      59,
      59,
      999
    );

    // Get current month statistics
    const [
      currentMonthRevenue,
      currentMonthOrders,
      currentMonthCustomers,
      currentMonthProducts,
    ] = await Promise.all([
      this.getRevenueForPeriod(currentMonthStart, currentMonthEnd),
      this.getOrdersForPeriod(currentMonthStart, currentMonthEnd),
      this.getCustomersForPeriod(currentMonthStart, currentMonthEnd),
      this.getProductsForPeriod(currentMonthStart, currentMonthEnd),
    ]);

    // Get previous month statistics
    const [
      previousMonthRevenue,
      previousMonthOrders,
      previousMonthCustomers,
      previousMonthProducts,
    ] = await Promise.all([
      this.getRevenueForPeriod(previousMonthStart, previousMonthEnd),
      this.getOrdersForPeriod(previousMonthStart, previousMonthEnd),
      this.getCustomersForPeriod(previousMonthStart, previousMonthEnd),
      this.getProductsForPeriod(previousMonthStart, previousMonthEnd),
    ]);

    // Get all-time totals
    const [totalRevenue, totalOrders, totalCustomers, totalProducts] =
      await Promise.all([
        this.getTotalRevenue(),
        this.getTotalOrders(),
        this.getTotalCustomers(),
        this.getTotalProducts(),
      ]);

    // Calculate percentage changes
    const revenueChange = this.calculatePercentageChange(
      currentMonthRevenue,
      previousMonthRevenue
    );
    const ordersChange = this.calculatePercentageChange(
      currentMonthOrders,
      previousMonthOrders
    );
    const customersChange = this.calculatePercentageChange(
      currentMonthCustomers,
      previousMonthCustomers
    );
    const productsChange = this.calculatePercentageChange(
      currentMonthProducts,
      previousMonthProducts
    );

    return {
      revenue: {
        total: totalRevenue,
        currentMonth: currentMonthRevenue,
        previousMonth: previousMonthRevenue,
        percentageChange: revenueChange.percentage,
        changeType: revenueChange.changeType,
      },
      orders: {
        total: totalOrders,
        currentMonth: currentMonthOrders,
        previousMonth: previousMonthOrders,
        percentageChange: ordersChange.percentage,
        changeType: ordersChange.changeType,
      },
      customers: {
        total: totalCustomers,
        currentMonth: currentMonthCustomers,
        previousMonth: previousMonthCustomers,
        percentageChange: customersChange.percentage,
        changeType: customersChange.changeType,
      },
      products: {
        total: totalProducts,
        currentMonth: currentMonthProducts,
        previousMonth: previousMonthProducts,
        percentageChange: productsChange.percentage,
        changeType: productsChange.changeType,
      },
      period: {
        currentMonth: {
          start: currentMonthStart,
          end: currentMonthEnd,
        },
        previousMonth: {
          start: previousMonthStart,
          end: previousMonthEnd,
        },
      },
    };
  }

  // Helper method to calculate percentage change
  private calculatePercentageChange(current: number, previous: number) {
    let percentage = 0;
    let changeType: "increase" | "decrease" | "no-change" = "no-change";

    if (previous > 0) {
      percentage = ((current - previous) / previous) * 100;
      changeType =
        percentage > 0 ? "increase" : percentage < 0 ? "decrease" : "no-change";
    } else if (current > 0) {
      percentage = 100; // If previous was 0 and current has value
      changeType = "increase";
    }

    return {
      percentage: Math.round(percentage * 100) / 100, // Round to 2 decimal places
      changeType,
    };
  }

  // Get total revenue
  private async getTotalRevenue(): Promise<number> {
    const result = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  // Get revenue for specific period
  private async getRevenueForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: { $ne: OrderStatus.CANCELLED },
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
  }

  // Get total orders
  private async getTotalOrders(): Promise<number> {
    return await OrderModel.countDocuments({
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: { $ne: OrderStatus.CANCELLED },
    });
  }

  // Get orders for specific period
  private async getOrdersForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return await OrderModel.countDocuments({
      paymentStatus: PaymentStatus.SUCCESS,
      orderStatus: { $ne: OrderStatus.CANCELLED },
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }

  // Get total customers (unique users who have made successful orders)
  private async getTotalCustomers(): Promise<number> {
    const result = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: { $ne: OrderStatus.CANCELLED },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "totalCustomers",
      },
    ]);

    return result.length > 0 ? result[0].totalCustomers : 0;
  }

  // Get customers for specific period
  private async getCustomersForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const result = await OrderModel.aggregate([
      {
        $match: {
          paymentStatus: PaymentStatus.SUCCESS,
          orderStatus: { $ne: OrderStatus.CANCELLED },
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: "$userId",
        },
      },
      {
        $count: "totalCustomers",
      },
    ]);

    return result.length > 0 ? result[0].totalCustomers : 0;
  }

  // Get total products
  private async getTotalProducts(): Promise<number> {
    return await ProductModel.countDocuments();
  }

  // Get products for specific period (products created in that period)
  private async getProductsForPeriod(
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    return await ProductModel.countDocuments({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    });
  }
}
