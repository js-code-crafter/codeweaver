import { memoizeAsync, onError, rateLimit, timeout } from "utils-decorators";
import {
  OrderDto,
  OrderCreationDto,
  ZodOrderCreationDto,
} from "./dto/order.dto";
import { Validate, ZodInput } from "ts-zod4-decorators";
import { ResponseError } from "@/utilities/error-handling";
import { toInteger } from "@/utilities/conversion";
import config from "@/config";
import { orders } from "@/db";
import { Order } from "@/entities/order.entity";
import { MapAsyncCache } from "@/utilities/cache/memory-cache";

function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

function getOrderErrorHandler(e: Error) {
  const message = "Order not found.";
  throw new ResponseError(message, 404, e.message);
}

const ordersCache = new MapAsyncCache<OrderDto[]>(config.cacheSize);
const orderCache = new MapAsyncCache<OrderDto>(config.cacheSize);

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
    orderCache.set(newOrder.id.toString(), newOrder as OrderDto);
    ordersCache.delete("key");
  }

  @memoizeAsync({
    cache: ordersCache,
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
   * Retrieves all orders
   * @returns List of orders
   */
  public async getAll(): Promise<OrderDto[]> {
    return orders as OrderDto[];
  }

  @memoizeAsync({
    cache: orderCache,
    keyResolver: (id: string) => id,
    expirationTimeMs: config.memoizeTime,
  })
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
    const orderId = toInteger(id);
    const order = orders.find((order) => order.id === orderId);
    if (order == null) {
      throw new ResponseError("User dose not exist.", 404);
    }
    return order as OrderDto;
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

    orderCache.set(id, order);
    ordersCache.delete("key");
    return order;
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

    orderCache.set(id, order);
    ordersCache.delete("key");
    return order;
  }
}
