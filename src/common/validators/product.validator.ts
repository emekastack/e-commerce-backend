import { z } from "zod";
import mongoose from "mongoose";

export const createProductSchema = z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(1000),
    price: z.preprocess(
        (val) => typeof val === "string" ? Number(val) : val,
        z.number().positive()
    ),
    image: z.object({
        imageUrl: z.string().trim().url(),
        fileName: z.string().min(1),
    }),
    category: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid category id",
  }),
    outOfStock: z.boolean().optional(),
})

export const createCategorySchema = z.object({
    name: z.string().trim().min(1).max(255),
    description: z.string().trim().min(1).max(1000),
})