import axios from "axios"
import { BadRequestException } from "../../common/utils/catch-errors";
import { PaystackInitializeResponse, PaystackVerifyResponse } from "../../common/validators/paystack.validator";
import { config } from "../../config/app.config";

export class PaystackService {
    private readonly baseURL = "https://api.paystack.co";
    private readonly secretKey: string;

    constructor() {
        this.secretKey = config.PAYSTACK_SECRET_KEY || "";
        if (!this.secretKey) {
            throw new BadRequestException("Paystack secret key is required");
        }
    }

    private getHeaders() {
        return {
            Authorization: `Bearer ${this.secretKey}`,
            "Content-Type": "application/json",
        };
    }

    // Initialize transaction
    async initializeTransaction(
        email: string,
        amount: number,
        reference: string,
        metadata?: any
    ): Promise<PaystackInitializeResponse> {
        try {
            const response = await axios.post(
                `${this.baseURL}/transaction/initialize`,
                {
                    email,
                    amount: amount * 100, // Convert to kobo (Paystack expects amount in kobo)
                    reference,
                    metadata,
                    callback_url: `${config.APP_ORIGIN}/payment/callback`,
                },
                {
                    headers: this.getHeaders(),
                }
            );

            if (!response.data.status) {
                throw new BadRequestException(
                    response.data.message || "Failed to initialize payment"
                );
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new BadRequestException(error.response.data.message);
            }
            throw new BadRequestException("Failed to initialize payment");
        }
    }

    //Verify Transaction
    async verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction/verify/${reference}`,
                {
                    headers: this.getHeaders(),
                }
            );

            if (!response.data.status) {
                throw new BadRequestException(
                    response.data.message || "Failed to verify payment"
                );
            }

            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new BadRequestException(error.response.data.message);
            }
            throw new BadRequestException("Failed to verify payment");
        }
    }

    // List Transactions
    async listTransactions(page = 1, perPage = 50) {
        try {
            const response = await axios.get(
                `${this.baseURL}/transaction?page=${page}&perPage=${perPage}`,
                {
                    headers: this.getHeaders(),
                }
            );

            return response.data;
        } catch (error: any) {
            if (error.response?.data?.message) {
                throw new BadRequestException(error.response.data.message);
            }
            throw new BadRequestException("Failed to fetch transactions");
        }
    }

    // Generate Reference
    generateReference(): string {
        const timestamp = Date.now().toString();
        const random = Math.random().toString(36).substring(2, 15);
        return `ref_${timestamp}_${random}`;
    }
}