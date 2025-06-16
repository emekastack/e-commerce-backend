import { CartController } from "./cart.controller";
import { CartService } from "./cart.service";

const cartService = new CartService();
const cartController = new CartController(cartService);

export {cartService, cartController};