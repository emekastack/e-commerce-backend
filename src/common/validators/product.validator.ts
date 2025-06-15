import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Product description is required"),
  price: z.number().positive("Price must be positive"),
  category: z.string().min(1, "Category is required"),
  outOfStock: z.boolean().optional(),
  image: z.object({
    imageUrl: z.string().min(1, "Image URL is required"),
    fileName: z.string().min(1, "File name is required"),
  }),
});

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
});

export const productSearchSchema = z.object({
  q: z.string().optional(), // Search query
  category: z.string().optional(), // Category filter
  minPrice: z.number().positive().optional(), // Minimum price filter
  maxPrice: z.number().positive().optional(), // Maximum price filter
  sortBy: z.enum(["name", "price", "createdAt"]).optional().default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
  page: z.number().positive().optional().default(1),
  limit: z.number().positive().max(100).optional().default(10),
  inStock: z.boolean().optional(), // Filter by stock status
});

export const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().positive("Quantity must be positive"),
});

export const updateCartItemSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().positive("Quantity must be positive"),
});

export const checkoutSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    address: z.string().min(1, "Address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    country: z.string().min(1, "Country is required"),
    zipCode: z.string().min(1, "Zip code is required"),
    phone: z.string().min(1, "Phone number is required"),
  }),
});

export const verifyPaymentSchema = z.object({
  reference: z.string().min(1, "Payment reference is required"),
});