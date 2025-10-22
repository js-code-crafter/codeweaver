import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import OrderController from "./order.controller";

const router = Router();
const orderController = new OrderController();

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Create a new order
 *     description: Creates an order with user details and products.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: order
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - userId
 *             - products
 *             - total
 *           properties:
 *             userId:
 *               type: integer
 *               minimum: 1
 *               example: 1
 *             products:
 *               type: array
 *               description: Array of products in the order
 *               items:
 *                 type: object
 *                 required:
 *                   - productId
 *                   - quantity
 *                 properties:
 *                   productId:
 *                     type: integer
 *                     minimum: 1
 *                     example: 3
 *                   quantity:
 *                     type: integer
 *                     minimum: 1
 *                     example: 2
 *             total:
 *               type: number
 *               minimum: 1000
 *               example: 250000
 *     responses:
 *       201:
 *         description: Order created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderController.create(req.body);
    res.status(201).json(order);
  })
);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get all orders
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderController.getAll();
    res.json(orders);
  })
);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Get order details
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Numeric ID of the order to retrieve
 *         type: integer
 *         example: 101
 *     responses:
 *       200:
 *         description: Order details
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderController.get(req.params.id);
    res.json(order);
  })
);

/**
 * @swagger
 * /orders/{id}/cancel:
 *   patch:
 *     summary: Cancel order
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Numeric ID of the order to cancel
 *         type: integer
 *         example: 101
 *     responses:
 *       200:
 *         description: Order canceled successfully
 */
router.patch(
  "/:id/cancel",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderController.cancel(req.params.id);
    res.json(order);
  })
);

/**
 * @swagger
 * /orders/{id}/deliver:
 *   patch:
 *     summary: Mark order as delivered
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: Numeric ID of the order to deliver
 *         type: integer
 *         example: 101
 *     responses:
 *       200:
 *         description: Order marked as delivered
 *       400:
 *         description: Delivery is only available when the order is in processing status.
 */
router.patch(
  "/:id/deliver",
  asyncHandler(async (req: Request, res: Response) => {
    const order = await orderController.deliver(req.params.id);
    res.json(order);
  })
);

export = router;
