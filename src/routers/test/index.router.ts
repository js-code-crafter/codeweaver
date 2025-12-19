import { resolve } from "@/core/container";
import { Timeout, UserRequest } from "@/core/middlewares";
import { RateLimit } from "@/core/rate-limit";
import { sleep } from "@/core/retry";
import { Router, Request, Response } from "express";
import asyncHandler from "express-async-handler";

const router = Router();

class TestController {
  @Timeout(4000)
  async timeout(signal?: AbortSignal) {
    console.log(signal);
    for (let i = 1; i <= 10; i++) {
      if (signal?.aborted === true) break;

      await new Promise((resolve) =>
        setTimeout(() => {
          console.log(i / 2);
          return resolve(i / 2);
        }, 500)
      );
    }
    return "Success";
  }

  @RateLimit(1000, 2)
  async rateLimit() {
    return Promise.resolve("Success");
  }
}

const test = resolve(TestController);

router.get(
  "/timeout",
  asyncHandler(async (req: Request, res: Response) => {
    res.send(await test.timeout());
  })
);

router.get(
  "/rate-limit",
  asyncHandler(async (req: Request, res: Response) => {
    // New: run the rateLimit method multiple times in a loop
    const iterations = 10;
    const results: {
      index: number;
      value: string | undefined;
      ok: boolean;
      error?: string;
    }[] = [];

    for (let i = 0; i < iterations; i++) {
      await sleep(334);
      try {
        const value = await test.rateLimit();
        results.push({ index: i, value, ok: true });
      } catch (err: any) {
        results.push({
          index: i,
          value: undefined,
          ok: false,
          error: err?.message ?? String(err),
        });
      }
    }

    res.json({ results });
  })
);

export = router;
