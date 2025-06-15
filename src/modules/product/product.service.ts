import { z } from "zod";
import { createCategorySchema, createProductSchema, productSearchSchema } from "../../common/validators/product.validator";
import ProductModel from "../../database/models/product.model";
import CategoryModel from "../../database/models/category.model";
import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import { PaginationResult } from "../../common/interface/product.inteface";
import mongoose from "mongoose";

export class ProductService {
    //CREATE PRODUCT
    public async createProduct(productData: z.infer<typeof createProductSchema>) {
        const { name, price, category, description, image, outOfStock } = productData;

        const categoryExists = await CategoryModel.findById(category);
        if (!categoryExists) {
            throw new BadRequestException("Category does not exist");
        }
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

    // CREATE CATEGORY
    public async createCategory(categoryData: z.infer<typeof createCategorySchema>) {
        const { name, description } = categoryData

        const existingCategory = await CategoryModel.findOne({ name });

        if (existingCategory) {
            throw new BadRequestException("Category with this name already exists");
        }

        const category = await CategoryModel.create({
            name,
            description
        });

        return { category }
    }

    // SEARCH PRODUCT
    public async searchProducts(searchParams: z.infer<typeof productSearchSchema>): Promise<PaginationResult<any>> {
        const {
            q,
            category,
            minPrice,
            maxPrice,
            sortBy,
            sortOrder,
            page,
            limit,
            inStock,
        } = searchParams;

        // Build the filter object
        const filter: any = {};

        // Text search
        if (q) {
            filter.$or = [
                { name: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } },
            ];
        }

        // Category filter
        if (category) {
            if (mongoose.Types.ObjectId.isValid(category)) {
                filter.category = new mongoose.Types.ObjectId(category);
            } else {
                // Search by category name
                const categoryDoc = await CategoryModel.findOne({ name: { $regex: category, $options: "i" } });
                if (categoryDoc) {
                    filter.category = categoryDoc._id;
                } else {
                    // If category not found, return empty results
                    return {
                        data: [],
                        pagination: {
                            currentPage: page,
                            totalPages: 0,
                            totalItems: 0,
                            hasNextPage: false,
                            hasPreviousPage: false,
                            limit,
                        },
                    };
                }
            }
        }

        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            filter.price = {};
            if (minPrice !== undefined) filter.price.$gte = minPrice;
            if (maxPrice !== undefined) filter.price.$lte = maxPrice;
        }

        // Stock filter
        if (inStock !== undefined) {
            filter.outOfStock = !inStock;
        }

        // Build sort object
        const sort: any = {};
        sort[sortBy] = sortOrder === "asc" ? 1 : -1;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Execute query with aggregation for better performance
        const [products, totalCount] = await Promise.all([
            ProductModel.find(filter)
                .populate("category", "name description")
                .sort(sort)
                .skip(skip)
                .limit(limit)
                .lean(),
            ProductModel.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            data: products,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                limit,
            },
        };
    }

    // GET PRODUCT BY ID
    public async getProductById(productId: string) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product ID");
        }

        const product = await ProductModel.findById(productId).populate("category", "name description");

        if (!product) {
            throw new NotFoundException("Product not found");
        }

        return { product };
    }

    // GET CATEGORIES
    public async getCategories(): Promise<{ categories: any[] }> {
        const categories = await CategoryModel.find().sort({ name: 1 }).lean();
        return { categories };
    }

    // UPDATE PRODUCT
    public async updateProduct(productId: string, updateData: Partial<z.infer<typeof createProductSchema>>) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product ID");
        }

        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        // If category is being updated, validate it exists
        if (updateData.category) {
            const categoryExists = await CategoryModel.findById(updateData.category);
            if (!categoryExists) {
                throw new BadRequestException("Category does not exist");
            }
        }

        const updatedProduct = await ProductModel.findByIdAndUpdate(
            productId,
            { $set: updateData },
            { new: true, runValidators: true }
        ).populate("category", "name description");

        return { product: updatedProduct };
    }

    // DELETE PRODUCT
    public async deleteProduct(productId: string) {
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            throw new BadRequestException("Invalid product ID");
        }

        const product = await ProductModel.findByIdAndDelete(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        return { message: "Product deleted successfully" };
    }

    // GET PRODUCT BY CATEGORY
    public async getProductsByCategory(categoryId: string, page: number = 1, limit: number = 10) {
        if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            throw new BadRequestException("Invalid category ID");
        }

        const category = await CategoryModel.findById(categoryId);
        if (!category) {
            throw new NotFoundException("Category not found");
        }

        const skip = (page - 1) * limit;

        const [products, totalCount] = await Promise.all([
            ProductModel.find({ category: categoryId })
                .populate("category", "name description")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            ProductModel.countDocuments({ category: categoryId }),
        ]);

        const totalPages = Math.ceil(totalCount / limit);

        return {
            products,
            category,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalCount,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1,
                limit,
            },
        };
    }
}