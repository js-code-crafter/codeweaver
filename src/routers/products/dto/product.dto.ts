import { ZodProduct } from "@/entities/product.entity";
import z from "zod";

export const ZodProductCreationDto = ZodProduct.omit({ id: true });
export const ZodProductUpdateDto = ZodProductCreationDto.partial();

export type ProductCreationDto = {
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

export type ProductUpdateDto = {
  name?: string | undefined;
  price?: number | undefined;
  description?: string | undefined;
  category?:
    | "Electronics"
    | "Appliances"
    | "Sports"
    | "Kitchen"
    | "Mobile Accessories"
    | "Computer Accessories"
    | "Home Appliances"
    | "Books"
    | undefined;
  stock?: number | undefined;
};

export type ProductDto = {
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
