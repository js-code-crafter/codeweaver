import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import {
  Order,
  OrderDto,
  OrderCreationDto,
  ZodOrderCreationDto,
} from "./dto/order.dto";
import { Validate, ZodInput } from "ts-zod4-decorators";
import { ResponseError } from "@/utilities/types";
import { parseId } from "@/utilities/error-handling";
import config from "@/config";

// Array to store orders (as a mock database)
const orders: Order[] = [
  {
    id: 1,
    userId: 1,
    products: [
      { productId: 2, quantity: 1 },
      { productId: 6, quantity: 2 },
    ],
    status: "Delivered",
    total: 14400,
    createdAt: new Date("2024-01-15"),
    deliveredAt: new Date("2024-02-10"),
  },
  {
    id: 2,
    userId: 3,
    products: [
      { productId: 9, quantity: 1 },
      { productId: 7, quantity: 1 },
    ],
    status: "Processing",
    total: 36500,
    createdAt: new Date("2024-03-20"),
  },
  {
    id: 3,
    userId: 2,
    products: [
      { productId: 1, quantity: 1 },
      { productId: 4, quantity: 2 },
    ],
    status: "Canceled",
    total: 81000,
    createdAt: new Date("2024-05-01"),
    canceledAt: new Date("2024-05-03"),
  },
];

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function getOrderErrorHandler(e: Error) {
  const message = "Order not found.";
  throw new ResponseError(message, 404, e.message);
}

/**
 * Controller for handling order-related operations
 * @class OrderController
 * @desc Provides methods for order management including creation, status updates and retrieval
 */
export default class OrderController {
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  @Validate
  /**
   * Create a new order
   * @param {OrderCreationDto} order - Order creation data
   * @returns {Promise<Order>} Newly created order
   */
  public async create(@ZodInput(ZodOrderCreationDto) order: OrderCreationDto) {
    const newOrder = {
      ...order,
      id: orders.length + 1,
      createdAt: new Date(),
      status: "Processing",
    } satisfies Order;

    orders.push(newOrder);
    return newOrder;
  }

  @timeout(config.timeout)
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Retrieves all orders
   * @returns List of orders
   */
  public async getAll(): Promise<OrderDto[]> {
    return orders;
  }

  @memoizeAsync(config.memoizeTime)
  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  @onError({
    func: getOrderErrorHandler,
  })
  /**
   * Finds an order by its ID
   * @param id - Order ID as string
   * @returns Order details or error object if not found
   */
  public async get(id: string): Promise<OrderDto> {
    const orderId = parseId(id);
    const order = orders.find((order) => order.id === orderId);
    if (order == null) throw new ResponseError("User dose not exist.", 404);
    return order satisfies Order;
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Cancel an existing order
   * @param {string} id - Order ID to cancel
   * @returns {Promise<Order>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for cancellation
   */
  public async cancel(id: string): Promise<OrderDto> {
    let order = await this.get(id);
    if (order.status != "Processing") {
      throw new ResponseError(
        "Cancellation is not available unless the order is in processing status.",
        400
      );
    }

    order.status = "Canceled";
    order.deliveredAt = new Date();
    return order satisfies Order;
  }

  @rateLimit({
    timeSpanMs: config.rateLimitTimeSpan,
    allowedCalls: config.rateLimitAllowedCalls,
    exceedHandler,
  })
  /**
   * Mark an order as delivered
   * @param {string} id - Order ID to mark as delivered
   * @returns {Promise<Order>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for delivery
   */
  public async deliver(id: string): Promise<OrderDto> {
    let order = await this.get(id);
    if (order.status != "Processing") {
      throw new ResponseError(
        "Delivery is only available when the order is in processing status.",
        400
      );
    }

    order.status = "Delivered";
    order.deliveredAt = new Date();
    return order satisfies Order;
  }
}
