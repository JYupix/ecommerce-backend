import { z } from "zod";

export const createCategorySchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name too long"),
    description: z.string().trim().max(255, "Description too long").optional(),
});

export const updateCategorySchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(50, "Name too long").optional(),
    description: z.string().trim().max(255, "Description too long").optional(),
    isActive: z.boolean().optional(),  
})