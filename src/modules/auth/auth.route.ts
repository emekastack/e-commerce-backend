import { Router } from "express";
import { authController } from "./auth.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";

const authRoutes = Router();
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/verify-email", authController.verifyEmail);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);
authRoutes.post("/logout", authenticateJWT, authController.logout);
authRoutes.post("/update-password", authenticateJWT, authController.updateAdminPassword);
authRoutes.get("/refresh-token", authController.refreshToken);

export default authRoutes;