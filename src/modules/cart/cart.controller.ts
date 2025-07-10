import { Request, Response } from "express";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { addToCartSchema, updateCartItemSchema } from "../../common/validators/product.validator";
import { CartService } from "./cart.service";
import { HTTPSTATUS } from "../../config/http.config";

export class CartController {
    private cartService: CartService;

    constructor(cartService: CartService) {
        this.cartService = cartService;
    }

    /**
     * @desc Get user cart
     * @route GET /cart
     * @access Private
     */
    public getCart = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const { cart } = await this.cartService.getCart(userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Cart retrieved successfully",
                cart
            });
        }
    );

    /**
     * @desc Add item to cart
     * @route POST /cart/add
     * @access Private
     */
    public addToCart = asyncHandler(
        async (req: Request, res: Response) => {
           const userId = (req as any).user?.userId;
            const cartData = addToCartSchema.parse(req.body);

            const { message } = await this.cartService.addToCart(userId, cartData);

            return res.status(HTTPSTATUS.OK).json({
                message
            });
        }
    );

    /**
     * @desc Update cart item quantity
     * @route PUT /cart/update
     * @access Private
     */
    public updateCartItem = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const updateData = updateCartItemSchema.parse(req.body);

            const { message } = await this.cartService.updateCartItem(userId, updateData);

            return res.status(HTTPSTATUS.OK).json({
                message,
            });
        }
    );

    /**
     * @desc Remove item from cart
     * @route DELETE /cart/remove/:productId
     * @access Private
     */
    public removeFromCart = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const { productId } = req.params;

            const { message } = await this.cartService.removeFromCart(userId, productId);

            return res.status(HTTPSTATUS.OK).json({
                message,
            });
        }
    );

    /**
     * @desc Clear entire cart
     * @route DELETE /cart/clear
     * @access Private
     */
    public clearCart = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const { cart } = await this.cartService.clearCart(userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Cart cleared successfully",
                cart
            });
        }
    );

    /**
     * @desc Get cart items count
     * @route GET /cart/count
     * @access Private
     */
    public getCartItemsCount = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const { count } = await this.cartService.getCartItemsCount(userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Cart items count retrieved successfully",
                count
            });
        }
    );

    /**
     * @desc Validate cart items
     * @route GET /cart/validate
     * @access Private
     */
    public validateCartItems = asyncHandler(
        async (req: Request, res: Response) => {
            const userId = (req as any).user?.userId;
            const result = await this.cartService.validateCartItems(userId);

            return res.status(HTTPSTATUS.OK).json({
                message: "Cart validation completed",
                ...result
            });
        }
    );
}