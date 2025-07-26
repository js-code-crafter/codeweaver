import { Validate, ZodInput } from "ts-zod-decorators";
import { onError, rateLimit, timeout } from "utils-decorators";
import {
  Order,
  OrderCreationDto,
  ZodOrderCreationDto,
  ZodOrder,
} from "./dto/order.dto";
import { ResponseError } from "../../types";
import { tryParseId } from "../../utilities";

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

  throw new Error(message, {
    cause: { status: 500, message } satisfies ResponseError,
  });
}

function getOrderErrorHandler(e: Error) {
  const message = "Order not found.";

  throw new Error(message, {
    cause: { status: 404, message, details: e.message } satisfies ResponseError,
  });
}

/**
 * Controller for handling order-related operations
 * @class OrderController
 * @desc Provides methods for order management including creation, status updates and retrieval
 */
export default class OrderController {
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
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

  @timeout(20000)
  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Retrieves all orders
   * @returns List of orders
   */
  public async getAll(): Promise<Order[]> {
    return orders;
  }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
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
  public async get(id: string): Promise<Order | ResponseError> {
    const orderId = tryParseId(id);
    if (typeof orderId != "number") return orderId satisfies ResponseError;
    const order = orders.find((order) => order.id === orderId);

    if (!order)
      return {
        status: 404,
        message: "Order dose not exist.",
      } satisfies ResponseError;

    return order satisfies Order;
  }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Cancel an existing order
   * @param {string} id - Order ID to cancel
   * @returns {Promise<Order | ResponseError>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for cancellation
   */
  public async cancel(id: string): Promise<Order | ResponseError> {
    let order = await this.get(id);
    if ("id" in order == false) return order satisfies ResponseError;

    if (order.status != "Processing")
      return {
        status: 400,
        message:
          "Cancellation is not available unless the order is in processing status.",
      } satisfies ResponseError;

    order.status = "Canceled";
    order.deliveredAt = new Date();
    return order satisfies Order;
  }

  @rateLimit({
    timeSpanMs: 60000,
    allowedCalls: 300,
    exceedHandler,
  })
  /**
   * Mark an order as delivered
   * @param {string} id - Order ID to mark as delivered
   * @returns {Promise<Order | ResponseError>} Updated order or error object
   * @throws {ResponseError} 404 - Order not found
   * @throws {ResponseError} 400 - Invalid ID format or invalid status for delivery
   */
  public async deliver(id: string): Promise<Order | ResponseError> {
    let order = await this.get(id);
    if ("id" in order == false) return order satisfies ResponseError;

    if (order.status != "Processing")
      return {
        status: 400,
        message:
          "Delivery is only available when the order is in processing status.",
      } satisfies ResponseError;

    order.status = "Delivered";
    order.deliveredAt = new Date();
    return order satisfies Order;
  }
}
