import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { OrderService } from "./order.service";
import { HTTPSTATUS } from "../../config/http.config";
import { createOrderSchema, orderFiltersSchema, updateOrderStatusSchema } from "../../common/validators/order.validator";
import { OrderStatus, PaymentStatus } from "../../database/models/order.model";


export class OrderController {
    private orderService: OrderService;

    constructor(orderService: OrderService) {
        this.orderService = orderService;
    }

    /**
    * @desc Get payment status by reference
    * @route GET /orders/payment-status/:reference
    * @access Public
    */
    public getPaymentStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const { reference } = req.params;

            if (!reference) {
                return res.status(HTTPSTATUS.BAD_REQUEST).json({
                    message: "Payment reference is required"
                });
            }

            const result = await this.orderService.getPaymentStatus(reference);

            return res.status(HTTPSTATUS.OK).json({
                message: "Payment status retrieved successfully",
                ...result
            });
        }
    );



    /**
    * @desc Create order from cart
    * @route POST /orders
    * @access Private
    */
    public createOrder = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: "User not authenticated"
                });
            }

            const validatedData = createOrderSchema.parse(req.body);

            const result = await this.orderService.createOrder({
                userId,
                ...validatedData,
            });


            return res.status(HTTPSTATUS.CREATED).json({
                message: "Payment link generated successfully",
                paymentUrl: result.paymentUrl,
            });
        }
    );

    /**
     * @desc Get payment URL for order
     * @route GET /orders/reinitilize/:orderId
     * @access Private
     */
    public reinitializePayment = asyncHandler(
        async (req: Request, res: Response) => {
            const { orderId } = req.params;
            const userId = (req as any).user?.userId;

            if (!userId) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: "User not authenticated"
                });
            }

            const result = await this.orderService.reinitializePayment(orderId, userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Payment URL retrieved successfully",
                paymentUrl: result.paymentUrl,
            });
        }
    )


    /**
     * @desc Get user orders
     * @route GET /orders/user
     * @access Private
     */
    public getUserOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: "User not authenticated"
                });
            }

            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 10;

            const result = await this.orderService.getUserOrders(userId, page, limit);

            return res.status(HTTPSTATUS.OK).json({
                message: "Orders retrieved successfully",
                ...result,
            });
        }
    );


    /**
     * @desc Get order by ID
     * @route GET /orders/:id
     * @access Private
     */
    public getOrderById = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const userRole = (req as any).user?.role;

            // If user is not admin, only allow them to view their own orders
            // const filterUserId = userRole === "admin" ? undefined : userId;

            const result = await this.orderService.getOrderById(id);

            return res.status(HTTPSTATUS.OK).json({
                message: "Order retrieved successfully",
                ...result,
            });
        }
    );

    /**
     * @desc Update order status (Admin only)
     * @route PATCH /orders/:id/status
     * @access Admin
     */
    public updateOrderStatus = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const validatedData = updateOrderStatusSchema.parse(req.body);

            const { message } = await this.orderService.updateOrderStatus(id, validatedData.orderStatus);

            return res.status(HTTPSTATUS.OK).json({
                message
            });
        }
    );

    /**
     * @desc Get all orders (Admin only)
     * @route GET /orders/admin/all
     * @access Admin
     */
    public getAllOrders = asyncHandler(
        async (req: Request, res: Response) => {
            const filters = orderFiltersSchema.parse({
                userId: req.query.userId as string,
                orderStatus: req.query.orderStatus as OrderStatus,
                paymentStatus: req.query.paymentStatus as PaymentStatus,
                startDate: req.query.startDate as string,
                endDate: req.query.endDate as string,
                page: req.query.page ? Number(req.query.page) : 1,
                limit: req.query.limit ? Number(req.query.limit) : 10,
            });

            // Convert date strings to Date objects if provided
            const processedFilters = {
                ...filters,
                startDate: filters.startDate ? new Date(filters.startDate) : undefined,
                endDate: filters.endDate ? new Date(filters.endDate) : undefined,
            };

            const result = await this.orderService.getAllOrders(processedFilters);

            return res.status(HTTPSTATUS.OK).json({
                message: "Orders retrieved successfully",
                ...result,
            });
        }
    );

    /**
     * @desc Cancel order
     * @route PATCH /orders/:id/cancel
     * @access Private
     */
    public cancelOrder = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const userRole = (req as any).user?.role;

            // If user is not admin, only allow them to cancel their own orders
            const filterUserId = userRole === "admin" ? undefined : userId;

            const result = await this.orderService.cancelOrder(id, filterUserId);

            return res.status(HTTPSTATUS.OK).json(result);
        }
    );

    /**
     * @desc Get order statistics (Admin only)
     * @route GET /orders/admin/stats
     * @access Admin
     */
    public getOrderStats = asyncHandler(
        async (req: Request, res: Response) => {
            // This could be extended with more detailed statistics
            const [totalOrders, pendingOrders, processingOrders, shippedOrders, deliveredOrders, cancelledOrders] = await Promise.all([
                this.orderService.getAllOrders({ limit: 1 }),
                this.orderService.getAllOrders({ orderStatus: OrderStatus.PENDING, limit: 1 }),
                this.orderService.getAllOrders({ orderStatus: OrderStatus.PROCESSING, limit: 1 }),
                this.orderService.getAllOrders({ orderStatus: OrderStatus.SHIPPED, limit: 1 }),
                this.orderService.getAllOrders({ orderStatus: OrderStatus.DELIVERED, limit: 1 }),
                this.orderService.getAllOrders({ orderStatus: OrderStatus.CANCELLED, limit: 1 }),
            ]);

            const stats = {
                totalOrders: totalOrders.pagination.totalItems,
                pendingOrders: pendingOrders.pagination.totalItems,
                processingOrders: processingOrders.pagination.totalItems,
                shippedOrders: shippedOrders.pagination.totalItems,
                deliveredOrders: deliveredOrders.pagination.totalItems,
                cancelledOrders: cancelledOrders.pagination.totalItems,
            };

            return res.status(HTTPSTATUS.OK).json({
                message: "Order statistics retrieved successfully",
                stats,
            });
        }
    );

    /**
     * @desc Get comprehensive dashboard statistics (Admin only)
     * @route GET /orders/admin/dashboard
     * @access Admin
     */
    public getDashboardStats = asyncHandler(
        async (req: Request, res: Response) => {
            const dashboardStats = await this.orderService.getDashboardStats();

            return res.status(HTTPSTATUS.OK).json({
                message: "Dashboard statistics retrieved successfully",
                ...dashboardStats,
            });
        }
    );


    /**
     * @desc Get user's last shipping address
     * @route GET /orders/user/last-address
     * @access Private
     */
    public getUserLastAddress = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            if (!userId) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: "User not authenticated"
                });
            }

            const lastAddress = await this.orderService.getUserLastShippingAddress(userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Last shipping address retrieved successfully",
                shippingAddress: lastAddress
            });
        }
    );

    /**
     * @desc Track order by orderId and billingEmail
     * @route GET /orders/track?orderId=...&billingEmail=...
     * @access Public
     */
    public trackOrder = asyncHandler(
        async (req: Request, res: Response) => {
            const { orderId, billingEmail } = req.query;
            if (!orderId || !billingEmail) {
                return res.status(HTTPSTATUS.BAD_REQUEST).json({
                    message: "Order ID and billing email are required",
                });
            }
            const result = await this.orderService.trackOrder(
                orderId as string,
                billingEmail as string
            );
            return res.status(HTTPSTATUS.OK).json({
                message: "Order found",
                ...result,
            });
        }
    );

}