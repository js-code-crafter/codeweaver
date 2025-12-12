import {
  SNSClient,
  CreateTopicCommand,
  SubscribeCommand,
  PublishCommand,
  DeleteTopicCommand,
  ListTopicsCommand,
} from "@aws-sdk/client-sns";
import {
  SQSClient,
  CreateQueueCommand,
  GetQueueAttributesCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  DeleteQueueCommand,
} from "@aws-sdk/client-sqs";

/**
 * SNS-SQS Message Broker for publishing and consuming messages with AWS SNS and SQS.
 */
export class AwsSnsSqsBroker {
  public snsClient!: SNSClient;
  public sqsClient!: SQSClient;

  public constructor(region?: string, ...args: any[]) {
    if (region != null) {
      this.snsClient = new SNSClient({ region, ...args });
      this.sqsClient = new SQSClient({ region, ...args });
    }
  }

  /**
   * Creates an SNS topic.
   * @param topicName - The name for the SNS topic.
   * @returns The ARN of the created topic.
   */
  public async createTopic(topicName: string): Promise<string> {
    const command = new CreateTopicCommand({ Name: topicName });
    const response = await this.snsClient.send(command);
    return response.TopicArn!;
  }

  /**
   * Deletes an SNS topic by ARN.
   * @param topicArn - The ARN of the topic to delete.
   */
  public async deleteTopic(topicArn: string): Promise<void> {
    const command = new DeleteTopicCommand({ TopicArn: topicArn });
    await this.snsClient.send(command);
  }

  /**
   * Creates an SQS queue.
   * @param queueName - The name for the queue.
   * @param attributes - Optional queue attributes such as visibility timeout.
   * @returns The URL of the created queue.
   */
  public async createQueue(
    queueName: string,
    attributes?: Record<string, string>
  ): Promise<string> {
    const command = new CreateQueueCommand({
      QueueName: queueName,
      Attributes: attributes,
    });
    const response = await this.sqsClient.send(command);
    return response.QueueUrl!;
  }

  /**
   * Deletes an SQS queue by URL.
   * @param queueUrl - The URL of the queue to delete.
   */
  public async deleteQueue(queueUrl: string): Promise<void> {
    const command = new DeleteQueueCommand({ QueueUrl: queueUrl });
    await this.sqsClient.send(command);
  }

  /**
   * Subscribes an SQS queue to an SNS topic.
   * @param topicArn - ARN of the SNS topic.
   * @param queueArn - ARN of the SQS queue.
   * @returns The Subscription ARN.
   */
  public async subscribeQueueToTopic(
    topicArn: string,
    queueArn: string
  ): Promise<string> {
    const command = new SubscribeCommand({
      TopicArn: topicArn,
      Protocol: "sqs",
      Endpoint: queueArn,
    });
    const response = await this.snsClient.send(command);
    return response.SubscriptionArn!;
  }

  /**
   * Gets the ARN of an SQS queue from its URL.
   * @param queueUrl - The URL of the SQS queue.
   * @returns The ARN string of the queue.
   */
  public async getQueueArn(queueUrl: string): Promise<string> {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ["QueueArn"],
    });
    const response = await this.sqsClient.send(command);
    return response.Attributes?.QueueArn || "";
  }

  /**
   * Publishes a message to an SNS topic.
   * @param topicArn - ARN of the SNS topic.
   * @param message - The message content to send.
   * @param subject - Optional message subject.
   */
  public async publishMessage(
    topicArn: string,
    message: string,
    subject?: string
  ): Promise<void> {
    const command = new PublishCommand({
      TopicArn: topicArn,
      Message: message,
      Subject: subject,
    });
    await this.snsClient.send(command);
  }

  /**
   * Receives messages from an SQS queue.
   * @param queueUrl - The URL of the SQS queue.
   * @param maxMessages - Maximum number of messages to receive (default 1).
   * @param waitTimeSeconds - Long polling wait time in seconds (default 10).
   * @returns Array of messages received.
   */
  public async receiveMessages(
    queueUrl: string,
    maxMessages: number = 1,
    waitTimeSeconds: number = 10
  ) {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: waitTimeSeconds,
    });
    const response = await this.sqsClient.send(command);
    return response.Messages || [];
  }

  /**
   * Deletes a message from an SQS queue.
   * @param queueUrl - The URL of the SQS queue.
   * @param receiptHandle - The receipt handle of the message to delete.
   */
  public async deleteMessage(
    queueUrl: string,
    receiptHandle: string
  ): Promise<void> {
    const command = new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    });
    await this.sqsClient.send(command);
  }
}
