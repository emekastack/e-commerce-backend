import { Router } from "express";
import { orderController } from "./order.module";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { adminRoute } from "../../middlewares/adminRoute";


const orderRoutes = Router();

// Public Routes
// orderRoutes.post("/verify/:reference", orderController.verifyPayment);
orderRoutes.get("/payment-status/:reference", orderController.getPaymentStatus);

// Private Routes (Authenticated Users)
orderRoutes.use(authenticateJWT); // Apply authentication to all routes below

orderRoutes.post("/", orderController.createOrder);
orderRoutes.get("/user/last-address", orderController.getUserLastAddress);
orderRoutes.get("/reinitialize/:orderId", orderController.reinitializePayment);
orderRoutes.get("/user", orderController.getUserOrders);
orderRoutes.get("/:id", orderController.getOrderById);
// orderRoutes.patch("/:id/cancel", orderController.cancelOrder);

// Admin Routes (Protected)
orderRoutes.get("/admin/all", adminRoute, orderController.getAllOrders);
orderRoutes.get("/admin/stats", adminRoute, orderController.getOrderStats);
orderRoutes.patch("/:id/status", adminRoute, orderController.updateOrderStatus);

// Dashboard Route (Admin only)
orderRoutes.get("/admin/dashboard", adminRoute, orderController.getDashboardStats);

export default orderRoutes;
