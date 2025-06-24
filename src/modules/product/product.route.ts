import { Router } from "express";
import { authenticateJWT } from "../../common/strategies/jwt.strategy";
import { adminRoute } from "../../middlewares/adminRoute";
import { productController } from "./product.module";
import { upload } from "../../config/multer.config";

const productRoutes = Router();
// Admin Routes (Protected)
productRoutes.post("/", authenticateJWT, adminRoute, upload.single("file"), productController.createProduct);
productRoutes.post("/create-category", authenticateJWT, adminRoute, productController.createCategory);
productRoutes.put("/update-category/:id", authenticateJWT, adminRoute, productController.updateCategory);
productRoutes.put("/:id", authenticateJWT, adminRoute, upload.single("file"), productController.updateProduct);
productRoutes.delete("/:id", authenticateJWT, adminRoute, productController.deleteProduct);
productRoutes.get("/categories/stats", authenticateJWT, adminRoute, productController.getCategoriesStats);
productRoutes.get("/categories-with-count", authenticateJWT, adminRoute, productController.getCategoriesWithCount);
productRoutes.delete("/delete-category/:id", authenticateJWT, adminRoute, productController.deleteCategory);

//Public Routes
productRoutes.get("/search", productController.searchProducts);
productRoutes.get("/all", productController.getAllProducts);
productRoutes.get("/categories", productController.getCategories);
productRoutes.get("/category/:categoryId", productController.getProductsByCategory);
productRoutes.get("/:id", productController.getProductById);
export default productRoutes;
