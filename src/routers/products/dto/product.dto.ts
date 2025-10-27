import { ZodProduct } from "@/entities/product.entity";
import z from "zod";

/**
 * DTO for creating a Product.
 * Derived from the full Product schema by omitting the system-generated id.
 */
export const ZodProductCreationDto = ZodProduct.omit({ id: true });

/**
 * DTO for updating a Product.
 * All fields are optional to support partial updates (PATCH semantics).
 */
export const ZodProductUpdateDto = ZodProductCreationDto.partial();

/**
 * Product categories supported by the system.
 * Centralized to avoid repeating the union type in multiple places.
 */
export type ProductCategory =
  | "Electronics"
  | "Appliances"
  | "Sports"
  | "Kitchen"
  | "Mobile Accessories"
  | "Computer Accessories"
  | "Home Appliances"
  | "Books";

/**
 * Data required to create a Product.
 */
export type ProductCreationDto = {
  /** Product name. */
  name: string;

  /** Product price. */
  price: number;

  /** Category from the predefined list. */
  category: ProductCategory;

  /** Stock count in inventory. Non-negative. */
  stock: number;

  /** Optional product description. */
  description?: string | undefined;
};

/**
 * Data for updating a Product.
 * All fields are optional to support partial updates.
 */
export type ProductUpdateDto = {
  /** Optional product name. */
  name?: string | undefined;

  /** Optional product price. */
  price?: number | undefined;

  /** Optional product description. */
  description?: string | undefined;

  /** Optional product category. Must be one of the predefined categories if provided. */
  category?: ProductCategory | undefined;

  /** Optional stock count in inventory. */
  stock?: number | undefined;
};

/**
 * Data Transfer Object representing a full Product (as returned by APIs, etc.).
 */
export type ProductDto = {
  /** Unique identifier for the product. */
  id: number;

  /** Product name. */
  name: string;

  /** Product price. */
  price: number;

  /** Category of the product. */
  category: ProductCategory;

  /** Stock count in inventory. */
  stock: number;

  /** Optional product description. */
  description?: string | undefined;
};
