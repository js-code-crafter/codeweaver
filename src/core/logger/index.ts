import { resolve } from "@/core/container";
import { WinstonLoggerService } from "./winston-logger.service";

export const logger = resolve(WinstonLoggerService);
