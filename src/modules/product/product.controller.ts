import { Request, Response } from "express";
import { createCategorySchema, createProductSchema, productSearchSchema } from "../../common/validators/product.validator";
import { HTTPSTATUS } from "../../config/http.config";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { ProductService } from "./product.service";


export class ProductController {
    private productService: ProductService;

    constructor(productService: ProductService) {
        this.productService = productService;
    }

    /**
     * @desc User registration
     * @route POST /product/create
     * @access Public
     */
    public createProduct = asyncHandler(
        async (req: Request, res: Response) => {
            const image = req?.file;
            const body = createProductSchema.parse({
                ...req.body,
                image: {
                    imageUrl: image?.path,
                    fileName: image?.filename,
                }
            });

            const { product } = await this.productService.createProduct(body);

            return res.status(HTTPSTATUS.CREATED).json({
                message: "Product created successfully",
                product
            });

        }
    )

    /**
    * @desc Create category
    * @route POST /product/create-category
    * @access Admin
    */
    public createCategory = asyncHandler(
        async (req: Request, res: Response) => {
            const body = createCategorySchema.parse({
                ...req.body
            })

            const { category } = await this.productService.createCategory(body);

            return res.status(HTTPSTATUS.CREATED).json({
                message: "Product created successfully",
                category
            });

        }
    )

    /**
   * @desc Search products
   * @route GET /product/search
   * @access Public
   */
    public searchProducts = asyncHandler(
        async (req: Request, res: Response) => {
            const searchParams = productSearchSchema.parse({
                q: req.query.q,
                category: req.query.category,
                minPrice: req.query.minPrice ? Number(req.query.minPrice) : undefined,
                maxPrice: req.query.maxPrice ? Number(req.query.maxPrice) : undefined,
                sortBy: req.query.sortBy || 'createdAt',
                sortOrder: req.query.sortOrder || 'desc',
                page: req.query.page ? Number(req.query.page) : 1,
                limit: req.query.limit ? Number(req.query.limit) : 10,
                inStock: req.query.inStock ? req.query.inStock === 'true' : undefined,
            });

            const result = await this.productService.searchProducts(searchParams);

            return res.status(HTTPSTATUS.OK).json({
                message: "Products retrieved successfully",
                ...result
            });
        }
    )

    /**
     * @desc Get all products
     * @route GET /product/all
     * @access Public
     */
    public getAllProducts = asyncHandler(
        async (req: Request, res: Response) => {
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 10;
            const allowedSortBy = ['name', 'price', 'createdAt'] as const;
            const allowedSortOrder = ['asc', 'desc'] as const;
            const sortBy = allowedSortBy.includes(req.query.sortBy as any)
                ? (req.query.sortBy as 'name' | 'price' | 'createdAt')
                : 'createdAt';
            const sortOrder = allowedSortOrder.includes(req.query.sortOrder as any)
                ? (req.query.sortOrder as 'asc' | 'desc')
                : 'desc';

            const searchParams = {
                sortBy,
                sortOrder,
                page,
                limit,
            };

            const result = await this.productService.searchProducts(searchParams);

            return res.status(HTTPSTATUS.OK).json({
                message: "Products retrieved successfully",
                ...result
            });
        }
    )

    /**
     * @desc Get product by ID
     * @route GET /product/:id
     * @access Public
     */
    public getProductById = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const { product } = await this.productService.getProductById(id);

            return res.status(HTTPSTATUS.OK).json({
                message: "Product retrieved successfully",
                product
            });
        }
    )

    /**
    * @desc Get all categories
    * @route GET /product/categories
    * @access Public
    */
    public getCategories = asyncHandler(
        async (req: Request, res: Response) => {
            const { categories } = await this.productService.getCategories();

            return res.status(HTTPSTATUS.OK).json({
                message: "Categories retrieved successfully",
                categories
            });
        }
    )

    /**
    * @desc Update product
    * @route PUT /product/:id
    * @access Admin
    */
    public updateProduct = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const image = req?.file;

            let updateData = { ...req.body };

            // If new image is uploaded, include it in update data
            if (image) {
                updateData.image = {
                    imageUrl: image.path,
                    fileName: image.filename,
                };
            }

            const { product } = await this.productService.updateProduct(id, updateData);

            return res.status(HTTPSTATUS.OK).json({
                message: "Product updated successfully",
                product
            });
        }
    )

    /**
     * @desc Delete product
     * @route DELETE /product/:id
     * @access Admin
     */
    public deleteProduct = asyncHandler(
        async (req: Request, res: Response) => {
            const { id } = req.params;
            const result = await this.productService.deleteProduct(id);

            return res.status(HTTPSTATUS.OK).json(result);
        }
    )

    /**
     * @desc Get products by category
     * @route GET /product/category/:categoryId
     * @access Public
     */
    public getProductsByCategory = asyncHandler(
        async (req: Request, res: Response) => {
            const { categoryId } = req.params;
            const page = req.query.page ? Number(req.query.page) : 1;
            const limit = req.query.limit ? Number(req.query.limit) : 10;

            const result = await this.productService.getProductsByCategory(categoryId, page, limit);

            return res.status(HTTPSTATUS.OK).json({
                message: "Products retrieved successfully",
                ...result
            });
        }
    )

}