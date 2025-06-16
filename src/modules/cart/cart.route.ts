import { Router } from "express";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { cartController } from "./cart.module";

const cartRoutes = Router();

// All cart routes require authentication
cartRoutes.use(authenticateJWT);

// GET /cart - Get user's cart
cartRoutes.get("/", cartController.getCart);

// POST /cart/add - Add item to cart
cartRoutes.post("/add", cartController.addToCart);

// PUT /cart/update - Update cart item quantity
cartRoutes.put("/update", cartController.updateCartItem);

// DELETE /cart/remove/:productId - Remove item from cart
cartRoutes.delete("/remove/:productId", cartController.removeFromCart);

// DELETE /cart/clear - Clear entire cart
cartRoutes.delete("/clear", cartController.clearCart);

// GET /cart/count - Get cart items count
cartRoutes.get("/count", cartController.getCartItemsCount);

// GET /cart/validate - Validate cart items
cartRoutes.get("/validate", cartController.validateCartItems);

export default cartRoutes;