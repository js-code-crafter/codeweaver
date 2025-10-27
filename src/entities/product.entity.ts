import z from "zod";

/**
 * Zod schema for the Product entity.
 * This schema validates product data to ensure consistency
 * before it is stored or processed.
 */
export const ZodProduct = z.object({
  /** Unique identifier for the product. Must be a positive integer. */
  id: z.number().min(1).int(),

  /** Product name. Minimum length of 2 characters. */
  name: z.string().min(2),

  /** Product price. Minimum value of 1000 (assuming your currency unit). */
  price: z.number().min(1000),

  /** Optional product description. Minimum length of 10 characters if provided. */
  description: z.string().min(10).optional(),

  /** Product category from a predefined list. */
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

  /** Stock count in inventory. Non-negative integer. */
  stock: z.number().min(0).int(),
});

/**
 * TypeScript type for a Product entity.
 * Mirrors the Zod schema with an optional description.
 */
export type Product = {
  /** Unique identifier for the product. */
  id: number;

  /** Display name of the product. */
  name: string;

  /** Price of the product in the chosen currency. */
  price: number;

  /**
   * Category of the product.
   * Must be one of the predefined categories:
   * - Electronics, Appliances, Sports, Kitchen, Mobile Accessories,
   *   Computer Accessories, Home Appliances, Books
   */
  category:
    | "Electronics"
    | "Appliances"
    | "Sports"
    | "Kitchen"
    | "Mobile Accessories"
    | "Computer Accessories"
    | "Home Appliances"
    | "Books";

  /** Current stock level in inventory. Non-negative. */
  stock: number;

  /**
   * Optional product description.
   * Includes more details about the product when provided.
   */
  description?: string | undefined;
};