import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Get order home
 *     description: Returns the order home page.
 *     responses:
 *       200:
 *         description: Order home page
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("Order Home");
  })
);

/**
 * @swagger
 * /orders/history:
 *   get:
 *     summary: Get order history
 *     description: Returns order history.
 *     responses:
 *       200:
 *         description: Order history
 */
router.get(
  "/history",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("Order History");
  })
);

export = router;
