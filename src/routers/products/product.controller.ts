import { onError, rateLimit, timeout } from "utils-decorators";
import {
  Product,
  ProductCreationDto,
  ProductUpdateDto,
  ZodProductCreationDto,
  ZodProductUpdateDto,
} from "./dto/product.dto";
import { Validate, ZodInput } from "@pkg/ts-zod-decorators";
import { ResponseError } from "@/types";
import { tryParseId } from "@/utilities";

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

  throw new Error(message, {
    cause: { status: 500, message } satisfies ResponseError,
  });
}

function getProductErrorHandler(e: Error) {
  const message = "User not found.";

  throw new Error(message, {
    cause: { status: 404, message, details: e.message } satisfies ResponseError,
  });
}

/**
 * Controller for handling product-related operations
 * @class ProductController
 * @desc Provides methods for product management including CRUD operations
 */
export default class ProductController {
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
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
  ) {
    products.push({
      ...product,
      id: products.length + 1,
    } satisfies Product);

    return product;
  }

  @timeout(20000)
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Retrieves all products with truncated descriptions
   * @returns List of products with summarized descriptions
   */
  public async getAll(): Promise<Product[]> {
    return products.map(
      (product) =>
        ({
          ...product,
          description: product.description?.substring(0, 50) + "..." || "",
        } satisfies Product)
    );
  }

  @onError({
    func: getProductErrorHandler,
  })
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Finds a product by its ID
   * @param id - Product ID as string
   * @returns Product details or error object if not found
   */
  public async get(id: string): Promise<Product | ResponseError> {
    const productId = tryParseId(id);
    if (typeof productId != "number") return productId satisfies ResponseError;
    const product = products.find((product) => product.id === productId);

    if (!product)
      return {
        status: 404,
        message: "Product dose not exist.",
      } satisfies ResponseError;

    return product satisfies Product;
  }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  @Validate
  /**
   * Updates an existing product
   * @param {string} id - Product ID to update
   * @param {ProductUpdateDto} updateData - Partial product data to update
   * @returns {Promise<Product | ResponseError>} Updated product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format or update data
   */
  public async update(
    id: string,
    @ZodInput(ZodProductUpdateDto) updateData: ProductUpdateDto
  ): Promise<Product | ResponseError> {
    const product = await this.get(id);
    if ("id" in product == false) return product satisfies ResponseError;

    if (product) Object.assign(product, updateData);
    else
      return {
        status: 404,
        message: "Product not found",
      } satisfies ResponseError;

    return product;
  }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Deletes a product by ID
   * @param {string} id - Product ID to delete
   * @returns {Promise<Product | ResponseError>} Deleted product or error object
   * @throws {ResponseError} 404 - Product not found
   * @throws {ResponseError} 400 - Invalid ID format
   */
  public async delete(id: string): Promise<Product | ResponseError> {
    const productId = tryParseId(id);
    if (typeof productId != "number") return productId satisfies ResponseError;
    const index = products.findIndex((product) => product.id === productId);

    if (index == -1)
      return {
        status: 404,
        message: "Product dose not exist.",
      } satisfies ResponseError;

    return products.splice(index, 1)[0] satisfies Product;
  }
}
