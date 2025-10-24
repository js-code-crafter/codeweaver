import { ZodOrder } from "@/entities/order.entity";
import { z } from "zod";

export const ZodOrderCreationDto = ZodOrder.omit({
  id: true,
  status: true,
  createdAt: true,
  canceledAt: true,
  deliveredAt: true,
});

export type OrderCreationDto = {
  userId: number;
  products: {
    productId: number;
    quantity: number;
  }[];
  total: number;
};

export type OrderDto = {
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
