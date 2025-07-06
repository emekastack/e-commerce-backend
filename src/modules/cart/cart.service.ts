import { z } from "zod";
import { addToCartSchema, updateCartItemSchema } from "../../common/validators/product.validator";
import CartModel from "../../database/models/cart.model";
import ProductModel from "../../database/models/product.model";
import { BadRequestException, NotFoundException } from "../../common/utils/catch-errors";
import mongoose from "mongoose";



export class CartService {
    // GET USER CART
    public async getCart(userId: string) {
        const cart = await CartModel.findOne({ userId })
            .populate({
                path: "items.product",
                select: "name price imageUrl",
            })
            .select("items totalAmount");

        if (!cart) {
            // Create empty cart if it doesn't exist
            const newCart = await CartModel.create({
                userId,
                items: [],
                totalAmount: 0,
            });
            return { cart: newCart, total: 0, itemCount: 0 };
        }

        // Calculate total and item count
        const total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const itemCount = cart.items.reduce((count, item) => count + item.quantity, 0);

        return { cart, total, itemCount };
    }

    // ADD TO CART
    public async addToCart(userId: string, cartData: z.infer<typeof addToCartSchema>) {
        const { productId, quantity } = cartData;

        // Validate product exists and is in stock
        const product = await ProductModel.findById(productId);
        if (!product) {
            throw new NotFoundException("Product not found");
        }

        if (product.outOfStock) {
            throw new BadRequestException("Product is out of stock");
        }

        // Find or create cart
        let cart = await CartModel.findOne({ userId });
        if (!cart) {
            cart = await CartModel.create({
                userId,
                items: [],
                totalAmount: 0,
            });
        }

        // Check if product already exists in cart
        const existingItemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (existingItemIndex > -1) {
            // Update quantity if item exists
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // Check if adding this new item would exceed the 10 item limit
            if (cart.items.length >= 10) {
                throw new BadRequestException("Cart cannot have more than 10 items. Please check outbefore adding new ones.");
            }
            // Add new item to cart
            cart.items.push({
                product: new mongoose.Types.ObjectId(productId),
                quantity,
                price: product.price,
            } as any);
        }

        await cart.save();

        // Populate the cart before returning
        // const populatedCart = await CartModel.findById(cart._id)
        // .populate({
        //     path: "items.product",
        //     select: "name description price imageUrl outOfStock category",
        //     populate: {
        //         path: "category",
        //         select: "name",
        //     },
        // });

        return { message: "Item added successfully" };
    }

    // UPDATE CART ITEM
    public async updateCartItem(userId: string, updateData: z.infer<typeof updateCartItemSchema>) {
        const { productId, quantity } = updateData;

        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            throw new NotFoundException("Cart not found");
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            throw new NotFoundException("Item not found in cart");
        }

        if (quantity === 0) {
            // Remove item if quantity is 0
            cart.items.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart.items[itemIndex].quantity = quantity;
        }

        await cart.save();

        // Populate the cart before returning
        // const populatedCart = await CartModel.findById(cart._id).populate({
        //     path: "items.product",
        //     select: "name description price imageUrl outOfStock category",
        //     populate: {
        //         path: "category",
        //         select: "name",
        //     },
        // });

        return { message: "Cart item update successfully" };
    }

    // REMOVE FROM CART
    public async removeFromCart(userId: string, productId: string) {
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            throw new NotFoundException("Cart not found");
        }

        const itemIndex = cart.items.findIndex(
            (item) => item.product.toString() === productId
        );

        if (itemIndex === -1) {
            throw new NotFoundException("Item not found in cart");
        }

        cart.items.splice(itemIndex, 1);
        await cart.save();

        // Populate the cart before returning
        // const populatedCart = await CartModel.findById(cart._id).populate({
        //     path: "items.product",
        //     select: "name description price imageUrl outOfStock category",
        //     populate: {
        //         path: "category",
        //         select: "name",
        //     },
        // });

        return { message: "Cart item removed successfully" };
    }

    // CLEAR CART
    public async clearCart(userId: string) {
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            throw new NotFoundException("Cart not found");
        }

        cart.items = [];
        cart.totalAmount = 0;
        await cart.save();

        return { cart };
    }

    // GET CART ITEMS COUNT
    public async getCartItemsCount(userId: string): Promise<{ count: number }> {
        const cart = await CartModel.findOne({ userId });
        if (!cart) {
            return { count: 0 };
        }

        // const count = cart.items.reduce((total, item) => total + item.quantity, 0);
        const count = cart.items.length;
        return { count };
    }

   

    // VALIDATE CART ITEMS
    public async validateCartItems(userId: string): Promise<{ isValid: boolean; errors: string[] }> {
        const cart = await CartModel.findOne({ userId }).populate("items.product");
        if (!cart) {
            return { isValid: false, errors: ["Cart not found"] };
        }

        const errors: string[] = [];

        for (const item of cart.items) {
            const product = item.product as any;

            if (!product) {
                errors.push(`Product no longer exists`);
                continue;
            }

            if (product.outOfStock) {
                errors.push(`${product.name} is out of stock`);
            }

            if (item.price !== product.price) {
                errors.push(`Price changed for ${product.name}`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

}