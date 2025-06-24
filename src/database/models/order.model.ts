import mongoose, { Document, Schema } from "mongoose";

export interface OrderItemDocument extends Document {
  product: mongoose.Types.ObjectId;
  quantity: number;
  price: number;
  name: string;
}

export interface ShippingAddressDocument extends Document {
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
}

export enum OrderStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  SHIPPED = "shipped",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
  REFUNDED = "refunded",
}

export interface OrderDocument extends Document {
  userId: mongoose.Types.ObjectId;
  items: OrderItemDocument[];
  totalAmount: number;
  shippingAddress: ShippingAddressDocument;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  paymentMethod: string;
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<OrderItemDocument>({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
});

const shippingAddressSchema = new Schema<ShippingAddressDocument>({
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    required: true,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

const orderSchema = new Schema<OrderDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    orderStatus: {
      type: String,
      enum: Object.values(OrderStatus),
      default: OrderStatus.PENDING,
    },
    paymentStatus: {
      type: String,
      enum: Object.values(PaymentStatus),
      default: PaymentStatus.PENDING,
    },
    paymentReference: {
      type: String,
      required: true,
      unique: true,
    },
    paymentMethod: {
      type: String,
      default: "paystack",
    },
  },
  {
    timestamps: true,
  }
);

// Index for userId (for lookups)
orderSchema.index({ userId: 1 });

const OrderModel = mongoose.model<OrderDocument>("Order", orderSchema);

export default OrderModel;