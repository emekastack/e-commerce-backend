import { Router } from "express";
import { authenticateJWT } from "../common/strategies/jwt.strategy";
import authRouter from "../modules/auth/auth.route";
import userRoute from "../modules/user/user.route";
import productRoutes from "../modules/product/product.route";

const appRouter = Router();

appRouter.use("/auth", authRouter);
appRouter.use("/user", authenticateJWT, userRoute)
appRouter.use("/product", productRoutes)

export default appRouter;