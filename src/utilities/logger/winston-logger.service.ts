import { logger } from "./logger.config";
import { Injectable } from "../container";
import { LoggerService } from "./logger.service";

@Injectable({ singleton: true })
/**
 * WinstonLoggerService is a custom logger service that integrates Winston for advanced logging capabilities.
 */
export class WinstonLoggerService extends LoggerService {
  /**
   * Constructs a new LoggerService instance.
   */
  public constructor() {
    super(logger);
  }
}
