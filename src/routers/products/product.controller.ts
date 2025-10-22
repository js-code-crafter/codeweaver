import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import {
  Product,
  ProductCreationDto,
  ProductDto,
  ProductUpdateDto,
  ZodProductCreationDto,
  ZodProductUpdateDto,
} from "./dto/product.dto";
import { Validate, ZodInput } from "ts-zod4-decorators";
import { MapAsyncCache, ResponseError } from "@/utilities/types";
import { parseId } from "@/utilities/error-handling";
import config from "@/config";

// Array to store products (as a mock database)
const products: Product[] = [
  {
    id: 1,
    name: "ASUS ROG Zephyrus G15",
    price: 45000000,
    description: "Gaming laptop with AMD Ryzen 9 5900HS and RTX 3080 GPU",
    category: "Electronics",
    stock: 15,
  },
  {
    id: 2,
    name: "Sony WH-1000XM5 Wireless Headphones",
    price: 12000000,
    description:
      "Premium noise-canceling over-ear headphones with 30hr battery",
    category: "Electronics",
    stock: 8,
  },
  {
    id: 3,
    name: "LG Smart Inverter Microwave",
    price: 25000000,
    description: "1.7 cu.ft countertop microwave with smart sensor cooking",
    category: "Appliances",
    stock: 5,
  },
  {
    id: 4,
    name: "Trek Marlin 5 Mountain Bike",
    price: 18000000,
    description: "Entry-level mountain bike with aluminum frame and 21 speeds",
    category: "Sports",
    stock: 3,
  },
  {
    id: 5,
    name: "DeLonghi Espresso Machine",
    price: 6500000,
    description: "Compact espresso maker with manual milk frother",
    category: "Kitchen",
    stock: 12,
  },
  {
    id: 6,
    name: "Anker Wireless Charger",
    price: 1200000,
    description: "15W fast wireless charger with anti-slip surface",
    category: "Mobile Accessories",
    stock: 30,
  },
  {
    id: 7,
    name: "Logitech MX Master 3 Mouse",
    price: 4500000,
    description: "Ergonomic wireless mouse with Darkfield tracking",
    category: "Computer Accessories",
    stock: 18,
  },
  {
    id: 8,
    name: "Kindle Paperwhite",
    price: 3800000,
    description: 'Waterproof e-reader with 6.8" 300ppi display',
    category: "Electronics",
    stock: 9,
  },
  {
    id: 9,
    name: "Dyson V11 Vacuum Cleaner",
    price: 32000000,
    description: "Cordless stick vacuum with LCD screen and 60min runtime",
    category: "Home Appliances",
    stock: 7,
  },
];

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function getProductErrorHandler(e: Error) {
  const message = "Product not found.";
  throw new ResponseError(message, 404, e.message);
}

const productsCache = new MapAsyncCache<Product[]>();
const productCache = new MapAsyncCache<Product>();

/**
 * Controller for handling product-related operations
 * @class ProductController
 * @desc Provides methods for product management including CRUD operations
 */
export default class ProductController {
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
  public async create(
    @ZodInput(ZodProductCreationDto) product: ProductCreationDto
  ): Promise<ProductDto> {
    products.push({
      ...product,
      id: products.length + 1,
    } satisfies Product);

    return product as ProductDto;
  }

  @memoizeAsync({
    cache: productsCache,
    keyResolver: (param) => param,
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
  public async getAll(param: null): Promise<ProductDto[]> {
    param = null;
    return products.map((product) => {
      return {
        ...product,
        description: product.description?.substring(0, 50) + "..." || "",
      };
    });
  }

  @memoizeAsync({
    cache: productCache,
    keyResolver: (id) => id,
    expirationTimeMs: config.memoizeTime,
  })
  @onError({
    func: getProductErrorHandler,
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
  public async get(id: string): Promise<ProductDto> {
    const productId = parseId(id);
    const product = products.find((product) => product.id === productId);
    if (product == null) throw new ResponseError("User dose not exist.", 404);
    return product;
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
    id: string,
    @ZodInput(ZodProductUpdateDto) updateData: ProductUpdateDto
  ): Promise<ProductDto> {
    const product = await this.get(id);
    if ("id" in product == false) return product satisfies ResponseError;

    if (product) {
      Object.assign(product, updateData);
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
  public async delete(id: string): Promise<ProductDto> {
    const productId = parseId(id);
    const index = products.findIndex((product) => product.id === productId);
    if (index == -1) throw new ResponseError("Product dose not exist.", 404);
    productCache.delete(id);
    productsCache.delete("");
    return products.splice(index, 1)[0];
  }
}
