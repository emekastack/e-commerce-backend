import { Router } from "express";
import { paystackController } from "./paystack.module";


const webhookRoutes = Router();

webhookRoutes.post("/paystack", paystackController.handleWebhook);

export default webhookRoutes;
