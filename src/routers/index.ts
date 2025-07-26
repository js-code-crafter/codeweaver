import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Get the home page
 *     description: Returns the home page.
 *     responses:
 *       200:
 *         description: Hi there!
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    res.send("Hi there!");
  })
);

export = router;
