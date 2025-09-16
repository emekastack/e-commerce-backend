import axios from "axios";
import { BadRequestException } from "../../common/utils/catch-errors";
import { config } from "../../config/app.config";

export class FlutterwaveService {
  private readonly baseURL = "https://api.flutterwave.com/v3";
  private readonly secretKey: string;
  private readonly secretHash: string;

  constructor() {
    this.secretKey = config.FLW_SECRET_KEY || "";
    this.secretHash = config.FLW_SECRET_HASH || "";
    if (!this.secretKey) throw new BadRequestException("Flutterwave secret key is required");
    if (!this.secretHash) throw new BadRequestException("Flutterwave secret hash is required");
  }

  private getHeaders() {
    return {
      Authorization: `Bearer ${this.secretKey}`,
      "Content-Type": "application/json",
    };
  }

  async initializePayment(
    email: string,
    amount: number,
    tx_ref: string,
    metadata?: any
  ): Promise<{ authorization_url: string }> {

    console.log("fluterwaveeee")
    try {
      const resp = await axios.post(
        `${this.baseURL}/payments`,
        {
          tx_ref,
          amount,
          currency: "NGN",
          customer: { email },
          redirect_url: `${config.APP_ORIGIN}/payment/callback`,
          meta: metadata,
        },
        { headers: this.getHeaders() }
      );

      if (resp.data?.status !== "success" || !resp.data?.data?.link) {
        throw new BadRequestException(resp.data?.message || "Failed to initialize payment");
      }

      return { authorization_url: resp.data.data.link };
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to initialize payment";
      throw new BadRequestException(message);
    }
  }

  generateReference(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 15);
    return `flw_${timestamp}_${random}`;
  }
}


