import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { createCategorySchema, createProductSchema } from "../../common/validators/product.validator";
import { ProductService } from "./product.service";
import cloudinary from "../../config/cloudinary.config";
import { BadRequestException } from "../../common/utils/catch-errors";
import { HTTPSTATUS } from "../../config/http.config";


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
}