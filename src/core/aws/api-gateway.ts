import {
  APIGatewayClient,
  CreateRestApiCommand,
  GetRestApisCommand,
  CreateResourceCommand,
  PutMethodCommand,
  PutIntegrationCommand,
  CreateDeploymentCommand,
  GetResourcesCommand,
} from "@aws-sdk/client-api-gateway";
import { LambdaClient, AddPermissionCommand } from "@aws-sdk/client-lambda";

/**
 * Comprehensive TypeScript library for managing AWS API Gateway REST APIs
 * and linking them to AWS Lambda functions.
 * Supports full lifecycle: API creation, resource/method setup,
 * Lambda integration, permissions, and deployment.
 */
export class APIGateway {
  public apiGateway!: APIGatewayClient;
  public lambda!: LambdaClient;

  /**
   * Creates an instance of APIGatewayLambdaLinker.
   * @param options - Configuration options.
   * @param [options.region=us-east-1] - AWS region for operations.
   */
  public constructor(region?: string, ...args: any[]) {
    if (region == null) {
      this.apiGateway = new APIGatewayClient({ region, ...args });
      this.lambda = new LambdaClient({ region, ...args });
    }
  }

  /**
   * Creates a new REST API in API Gateway.
   * @param name - Unique name for the REST API.
   * @param [description] - Optional description of the API.
   * @returns Promise resolving to the created RestApi object containing API ID and details.
   * @throws Will throw if API creation fails (e.g., duplicate name, permissions).
   */
  public async createRestApi(name: string, description?: string): Promise<any> {
    const command = new CreateRestApiCommand({
      name,
      description,
      endpointConfiguration: { types: ["REGIONAL"] },
    });
    return this.apiGateway.send(command);
  }

  /**
   * Lists all REST APIs in the current region.
   * @returns Promise resolving to array of RestApi objects or empty array.
   */
  public async listRestApis(): Promise<any[]> {
    const command = new GetRestApisCommand({});
    const response = await this.apiGateway.send(command);
    return response.items || [];
  }

  /**
   * Retrieves all resources for a specific REST API.
   * @param restApiId - The ID of the REST API.
   * @returns Promise resolving to array of Resource objects or empty array.
   */
  public async getResources(restApiId: string): Promise<any[]> {
    const command = new GetResourcesCommand({ restApiId });
    const response = await this.apiGateway.send(command);
    return response.items || [];
  }

  /**
   * Creates a new resource (path segment) under a parent resource.
   * Use root resource (path '/') as parentId for top-level paths like '/items'.
   * @param restApiId - The ID of the REST API.
   * @param parentId - ID of the parent resource.
   * @param pathPart - Path segment name (e.g., 'items' for '/items').
   * @returns Promise resolving to the created Resource object.
   */
  public async createResource(
    restApiId: string,
    parentId: string,
    pathPart: string
  ): Promise<any> {
    const command = new CreateResourceCommand({
      restApiId,
      parentId,
      pathPart,
    });
    return this.apiGateway.send(command);
  }

  /**
   * Creates or updates an HTTP method on a resource.
   * @param restApiId - The ID of the REST API.
   * @param resourceId - The ID of the resource.
   * @param httpMethod - HTTP method (GET, POST, PUT, DELETE, etc.).
   * @param [authorizationType="NONE"] - Authorization type (NONE, AWS_IAM, CUSTOM, COGNITO_USER_POOLS).
   * @returns Promise resolving to the method configuration.
   */
  public async putMethod(
    restApiId: string,
    resourceId: string,
    httpMethod: string,
    authorizationType: string = "NONE"
  ): Promise<any> {
    const command = new PutMethodCommand({
      restApiId,
      resourceId,
      httpMethod,
      authorizationType,
      apiKeyRequired: false,
    });
    return this.apiGateway.send(command);
  }

  /**
   * Links a Lambda function as the backend integration for an HTTP method using AWS_PROXY integration.
   * @param restApiId - The ID of the REST API.
   * @param resourceId - The ID of the resource.
   * @param httpMethod - HTTP method (must match previously created method).
   * @param lambdaArn - Full ARN of the Lambda function.
   * @returns Promise resolving to the integration configuration.
   */
  public async putIntegration(
    restApiId: string,
    resourceId: string,
    httpMethod: string,
    lambdaArn: string
  ): Promise<any> {
    const region = this.apiGateway.config.region || "us-east-1";
    const command = new PutIntegrationCommand({
      restApiId,
      resourceId,
      httpMethod,
      type: "AWS_PROXY",
      integrationHttpMethod: "POST",
      uri: `arn:aws:apigateway:${region}:lambda:path/2015-03-31/functions/${lambdaArn}/invocations`,
    });
    return this.apiGateway.send(command);
  }

  /**
   * Adds Lambda execution permission for API Gateway to invoke the function.
   * Required for Lambda integration to work.
   * @param functionName - Name or ARN of the Lambda function.
   * @param statementId - Unique ID for this permission statement.
   * @param restApiId - The ID of the REST API.
   * @param region - AWS region.
   * @param accountId - AWS account ID (12 digits).
   * @returns Promise resolving to the permission policy statement.
   */
  public async addLambdaPermission(
    functionName: string,
    statementId: string,
    restApiId: string,
    region: string,
    accountId: string
  ): Promise<any> {
    const sourceArn = `arn:aws:execute-api:${region}:${accountId}:${restApiId}/*/*/*`;
    const command = new AddPermissionCommand({
      FunctionName: functionName,
      StatementId: statementId,
      Action: "lambda:InvokeFunction",
      Principal: "apigateway.amazonaws.com",
      SourceArn: sourceArn,
    });
    return this.lambda.send(command);
  }

  /**
   * Deploys the REST API to a specific stage, making it accessible via invoke URL.
   * @param restApiId - The ID of the REST API.
   * @param stageName - Stage name (dev, prod, test, etc.).
   * @returns Promise resolving to the deployment object.
   */
  public async createDeployment(
    restApiId: string,
    stageName: string
  ): Promise<any> {
    const command = new CreateDeploymentCommand({
      restApiId,
      stageName,
    });
    return this.apiGateway.send(command);
  }
}
