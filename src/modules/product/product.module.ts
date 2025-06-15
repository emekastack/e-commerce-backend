import { ProductController } from "./product.controller";
import { ProductService } from "./product.service";

const productService = new ProductService();
const productController = new ProductController(productService);
export {productService, productController}