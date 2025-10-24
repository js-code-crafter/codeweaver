import z from "zod";

/**
 * Zod schema for Product entity
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

export type Product = {
  id: number;
  name: string;
  price: number;
  category:
    | "Electronics"
    | "Appliances"
    | "Sports"
    | "Kitchen"
    | "Mobile Accessories"
    | "Computer Accessories"
    | "Home Appliances"
    | "Books";
  stock: number;
  description?: string | undefined;
};
