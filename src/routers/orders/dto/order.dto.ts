import { z } from "zod";

/**
 * Zod schema for Order entity
 * @typedef {Object} ZodOrder
 * @property {number} id - Unique identifier (min 1)
 * @property {number} userId - Associated user ID (min 1)
 * @property {{productId: number, quantity: number}[]} products - Array of ordered products
 * @property {"Processing"|"Delivered"|"Canceled"} status - Order status
 * @property {number} total - Total price (min 1000)
 * @property {Date} createdAt - Creation timestamp
 * @property {Date} [canceledAt] - Cancellation timestamp
 * @property {Date} [deliveredAt] - Delivery timestamp
 */
export const ZodOrder = z.object({
  id: z.number().min(1).int(),
  userId: z.number().min(1).int(),
  products: z.array(
    z.object({
      productId: z.number().min(1).int(),
      quantity: z.number().min(1).int(),
    })
  ),
  status: z.enum(["Processing", "Delivered", "Canceled"]),
  total: z.number().min(1000),
  createdAt: z.date(),
  canceledAt: z.date().optional(),
  deliveredAt: z.date().optional(),
});

export const ZodOrderCreationDto = ZodOrder.omit({
  id: true,
  status: true,
  createdAt: true,
  canceledAt: true,
  deliveredAt: true,
});

export type Order = z.infer<typeof ZodOrder>;
export type OrderCreationDto = z.infer<typeof ZodOrderCreationDto>;
