import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import ProductController from "./product.controller";
import { sendError } from "../../utilities";

const router = Router();
const productController = new ProductController();

// CRUD Routes

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create a product
 *     description: Create a new product.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: product
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - name
 *             - price
 *             - category
 *             - stock
 *           properties:
 *             id:
 *               type: integer
 *               example: 1
 *             name:
 *               type: string
 *               example: "New Product"
 *             price:
 *               type: number
 *               example: 1499
 *             description:
 *               type: string
 *               example: "This is a detailed description."
 *             category:
 *               type: string
 *               enum:
 *                 - Electronics
 *                 - Appliances
 *                 - Sports
 *                 - Kitchen
 *                 - Mobile Accessories
 *                 - Computer Accessories
 *                 - Home Appliances
 *                 - Books
 *               example: "Electronics"
 *             stock:
 *               type: integer
 *               example: 50
 *     responses:
 *       201:
 *         description: Product created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productController.create(req.body);
    res.status(201).json(product);
  })
);

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Get all products
 *     responses:
 *       200:
 *         description: A list of products
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.status(200).json(await productController.getAll());
  })
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get a product by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A product object
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productController.get(req.params.id);

    if ("id" in product == false) sendError(res, product);
    else res.status(200).json(product);
  })
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update a product
 *     description: Update an existing product.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: integer
 *       - in: body
 *         name: product
 *         required: true
 *         schema:
 *           type: object
 *           properties:
 *             name:
 *               type: string
 *               example: "Updated Product"
 *             price:
 *               type: number
 *               example: 2000
 *             description:
 *               type: string
 *               example: "This is a detailed description."
 *             category:
 *               type: string
 *               enum:
 *                 - Electronics
 *                 - Appliances
 *                 - Sports
 *                 - Kitchen
 *                 - Mobile Accessories
 *                 - Computer Accessories
 *                 - Home Appliances
 *                 - Books
 *               example: "Sports"
 *             stock:
 *               type: integer
 *               example: 70
 *     responses:
 *       200:
 *         description: Product updated
 *       404:
 *         description: Product not found
 */
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productController.update(req.params.id, req.body);

    if ("id" in product == false) sendError(res, product);
    else res.status(200).json(product);
  })
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete a product
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product to delete
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: product deleted
 *       400:
 *         description: invalid request
 *       404:
 *         description: product not found
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const product = await productController.delete(req.params.id);

    if ("id" in product == false) sendError(res, product);
    else res.status(200).json(product);
  })
);

export = router;
