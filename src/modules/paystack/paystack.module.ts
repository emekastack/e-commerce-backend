import { OrderService } from "../order/order.service";
import { PaystackController } from "./paystack.controller";
import { PaystackService } from "./paystack.service";


const paystackService = new PaystackService();
const orderService = new OrderService();

const paystackController = new PaystackController(paystackService, orderService);

export {paystackController}

