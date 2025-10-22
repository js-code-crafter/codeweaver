import { z } from "zod";

/**
 * Zod schema for Product entity
 * @typedef {Object} ZodProduct
 * @property {number} id - Unique identifier (min 1)
 * @property {string} name - Product name (min 2 chars)
 * @property {number} price - Product price (min 1000)
 * @property {string} [description] - Optional description (min 10 chars)
 * @property {string} category - Product category from predefined enum
 * @property {number} stock - Available stock quantity (min 0)
 */
export const ZodProduct = z.object({
  id: z.number().min(1).int(),
  name: z.string().min(2),
  price: z.number().min(1000),
  description: z.string().min(10).optional(),
  category: z.enum([
    "Electronics",
    "Appliances",
    "Sports",
    "Kitchen",
    "Mobile Accessories",
    "Computer Accessories",
    "Home Appliances",
    "Books",
  ]),
  stock: z.number().min(0).int(),
});

export const ZodProductCreationDto = ZodProduct.omit({ id: true });
export const ZodProductUpdateDto = ZodProductCreationDto.partial();

export type Product = z.infer<typeof ZodProduct>;
export type ProductCreationDto = z.infer<typeof ZodProductCreationDto>;
export type ProductUpdateDto = z.infer<typeof ZodProductUpdateDto>;
export type ProductDto = z.infer<typeof ZodProduct>;
