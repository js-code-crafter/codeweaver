import z from "zod";

/**
 * Zod schema for Order entity
 */
export const ZodOrder = z.object({
  /** Unique identifier */
  id: z.number().min(1).int(),

  /** Associated user ID */
  userId: z.number().min(1).int(),

  /** Array of ordered products */
  products: z.array(
    z.object({
      productId: z.number().min(1).int(),
      quantity: z.number().min(1).int(),
    })
  ),

  /** Order status */
  status: z.enum(["Processing", "Delivered", "Canceled"]),

  /** Total price  */
  total: z.number().min(1000),

  /** Creation timestamp */
  createdAt: z.date(),

  /** Cancellation timestamp */
  canceledAt: z.date().optional(),

  /** Delivery timestamp */
  deliveredAt: z.date().optional(),
});

export type Order = {
  id: number;
  userId: number;
  products: {
    productId: number;
    quantity: number;
  }[];
  status: "Processing" | "Delivered" | "Canceled";
  total: number;
  createdAt: Date;
  canceledAt?: Date | undefined;
  deliveredAt?: Date | undefined;
};
