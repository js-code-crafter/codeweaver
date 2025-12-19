import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  PutCommandInput,
  GetCommandInput,
  UpdateCommandInput,
  DeleteCommandInput,
  QueryCommandInput,
  ScanCommandInput,
} from "@aws-sdk/lib-dynamodb";

export function createDocClient(
  region?: string,
  ...args: any[]
): DynamoDBDocumentClient {
  const client = new DynamoDBClient({ region, ...args });
  return DynamoDBDocumentClient.from(client);
}

// Basic wrappers (more convenient with document client)
export async function putItem<T>(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  item: T
) {
  const command = new PutCommand({
    TableName: tableName,
    Item: item as any,
  } as PutCommandInput);
  return docClient.send(command);
}

export async function getItem<T>(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  key: Record<string, any>
): Promise<T | undefined> {
  const command = new GetCommand({
    TableName: tableName,
    Key: key,
  } as GetCommandInput);
  const resp = await docClient.send(command);
  return (resp.Item as T) ?? undefined;
}

export async function updateItem<T>(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  key: Record<string, any>,
  updateExpression: string,
  expressionAttributeValues: Record<string, any>,
  conditionExpression?: string
): Promise<T | undefined> {
  const command = new UpdateCommand({
    TableName: tableName,
    Key: key,
    UpdateExpression: updateExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    ConditionExpression: conditionExpression,
    ReturnValues: "ALL_NEW",
  } as UpdateCommandInput);
  const resp = await docClient.send(command);
  return resp.Attributes as unknown as T;
}

export async function deleteItem(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  key: Record<string, any>
): Promise<void> {
  const command = new DeleteCommand({
    TableName: tableName,
    Key: key,
  } as DeleteCommandInput);
  await docClient.send(command);
}

export async function queryItems<T>(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  keyConditionExpression: string,
  expressionAttributeValues: Record<string, any>,
  indexName?: string
): Promise<T[]> {
  const command = new QueryCommand({
    TableName: tableName,
    IndexName: indexName,
    KeyConditionExpression: keyConditionExpression,
    ExpressionAttributeValues: expressionAttributeValues,
  } as QueryCommandInput);
  const resp = await docClient.send(command);
  return (resp.Items as T[]) ?? [];
}

export async function scanItems<T>(
  docClient: DynamoDBDocumentClient,
  tableName: string,
  filterExpression?: string,
  expressionAttributeValues?: Record<string, any>,
  indexName?: string
): Promise<T[]> {
  const command = new ScanCommand({
    TableName: tableName,
    FilterExpression: filterExpression,
    ExpressionAttributeValues: expressionAttributeValues,
    IndexName: indexName,
  } as ScanCommandInput);
  const resp = await docClient.send(command);
  return (resp.Items as T[]) ?? [];
}

export class DynamoRepository<T extends { [key: string]: any }> {
  public docClient!: DynamoDBDocumentClient;
  private tableName: string;

  public constructor(tableName: string, region?: string, ...args: any[]) {
    this.tableName = tableName;
    if (region != null) {
      this.docClient = createDocClient(region, ...args);
    }
  }

  public async put(item: T): Promise<void> {
    // You may want to enforce key presence here
    await putItem(this.docClient, this.tableName, item);
  }

  public async get(key: Record<string, any>): Promise<T | undefined> {
    return (await getItem<T>(this.docClient, this.tableName, key)) as
      | T
      | undefined;
  }

  public async update(
    key: Record<string, any>,
    updateExpression: string,
    expressionAttributeValues: Record<string, any>,
    conditionExpression?: string
  ): Promise<T | undefined> {
    return await updateItem<T>(
      this.docClient,
      this.tableName,
      key,
      updateExpression,
      expressionAttributeValues,
      conditionExpression
    );
  }

  public async delete(key: Record<string, any>): Promise<void> {
    await deleteItem(this.docClient, this.tableName, key);
  }

  public async query(
    keyConditionExpression: string,
    expressionAttributeValues: Record<string, any>,
    indexName?: string
  ): Promise<T[]> {
    return await queryItems<T>(
      this.docClient,
      this.tableName,
      keyConditionExpression,
      expressionAttributeValues,
      indexName
    );
  }

  public async scan(
    filterExpression?: string,
    expressionAttributeValues?: Record<string, any>,
    indexName?: string
  ): Promise<T[]> {
    return await scanItems<T>(
      this.docClient,
      this.tableName,
      filterExpression,
      expressionAttributeValues,
      indexName
    );
  }
}
