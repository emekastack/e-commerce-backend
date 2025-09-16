import { Request, Response } from "express";
import { FlutterwaveService } from "./flutterwave.service";
import { OrderService } from "../order/order.service";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";
import { config } from "../../config/app.config";

export class FlutterwaveController {
  private flutterwaveService: FlutterwaveService;
  private orderService: OrderService;

  constructor(flutterwaveService: FlutterwaveService, orderService: OrderService) {
    this.flutterwaveService = flutterwaveService;
    this.orderService = orderService;
  }

  /**
   * @desc Handle Flutterwave webhook events
   * @route POST /webhook/flutterwave
   * @access Public (but verified)
   */
  public handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = (req.headers["verif-hash"] as string) || "";

    if (!signature || signature !== (config.FLW_SECRET_HASH || "")) {
      return res.status(HTTPSTATUS.UNAUTHORIZED).json({ message: "Invalid signature" });
    }

    const event = req.body; // { event, data }
    const data = event?.data;

    try {
      if (data?.tx_ref && data?.status === "successful") {
        await this.orderService.handleSuccessfulPayment(data.tx_ref, data);
      } else if (data?.tx_ref) {
        await this.orderService.handleFailedPayment(data.tx_ref, data);
      }
    } catch (error) {
      // Log error but still return 200 to avoid repeated retries
    }

    return res.status(HTTPSTATUS.OK).json({ message: "Webhook processed successfully" });
  });
}


