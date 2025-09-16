import { Router } from "express";
import { authenticateJWT } from "../common/strategies/jwt.strategy";
import authRouter from "../modules/auth/auth.route";
import userRoute from "../modules/user/user.route";
import productRoutes from "../modules/product/product.route";
import cartRoutes from "../modules/cart/cart.route";
import orderRoutes from "../modules/order/order.route";
import webhookRoutes from "../modules/paystack/paystack.route";
import flutterwaveWebhookRoutes from "../modules/flutterwave/flutterwave.route";
import adsRoutes from "../modules/ads/ads.route";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/user", authenticateJWT, userRoute);
appRouter.use("/product", productRoutes);
appRouter.use("/cart", cartRoutes);
appRouter.use("/orders", orderRoutes);
appRouter.use("/webhook", webhookRoutes)
appRouter.use("/webhook", flutterwaveWebhookRoutes)
appRouter.use("/ads", adsRoutes);
export default appRouter;