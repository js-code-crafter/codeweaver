import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

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
