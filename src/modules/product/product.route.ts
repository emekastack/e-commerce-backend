import { Router } from "express";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { adminRoute } from "../../middlewares/adminRoute";
import { productController } from "./product.module";
import { upload } from "../../config/multer.config";

const productRoutes = Router();
// Admin Routes (Protected)
productRoutes.post("/", authenticateJWT, adminRoute, upload.single("file"), productController.createProduct);
productRoutes.post("/create-category", authenticateJWT, adminRoute, productController.createCategory);
productRoutes.put("/:id", authenticateJWT, adminRoute, upload.single("file"), productController.updateProduct);
productRoutes.delete("/:id", authenticateJWT, adminRoute, productController.deleteProduct);


//Public Routes
productRoutes.get("/search", productController.searchProducts);
productRoutes.get("/all", productController.getAllProducts);
productRoutes.get("/categories", productController.getCategories);
productRoutes.get("/category/:categoryId", productController.getProductsByCategory);
productRoutes.get("/:id", productController.getProductById);
export default productRoutes;
