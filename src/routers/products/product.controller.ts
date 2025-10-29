import {
  memoizeAsync,
  onError,
  rateLimit,
  timeout,
  before,
} from "utils-decorators";
import {
  ProductCreationDto,
  ProductDto,
  ProductUpdateDto,
  ZodProductCreationDto,
  ZodProductUpdateDto,
} from "./dto/product.dto";
import { MapAsyncCache } from "@/utilities/cache/memory-cache";
import { convert, stringToInteger } from "@/utilities/conversion";
import config from "@/config";
import { ResponseError } from "@/utilities/error-handling";
import { products } from "@/db";
import { Product, ZodProduct } from "@/entities/product.entity";
import { Injectable } from "@/utilities/container";

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e.message);
}

const productsCache = new MapAsyncCache<ProductDto[]>(config.cacheSize);
const productCache = new MapAsyncCache<ProductDto>(config.cacheSize);

@Injectable()
/**
 * Controller for handling product-related operations
 * @class ProductController
 * @desc Provides methods for product management including CRUD operations
 */
export default class ProductController {
  // constructor(private readonly productService: ProductService) { }

  @onError({
    func: invalidInputHandler,
  })
  /**
   * Validates a string ID and converts it to a number.
   *
   * @param {string} id - The ID to validate and convert.
   * @returns {number} The numeric value of the provided ID.
   */
  public async validateId(id: string): Promise<number> {
    return stringToInteger(id);
  }

  @onError({
    func: invalidInputHandler,
  })
  /**
   * Validates and creates a new Product from the given DTO.
   *
   * @param {ProductCreationDto} product - The incoming ProductCreationDto to validate and transform.
   * @returns {Product} A fully formed Product object ready for persistence.
   */
  public async validateProductCreationDto(
    product: ProductCreationDto
  ): Promise<Product> {
    const newProduct = await ZodProductCreationDto.parseAsync(product);
    return { ...newProduct, id: products.length + 1 };
  }

  @onError({
    func: invalidInputHandler,
  })
  /**
   * Validates and creates a new Product from the given DTO.
   *
   * @param {ProductUpdateDto} product - The incoming ProductCreationDto to validate and transform.
   * @returns {Product} A fully formed Product object ready for persistence.
   */
  public async validateProductUpdateDto(
    product: ProductCreationDto
  ): Promise<Product> {
    const productDto = await ZodProductUpdateDto.parseAsync(product);
    let updatedProduct: Product = convert(productDto, ZodProduct);
    return { ...updatedProduct, id: products.length + 1 };
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Creates a new product with validated data
   * @param {Product} product - Product creation data validated by Zod schema
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(product: Product): Promise<void> {
    const newProduct: Product = {
      ...product,
      id: products.length + 1,
    };

    products.push(newProduct);
    await productCache.set(newProduct.id.toString(), newProduct as ProductDto);
    await productsCache.delete("key");
  }

  @memoizeAsync({
    cache: productsCache,
    keyResolver: () => "key",
    expirationTimeMs: config.memoizeTime,
  })
  @timeout(config.timeout)
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Retrieves all products with truncated descriptions
   * @returns List of products with summarized descriptions
   */
  public async getAll(): Promise<ProductDto[]> {
    return products as ProductDto[];
  }

  @memoizeAsync({
    cache: productCache,
    keyResolver: (id: number) => id.toString(),
    expirationTimeMs: config.memoizeTime,
  })
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
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
    return convert(product!, ZodProduct);
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Updates an existing product
   * @param {number} id - Product ID to update
   * @param {ProductUpdateDto} updateData - Partial product data to update
   * @returns {Promise<Product>} Updated product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format or update data
   */
  public async update(
    id: number,
    updateData: ProductUpdateDto
  ): Promise<ProductDto> {
    const product = await this.get(id);
    if (product != null) {
      Object.assign(product, updateData);
      await productCache.set(id.toString(), product);
      await productsCache.delete("key");
    } else {
      throw new ResponseError("Product dose not exist.", 404);
    }

    return product;
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Deletes a product by ID
   * @param {number} id - Product ID to delete
   * @returns {Promise<Product>} Deleted product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async delete(id: number): Promise<ProductDto> {
    const index = products.findIndex((product) => product.id === id);
    if (index == -1) {
      throw new ResponseError("Product dose not exist.", 404);
    }
    await productCache.delete(id.toString());
    await productsCache.delete("key");
    return products.splice(index, 1)[0];
  }
}
