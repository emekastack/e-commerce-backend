import { z } from "zod";
import { OrderStatus, PaymentStatus } from "../../database/models/order.model";

export interface CreateOrderRequest {
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

export interface OrderFilters {
    userId?: string;
    orderStatus?: OrderStatus;
    paymentStatus?: PaymentStatus;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
}

export interface OrderStats {
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    shippedOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
}

export interface PaymentVerificationResult {
    order: any;
    paymentVerified: boolean;
    message: string;
}

export interface CreateOrderResult {
    order: any;
    paymentUrl: string;
    paymentReference: string;
}

export const createOrderSchema = z.object({
    shippingAddress: z.object({
        firstName: z.string().min(1, "First name is required"),
        lastName: z.string().min(1, "Last name is required"),
        address: z.string().min(1, "Address is required"),
        city: z.string().min(1, "City is required"),
        state: z.string().min(1, "State is required"),
        country: z.string().min(1, "Country is required"),
        zipCode: z.string().min(1, "Zip code is required"),
        phone: z.string().min(1, "Phone is required"),
    }),
    paymentMethod: z.string().optional().default("paystack"),
});

export const updateOrderStatusSchema = z.object({
    orderStatus: z.nativeEnum(OrderStatus),
});

export const orderFiltersSchema = z.object({
    userId: z.string().optional(),
    orderStatus: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.nativeEnum(PaymentStatus).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    page: z.number().int().positive().optional().default(1),
    limit: z.number().int().positive().max(100).optional().default(10),
});