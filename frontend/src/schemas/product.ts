import { z } from "zod";
import { PRODUCT_CATEGORIES } from "../types/product";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(150),
  brand: z.string().min(1, "Brand is required").max(100),
  category: z.enum(PRODUCT_CATEGORIES),
  description: z.string(),
  price: z
    .string()
    .min(1, "Price is required")
    .refine((v) => Number(v) > 0, "Price must be greater than 0."),
  stock: z
    .string()
    .min(1, "Stock is required")
    .regex(/^\d+$/, "Stock must be a whole number, 0 or more."),
  image_url: z.union([z.literal(""), z.url("Enter a valid URL.")]),
  is_active: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
