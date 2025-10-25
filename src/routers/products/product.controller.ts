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
import { Validate, ZodInput } from "ts-zod4-decorators";
import { MapAsyncCache } from "@/utilities/cache/memory-cache";
import { toInteger } from "@/utilities/conversion";
import config from "@/config";
import { ResponseError } from "@/utilities/error-handling";
import { products } from "@/db";
import { Product } from "@/entities/product.entity";

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function productNotFoundHandler(e: ResponseError) {
  const message = "Product not found.";
  throw new ResponseError(message, 404, e.message);
}

function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e.message);
}

const productsCache = new MapAsyncCache<ProductDto[]>(config.cacheSize);
const productCache = new MapAsyncCache<ProductDto>(config.cacheSize);

/**
 * Controller for handling product-related operations
 * @class ProductController
 * @desc Provides methods for product management including CRUD operations
 */
export default class ProductController {
  // constructor(private readonly productService: ProductService) { }

  @onError({
    func: productNotFoundHandler,
  })
  public validateId(id: string): number {
    return toInteger(id);
  }

  @onError({
    func: invalidInputHandler,
  })
  public validateProductCreationDto(product: ProductCreationDto): Product {
    const newProduct = ZodProductCreationDto.parse(product);
    return { ...newProduct, id: products.length + 1 };
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  @Validate
  /**
   * Creates a new product with validated data
   * @param product - Product creation data validated by Zod schema
   * @returns Newly created product with generated ID
   */
  public async create(product: Product): Promise<void> {
    const newProduct: Product = {
      ...product,
      id: products.length + 1,
    };

    products.push(newProduct);
    productCache.set(newProduct.id.toString(), newProduct as ProductDto);
    productsCache.delete("key");
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
    keyResolver: (id: string) => id,
    expirationTimeMs: config.memoizeTime,
  })
  @onError({
    func: productNotFoundHandler,
  })
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Finds a product by its ID
   * @param id - Product ID as string
   * @returns Product details or error object if not found
   */
  public async get(id: number): Promise<ProductDto> {
    const product = products.find((product) => product.id === id);
    if (product == null) {
      throw new ResponseError("Product dose not exist.", 404);
    }
    return product as ProductDto;
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  @Validate
  /**
   * Updates an existing product
   * @param {string} id - Product ID to update
   * @param {ProductUpdateDto} updateData - Partial product data to update
   * @returns {Promise<Product>} Updated product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format or update data
   */
  public async update(
    id: number,
    @ZodInput(ZodProductUpdateDto) updateData: ProductUpdateDto
  ): Promise<ProductDto> {
    const product = await this.get(id);
    if (product != null) {
      Object.assign(product, updateData);
      productCache.set(id.toString(), product);
      productsCache.delete("key");
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
   * @param {string} id - Product ID to delete
   * @returns {Promise<Product>} Deleted product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async delete(id: number): Promise<ProductDto> {
    const index = products.findIndex((product) => product.id === id);
    if (index == -1) {
      throw new ResponseError("Product dose not exist.", 404);
    }
    productCache.delete(id.toString());
    productsCache.delete("key");
    return products.splice(index, 1)[0];
  }
}
