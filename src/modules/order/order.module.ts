import { OrderController } from "./order.controller";
import { OrderService } from "./order.service";


const orderService = new OrderService();
const orderController = new OrderController(orderService);
export { orderService, orderController }