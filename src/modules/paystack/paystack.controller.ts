import { Request, Response } from "express";
import crypto from "crypto";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { OrderService } from "../order/order.service";
import { PaystackService } from "./paystack.service";
import { config } from "../../config/app.config";
import { HTTPSTATUS } from "../../config/http.config";


export class PaystackController {
    private paystackService: PaystackService;
    private orderService: OrderService;

    constructor(paystackService: PaystackService, orderService: OrderService) {
        this.paystackService = paystackService;
        this.orderService = orderService;
    }

    /**
     * @desc Handle Paystack webhook events
     * @route POST /webhook/paystack
     * @access Public (but verified)
     */
    public handleWebhook = asyncHandler(
        async (req: Request, res: Response) => {
            const hash = crypto
                .createHmac('sha512', config.PAYSTACK_SECRET_KEY || '')
                .update(JSON.stringify(req.body))
                .digest('hex');

            const signature = req.headers['x-paystack-signature'] as string;

            if (hash !== signature) {
                return res.status(HTTPSTATUS.UNAUTHORIZED).json({
                    message: "Invalid signature"
                });
            }

            const event = req.body;

            switch (event.event) {
                case 'charge.success':
                    await this.handleSuccessfulPayment(event.data);
                    break;
                case 'charge.failed':
                case 'charge.dispute':
                    await this.handleFailedPayment(event.data);
                    break;
                default:
                    console.log(`Unhandled event type: ${event.event}`);
            }

            return res.status(HTTPSTATUS.OK).json({
                message: "Webhook processed successfully"
            });

        }

    )

    private async handleSuccessfulPayment(data: any) {
        const reference = data.reference;

        try {
            await this.orderService.handleSuccessfulPayment(reference, data);
            console.log(`Payment successful for reference: ${reference}`);
        } catch (error: any) {
            console.error(`Error handling successful payment for ${reference}:`, error);
            throw error;
        }
    }

    private async handleFailedPayment(data: any) {
        const reference = data.reference;

        try {
            await this.orderService.handleFailedPayment(reference, data);
            console.log(`Payment failed for reference: ${reference}`);
        } catch (error: any) {
            console.error(`Error handling failed payment for ${reference}:`, error);
            throw error;
        }
    }
}