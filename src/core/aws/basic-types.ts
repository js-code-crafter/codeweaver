import { Runtime } from "@aws-sdk/client-lambda";

/**
 * Lambda function creation parameters
 * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-runtimes.html
 */
export interface LambdaCreateParams {
  /** Lambda function name to create or update (if already exists) in AWS */
  functionName: string;
  /**
   * IAM role ARN
   *
   * @default arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
   * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-permissions.html
   */
  roleArn: string;
  /**
   * Path to zip file containing lambda code
   *
   * @default index.zip
   * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-zip-file-format.html
   */
  zipFilePath: string;
  /**
   * Lambda handler
   *
   * @default index.handler
   */
  handler: string;
  /**
   * Lambda runtime
   *
   * @default Runtime.nodejs18x
   */
  runtime?: Runtime;
  /**
   * Timeout in seconds
   *
   * @default 15
   */
  timeout?: number;
  /**
   * Memory size in MB
   *
   * @default 128
   */
  memorySize?: number;
  /**
   * Environment variables
   *
   * @default {}
   * @see https://docs.aws.amazon.com/lambda/latest/dg/lambda-environment-variables.html
   */
  environment?: Record<string, string>;
  /**
   * AWS region

   * @see https://docs.aws.amazon.com/lambda/latest/dg/configuration-regions.html
   */
  region?: string;
}

/**
 * Parameters for uploading a file to an S3 bucket
 */
export interface UploadParams {
  bucket: string;
  /** Key of the object to create in the bucket */
  key: string;
  filePath: string;
  /**
   * Additional parameters to pass to the PutObjectCommand
   * @see https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
   */
  extraArgs?: Record<string, any>;
}

/**
 * Parameters for downloading an object from an S3 bucket
 */
export interface DownloadParams {
  bucket: string;
  /** Key of the object to create in the bucket */
  key: string;
  destPath: string;
}

/**
 * Email message configuration for SES.
 */
export interface EmailMessage {
  /** Recipient email addresses. */
  to: string[];
  /** Optional CC recipient email addresses. */
  cc?: string[];
  /** Optional BCC recipient email addresses. */
  bcc?: string[];
  /** Email subject line. */
  subject: string;
  /** Plain text body content. */
  textBody?: string;
  /** HTML body content. */
  htmlBody?: string;
  /** Sender email address (must be SES verified). */
  from: string;
  /** Optional reply-to email addresses. */
  replyTo?: string[];
}

/**
 * SMS message configuration for SNS.
 */
export interface SMSMessage {
  /** Phone number in E.164 format (e.g., '+15551234567'). */
  phoneNumber: string;
  /** Message content (max 160 characters for standard SMS). */
  message: string;
  /** Optional message attributes for customization. */
  attributes?: Record<string, any>;
}

// Define a strict, explicit cache type
export interface PushPlatformArns {
  /**
   * ARN for the APNS platform application
   * @see https://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html
   */
  apns?: string;
  /**
   * ARN for the APNS_SANDBOX platform application
   * @see https://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html
   */
  apns_sandbox?: string;
  /**
   * ARN for the FCM platform application
   * @see https://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html
   */
  fcm?: string;
  /**
   * ARN for the ADM platform application
   * @see https://docs.aws.amazon.com/sns/latest/dg/SNSMobilePush.html
   */
  adm?: string;

  /** Additional platforms as needed in a controlled manner */
  [platform: string]: string | undefined;
}
