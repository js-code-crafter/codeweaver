import z from "zod";

/**
 * Zod schema for the Order entity.
 * This schema validates orders to ensure data integrity before processing.
 */
export const ZodOrder = z.object({
  /** Unique identifier for the order (positive integer). */
  id: z.number().min(1).int(),

  /** ID of the user who placed the order (positive integer). */
  userId: z.number().min(1).int(),

  /** Array of ordered products with their quantities. */
  products: z.array(
    z.object({
      /** Product identifier referenced in the catalog */
      productId: z.number().min(1).int(),

      /** Quantity of the product ordered (at least 1) */
      quantity: z.number().min(1).int(),
    })
  ),

  /** Current status of the order */
  status: z.enum(["Processing", "Delivered", "Canceled"]),

  /** Total price of the order (minimum value constraint is 1000) */
  total: z.number().min(1000),

  /** Timestamp when the order was created */
  createdAt: z.date(),

  /** Optional timestamp when the order was canceled */
  canceledAt: z.date().optional(),

  /** Optional timestamp when the order was delivered */
  deliveredAt: z.date().optional(),
});

export type Order = {
  /** Unique identifier for the order */
  id: number;

  /** User ID who placed the order */
  userId: number;

  /** List of products in the order with quantities */
  products: {
    productId: number;
    quantity: number;
  }[];

  /** Order status: Processing, Delivered, or Canceled */
  status: "Processing" | "Delivered" | "Canceled";

  /** Total price of the order */
  total: number;

  /** Order creation timestamp */
  createdAt: Date;

  /** Optional cancellation timestamp (if canceled) */
  canceledAt?: Date | undefined;

  /** Optional delivery timestamp (if delivered) */
  deliveredAt?: Date | undefined;
};
