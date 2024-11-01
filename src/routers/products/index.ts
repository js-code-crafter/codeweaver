import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

// Array to store products (as a mock database)
const products = [
  { id: 1, name: "Product1" },
  { id: 2, name: "Product2" },
  { id: 3, name: "Product3" },
  { id: 4, name: "Product4" },
  { id: 5, name: "Product5" },
  { id: 6, name: "Product6" },
  { id: 7, name: "Product7" },
  { id: 8, name: "Product8" },
  { id: 9, name: "Product9" },
];

// CRUD Routes

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Create an product
 *     description: Create a new product.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: product created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const product = { id: products.length + 1, name: req.body.name };
    products.push(product);
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
    res.json(products);
  })
);

/**
 * @swagger
 * /products/{id}:
 *   get:
 *     summary: Get an product by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: An product object
 *       404:
 *         description: product not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const product = products.find((i) => i.id === parseInt(req.params.id));
    if (!product) res.status(404).send("product not found");
    else res.json(product);
  })
);

/**
 * @swagger
 * /products/{id}:
 *   put:
 *     summary: Update an product
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: product updated
 *       404:
 *         description: product not found
 */
router.put(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const product = products.find((i) => i.id === parseInt(req.params.id));
    if (!product) res.status(404).send("product not found");
    else {
      Object.assign(product, { id: req.body.id, name: req.body.name });
      res.json(product);
    }
  })
);

/**
 * @swagger
 * /products/{id}:
 *   delete:
 *     summary: Delete an product
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
 *       404:
 *         description: product not found
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const productIndex = products.findIndex(
      (i) => i.id === parseInt(req.params.id)
    );
    if (productIndex === -1) res.status(404).send("product not found");
    else {
      products.splice(productIndex, 1);
      res.status(204).send();
    }
  })
);

export = router;
