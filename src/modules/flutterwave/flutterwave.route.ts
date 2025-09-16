import { Router } from "express";
import { flutterwaveController } from "./flutterwave.module";

const flutterwaveWebhookRoutes = Router();

flutterwaveWebhookRoutes.post("/flutterwave", flutterwaveController.handleWebhook);

export default flutterwaveWebhookRoutes;


