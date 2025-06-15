import { Router } from "express";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { adminRoute } from "../../middlewares/adminRoute";
import { productController } from "./product.module";
import { upload } from "../../config/multer.config";

const productRoutes = Router();
productRoutes.post("/create-post", authenticateJWT, adminRoute, upload.single("file"), productController.createProduct);
productRoutes.post("/create-category", authenticateJWT, adminRoute, productController.createCategory);

export default productRoutes;
