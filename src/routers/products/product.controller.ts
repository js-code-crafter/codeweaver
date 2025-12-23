import {
  ProductCreationDto,
  ProductDto,
  ProductUpdateDto,
  ZodProductDto,
} from "./dto/product.dto";
import { Invalidate, MapAsyncCache, Memoize } from "@/core/cache";
import { convert, stringToInteger } from "@/core/helpers";
import { config } from "@/config";
import { ResponseError } from "@/core/error";
import { products } from "@/db";
import { Product, ZodProduct } from "@/entities/product.entity";
import { Injectable } from "@/core/container";
import { assign } from "@/core/helpers";
import { parallelMap } from "@/core/parallel";
import { ErrorHandler, Timeout } from "@/core/middlewares";
import { RateLimit } from "@/core/rate-limit";

async function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e.message);
}

const productsCache = new MapAsyncCache<ProductDto[]>(1);
const productCache = new MapAsyncCache<ProductDto>(config.cacheSize);

@Injectable()
/**
 * Controller for handling product-related operations
 * @class ProductController
 * @desc Provides methods for product management including CRUD operations
 */
export default class ProductController {
  // constructor(private readonly productService: ProductService) { }

  @ErrorHandler(invalidInputHandler)
  /**
   * Validates a string ID and converts it to a number.
   *
   * @param {string} id - The ID to validate and convert.
   * @returns {number} The numeric value of the provided ID.
   */
  public async validateId(id: string): Promise<number> {
    return stringToInteger(id);
  }

  @ErrorHandler(invalidInputHandler)
  /**
   * Validates and creates a new Product from the given DTO.
   *
   * @param {ProductCreationDto} product - The incoming ProductCreationDto to validate and transform.
   * @returns {Product} A fully formed Product object ready for persistence.
   */
  public async validateProductCreationDto(
    product: ProductCreationDto
  ): Promise<Product> {
    return await convert({ ...product, id: products.length + 1 }, ZodProduct);
  }

  @ErrorHandler(invalidInputHandler)
  /**
   * Validates and creates a new Product from the given DTO.
   *
   * @param {ProductUpdateDto} product - The incoming ProductCreationDto to validate and transform.
   * @returns {Product} A fully formed Product object ready for persistence.
   */
  public async validateProductUpdateDto(
    product: ProductUpdateDto
  ): Promise<Product> {
    return await convert(product, ZodProduct);
  }

  @Invalidate(productsCache, true)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Creates a new product with validated data
   * @param {Product} product - Product creation data validated by Zod schema
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(product: Product): Promise<void> {
    products.push(product);
  }

  @Memoize(productsCache, () => "key")
  @Timeout(config.timeout)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Retrieves all products with truncated descriptions
   * @returns List of products with summarized descriptions
   */
  public async getAll(
    timeoutSignal?: AbortSignal
  ): Promise<(ProductDto | null)[]> {
    return await parallelMap(products, async (product) =>
      timeoutSignal?.aborted == false
        ? await convert<Product, ProductDto>(product, ZodProductDto)
        : null
    );
  }

  @Memoize(productCache)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Finds a product by its ID
   * @param {number} id - Product ID as string
   * @returns Product details or error object if not found
   */
  public async get(id: number): Promise<ProductDto> {
    const product = products.find((product) => product.id === id);
    if (product == null) {
      throw new ResponseError("Product not found");
    }
    return await convert(product, ZodProduct);
  }

  @Invalidate(productCache)
  @Invalidate(productsCache, true)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Updates an existing product
   * @param {number} id - Product ID to update
   * @param {ProductUpdateDto} updateData - Partial product data to update
   * @returns {Promise<Product>} Updated product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format or update data
   */
  public async update(id: number, updateData: Product): Promise<void> {
    if (id != updateData.id) {
      throw new ResponseError("Product ID is immutable.", 400);
    }
    const product = await this.get(id);
    if (product != null) {
      await assign(product, updateData, ZodProduct);
    } else {
      throw new ResponseError("Product dose not exist.", 404);
    }
  }

  @Invalidate(productCache)
  @Invalidate(productsCache, true)
  @RateLimit(config.rateLimitTimeSpan, config.rateLimitAllowedCalls)
  /**
   * Deletes a product by ID
   * @param {number} id - Product ID to delete
   * @returns {Promise<Product>} Deleted product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async delete(id: number): Promise<void> {
    const index = products.findIndex((product) => product.id === id);
    if (index == -1) {
      throw new ResponseError("Product dose not exist.", 404);
    }
    products.splice(index, 1)[0];
  }
}
