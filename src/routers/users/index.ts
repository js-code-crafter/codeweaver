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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example: # Sample object
 *               username: JessicaSmith
 *               email: william.howard.taft@my-own-personal-domain.com
 *               password: password123
 *     responses:
 *       201:
 *         description: product created
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const result = await userController.createUser(req.body);
    res.status(201).json({ message: result });
  })
);

/**
 * @swagger
 * /user:
 *   get:
 *     summary: Get user home
 *     description: Returns the user home page.
 *     responses:
 *       200:
 *         description: User home page
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("User Home");
  })
);

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     description: Returns user profile information.
 *     responses:
 *       200:
 *         description: User profile information
 */
router.get(
  "/profile",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("User Profile");
  })
);

export = router;
