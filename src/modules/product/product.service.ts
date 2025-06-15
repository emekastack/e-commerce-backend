import { z } from "zod";
import { createCategorySchema, createProductSchema } from "../../common/validators/product.validator";
import ProductModel from "../../database/models/product.model";
import CategoryModel from "../../database/models/category.model";

export class ProductService {
    public async createProduct(productData: z.infer<typeof createProductSchema>) {
        const { name, price, category, description, image, outOfStock } = productData;

        const product = await ProductModel.create({
            name,
            price,
            category,
            description,
            outOfStock: outOfStock ?? false,
            imageUrl: image.imageUrl,
            filename: image.fileName
        })

        return { product }
    }

    public async createCategory(categoryData: z.infer<typeof createCategorySchema>) {
        const { name, description } = categoryData

        const category = await CategoryModel.create({
            name,
            description
        });

        return { category }
    }    
}