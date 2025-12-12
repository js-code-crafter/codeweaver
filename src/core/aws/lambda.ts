import {
  LambdaClient,
  CreateFunctionCommand,
  GetFunctionCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
  InvokeCommand,
  ListFunctionsCommand,
  DeleteFunctionCommand,
  Runtime,
} from "@aws-sdk/client-lambda";
import { LambdaCreateParams } from "./basic-types";
import { retry, RetryOptions } from "./utilities";
import fs from "fs";
import util from "util";

/**
 * Client for interacting with AWS Lambda functions.
 */
export class Lambda {
  public client: LambdaClient;

  /**
   * Constructor for LambdaClient.
   * @param {string} [region] - The AWS region to use for the client.
   * If not provided, the default region will be used.
   */
  public constructor(region?: string, ...args: any[]) {
    if (region != null) {
      this.client = new LambdaClient({ region, ...args });
    }
  }

  /**
   * Tries to update or create a Lambda function.
   * If the function already exists, it will be updated.
   * If the function does not exist, it will be created.
   *
   * @throws If the function could not be updated or created
   */
  public async createOrUpdateFunction(
    params: LambdaCreateParams,
    shouldRetry = false,
    retryOptions?: RetryOptions
  ): Promise<void> {
    const {
      functionName,
      roleArn,
      zipFilePath,
      handler,
      runtime = Runtime.nodejs18x,
      timeout = 15,
      memorySize = 128,
      environment,
    } = params;

    const codeBytes = await this.readZip(zipFilePath);

    /**
     * Tries to update or create a Lambda function.
     * If the function already exists, it will be updated.
     * If the function does not exist, it will be created.
     *
     * @throws If the function could not be updated or created
     */
    const upsert = async () => {
      try {
        // Try to get function to decide between update vs create
        await this.client.send(
          new GetFunctionCommand({ FunctionName: functionName })
        );

        // Update
        await this.client.send(
          new UpdateFunctionCodeCommand({
            FunctionName: functionName,
            ZipFile: codeBytes,
          })
        );
        await this.client.send(
          new UpdateFunctionConfigurationCommand({
            FunctionName: functionName,
            Role: roleArn,
            Handler: handler,
            Runtime: runtime,
            Timeout: timeout,
            MemorySize: memorySize,
            Environment: environment ? { Variables: environment } : undefined,
          })
        );
      } catch (err: any) {
        const isNotFound =
          err.name === "ResourceNotFoundException" ||
          (err.$response && err.$response.statusCode === 404);
        if (isNotFound) {
          // Create
          await this.client.send(
            new CreateFunctionCommand({
              FunctionName: functionName,
              Runtime: runtime,
              Role: roleArn,
              Handler: handler,
              Code: { ZipFile: codeBytes },
              Timeout: timeout,
              MemorySize: memorySize,
              Environment: environment ? { Variables: environment } : undefined,
            })
          );
        } else {
          throw err;
        }
      }
    };

    retry(upsert, retryOptions);
  }

  /**
   * Invoke a lambda function.
   *
   * @param functionName Name of the lambda function to invoke.
   * @param payload Payload to pass to the lambda function.
   * @param invocationType Invocation type; "RequestResponse" for synchronous invocation,
   *   "Event" for asynchronous invocation.
   * @returns The response from the lambda function, normalized to a Buffer.
   */
  public async invoke(
    functionName: string,
    payload: any,
    invocationType: "RequestResponse" | "Event" = "RequestResponse"
  ): Promise<Buffer> {
    const cmd = new InvokeCommand({
      FunctionName: functionName,
      Payload:
        typeof payload === "string"
          ? payload
          : Buffer.from(JSON.stringify(payload)),
      InvocationType: invocationType,
    });

    const resp = await this.client.send(cmd);
    // Payload is a streaming or binary blob; normalize to Buffer
    if (resp.Payload instanceof Uint8Array) {
      return Buffer.from(resp.Payload);
    }
    if (resp.Payload) {
      // Attempt to read as Buffer if possible
      try {
        const chunks: Buffer[] = [];
        for await (const chunk of resp.Payload as any) {
          chunks.push(Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
      } catch {
        // If not iterable, fall back to empty
        return Buffer.alloc(0);
      }
    }
    return Buffer.alloc(0);
  }

  /**
   * Lists all Lambda functions with an optional prefix filter.
   * @param {string} [prefix] - Optional prefix to filter functions by.
   * @returns {Promise<any[]>} - A Promise resolving with an array of Lambda functions.
   */
  public async listFunctions(prefix?: string): Promise<any[]> {
    const cmd = new ListFunctionsCommand({});
    const resp: any = await this.client.send(cmd);
    let items: any[] = resp.Functions || [];
    if (prefix) {
      items = items.filter((f) => f.FunctionName?.startsWith(prefix));
    }
    return items;
  }

  /**
   * Deletes a Lambda function.
   * @param functionName The name of the Lambda function to delete.
   * @returns A Promise resolving when the function is deleted.
   */
  async deleteFunction(functionName: string): Promise<void> {
    await this.client.send(
      new DeleteFunctionCommand({ FunctionName: functionName })
    );
  }

  /**
   * Reads a file from the local file system as a zip archive and returns the contents as a Buffer.
   * @param path The path to the zip archive to read.
   * @returns A Promise resolving to a Buffer containing the file contents.
   * @private
   */
  private async readZip(path: string): Promise<Buffer> {
    // Read file using fs.promises
    const readFile = util.promisify(fs.promises.readFile);
    return (await readFile(path, undefined)) as Buffer;
  }
}
