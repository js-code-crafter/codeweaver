import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";
import UserController from "./user.controller";

const router = Router();
const userController = new UserController();

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Create a user
 *     description: Create a new user.
 *     consumes:
 *       - application/json
 *     produces:
 *       - application/json
 *     parameters:
 *       - in: body
 *         name: user
 *         required: true
 *         schema:
 *           type: object
 *           required:
 *             - username
 *             - email
 *             - password
 *           properties:
 *             username:
 *               type: string
 *               minLength: 3
 *               example: JessicaSmith
 *             email:
 *               type: string
 *               format: email
 *               example: user@example.com
 *             password:
 *               type: string
 *               minLength: 6
 *               example: securePassword123
 *     responses:
 *       201:
 *         description: User created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const user = userController.validateUserCreationDto(req.body);
    await userController.create(user);
    res.status(201);
  })
);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: The ID of the product
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A user object
 *       404:
 *         description: user not found
 */
router.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const id = userController.validateId(req.params.id);
    const user = await userController.get(id);
    res.json(user);
  })
);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get users
 *     description: Returns a list of user objects.
 *     responses:
 *       200:
 *         description: A list of user objects
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.json(await userController.getAll());
  })
);

export = router;
