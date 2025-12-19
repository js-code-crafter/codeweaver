import { OrderDto, OrderCreationDto, ZodOrderDto } from "./dto/order.dto";
import { ResponseError } from "@/core/error";
import { convert, stringToInteger } from "@/core/helpers";
import { config } from "@/config";
import { orders } from "@/db";
import { Order, ZodOrder } from "@/entities/order.entity";
import { Invalidate, MapAsyncCache, Memoize } from "@/core/cache";
import { Injectable } from "@/core/container";
import { parallelMap } from "@/core/parallel";
import { RateLimit } from "@/core/rate-limit";
import { ErrorHandler, Timeout } from "@/core/middlewares";

async function exceedHandler() {
  const message = "Too much call in allowed window";
  throw new ResponseError(message, 429);
}

async function invalidInputHandler(e: ResponseError) {
  const message = "Invalid input";
  throw new ResponseError(message, 400, e.message);
}

const ordersCache = new MapAsyncCache<OrderDto[]>(config.cacheSize);
const orderCache = new MapAsyncCache<OrderDto>(config.cacheSize);

@Injectable()
/**
 * Controller for handling order-related operations
 * @class OrderController
 * @desc Provides methods for order management including creation, status updates and retrieval
 */
export default class OrderController {
  // constructor(private readonly orderService: OrderService) { }

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
   * Validates and creates a new Order from the given DTO.
   *
   * @param {OrderCreationDto} order - The incoming OrderCreationDto to validate and transform.
   * @returns {Order} A fully formed Order object ready for persistence.
   */
  public async validateOrderCreationDto(
    order: OrderCreationDto
  ): Promise<Order> {
    const newOrder: Order = {
      ...order,
      id: orders.length + 1,
      status: "Processing",
      createdAt: new Date(),
    };

    return convert(newOrder, ZodOrder);
  }

  @Invalidate(ordersCache)
  @RateLimit(
    config.rateLimitTimeSpan,
    config.rateLimitAllowedCalls,
    exceedHandler
  )
  /**
   * Create a new order
   * @param {Order} order - Order creation data
   * @returns {Promise<void>}
   * @throws {ResponseError} 500 - When rate limit exceeded
   * @throws {ResponseError} 400 - Invalid input data
   */
  public async create(order: Order): Promise<void> {
    orders.push(order);
  }

  @Memoize(orderCache)
  @Timeout(config.timeout)
  @RateLimit(
    config.rateLimitTimeSpan,
    config.rateLimitAllowedCalls,
    exceedHandler
  )
  /**
   * Retrieves all orders
   * @returns List of orders
   */
  public async getAll(): Promise<OrderDto[]> {
    return await parallelMap(
      orders,
      async (order) => await convert(order, ZodOrderDto)
    );
  }

  @Memoize(orderCache)
  @RateLimit(
    config.rateLimitTimeSpan,
    config.rateLimitAllowedCalls,
    exceedHandler
  )
  /**
   * Finds an order by its ID
   * @param {number} id - Order ID as string
   * @returns Order details or error object if not found
   */
  public async get(id: number): Promise<OrderDto> {
    const order = orders.find((order) => order.id === id);
    if (order == null) {
      throw new ResponseError("Order not found");
    }
    return await convert(order, ZodOrder);
  }

  @Invalidate(orderCache, false)
  @Invalidate(ordersCache)
  @RateLimit(
    config.rateLimitTimeSpan,
    config.rateLimitAllowedCalls,
    exceedHandler
  )
  /**
   * Cancel an existing order
   * @param {number} id - Order ID to cancel
   * @returns {Promise<Order>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for cancellation
   */
  public async cancel(id: number): Promise<void> {
    let order = await this.get(id);
    if (order.status != "Processing") {
      throw new ResponseError(
        "Cancellation is not available unless the order is in processing status.",
        409
      );
    }
    order.status = "Canceled";
    order.deliveredAt = new Date();
  }

  @Invalidate(orderCache, false)
  @Invalidate(ordersCache)
  @RateLimit(
    config.rateLimitTimeSpan,
    config.rateLimitAllowedCalls,
    exceedHandler
  )
  /**
   * Mark an order as delivered
   * @param {number} id - Order ID to mark as delivered
   * @returns {Promise<Order>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for delivery
   */
  public async deliver(id: number): Promise<void> {
    let order = await this.get(id);
    if (order.status != "Processing") {
      throw new ResponseError(
        "Delivery is only available when the order is in processing status.",
        409
      );
    }
    order.status = "Delivered";
    order.deliveredAt = new Date();
  }
}
