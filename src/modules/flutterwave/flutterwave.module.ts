import { OrderService } from "../order/order.service";
import { FlutterwaveController } from "./flutterwave.controller";
import { FlutterwaveService } from "./flutterwave.service";

const flutterwaveService = new FlutterwaveService();
const orderService = new OrderService();

const flutterwaveController = new FlutterwaveController(flutterwaveService, orderService);

export { flutterwaveController };


