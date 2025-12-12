import {
  SNSClient,
  PublishCommand,
  GetSMSAttributesCommand,
  SetSMSAttributesCommand,
} from "@aws-sdk/client-sns";
import {
  SESv2Client,
  SendEmailCommand,
  ListEmailIdentitiesCommand,
} from "@aws-sdk/client-sesv2";
import {
  CreatePlatformApplicationCommand,
  CreatePlatformApplicationCommandInput,
  CreatePlatformEndpointCommand,
  CreatePlatformEndpointCommandInput,
  PublishCommand as SNSPublishCommand,
} from "@aws-sdk/client-sns";
import { EmailMessage, PushPlatformArns, SMSMessage } from "./basic-types";

/**
 * Comprehensive TypeScript library for AWS SNS (SMS) and SES (Email) services.
 * Provides simplified interfaces for sending messages with full TypeScript support.
 *
 * @example
 * ```
 * const messenger = new AWSMessenger("us-east-1");
 * await messenger.sendSMS({ phoneNumber: '+1234567890', message: 'Hello!' });
 * await messenger.sendEmail({
 *   to: ['user@example.com'],
 *   subject: 'Test',
 *   textBody: 'Hello from SES!',
 *   from: 'sender@verified.com'
 * });
 * ```
 */
export class Messenger {
  public sns!: SNSClient;
  public ses!: SESv2Client;

  /**
   * Creates an instance of AWSMessenger for SNS and SES operations.
   * @param options - Configuration options.
   * @param [options.region=us-east-1] - AWS region for operations.
   */
  public constructor(region?: string, ...args: any[]) {
    if (region != null) {
      this.sns = new SNSClient({ region, ...args });
      this.ses = new SESv2Client({ region, ...args });
    }
  }

  /**
   * Sends an SMS message via AWS SNS.
   * @param message - SMS configuration object.
   * @returns Promise resolving to SNS publish response with MessageId.
   * @throws Throws if phone number is invalid, quota exceeded, or permissions missing.
   */
  public async sendSMS(message: SMSMessage): Promise<any> {
    const command = new PublishCommand({
      PhoneNumber: message.phoneNumber,
      Message: message.message,
      MessageAttributes: message.attributes,
    });
    return this.sns.send(command);
  }

  /**
   * Sends a bulk SMS to multiple phone numbers.
   * @param messages - Array of SMS configuration objects.
   * @returns Promise resolving to array of publish responses.
   */
  public async sendBulkSMS(messages: SMSMessage[]): Promise<any[]> {
    const results = [];
    for (const msg of messages) {
      results.push(await this.sendSMS(msg));
    }
    return results;
  }

  /**
   * Gets current SMS attributes (delivery status, monthly spend, etc.).
   * @returns Promise resolving to SMS attributes map.
   */
  public async getSMSAttributes(): Promise<any> {
    const command = new GetSMSAttributesCommand({});
    const response = await this.sns.send(command);
    return response.attributes || {};
  }

  /**
   * Sets SMS attributes like DefaultSMSType (Transactional/Promotional).
   * @param attributes - Map of SMS attributes to set.
   * @returns Promise resolving to updated attributes.
   * @example
   * await messenger.setSMSAttributes({ DefaultSMSType: 'Transactional' });
   */
  public async setSMSAttributes(attributes: Record<string, string>): Promise<any> {
    const command = new SetSMSAttributesCommand({ attributes });
    return this.sns.send(command);
  }

  /**
   * Sends an email via AWS SES v2.
   * @param message - Email configuration object.
   * @returns Promise resolving to SES send response with MessageId.
   * @throws Throws if sender not verified, quota exceeded, or invalid recipients.
   */
  public async sendEmail(message: EmailMessage): Promise<any> {
    const command = new SendEmailCommand({
      FromEmailAddress: message.from,
      Destination: {
        ToAddresses: message.to,
        CcAddresses: message.cc,
        BccAddresses: message.bcc,
      },
      Content: {
        Simple: {
          Subject: { Data: message.subject, Charset: "UTF-8" },
          Body: {
            Text: message.textBody
              ? { Data: message.textBody, Charset: "UTF-8" }
              : undefined,
            Html: message.htmlBody
              ? { Data: message.htmlBody, Charset: "UTF-8" }
              : undefined,
          },
        },
      },
      ReplyToAddresses: message.replyTo,
    });
    return this.ses.send(command);
  }

  /**
   * Lists all SES verified email addresses.
   * @returns Promise resolving to array of verified email addresses.
   */
  public async listVerifiedEmails(): Promise<string[]> {
    const command = new ListEmailIdentitiesCommand({});
    const response = await this.ses.send(command);
    // Filter identities for email addresses only (exclude domains)
    const emails = (response.EmailIdentities || [])
      .filter((identity) => identity.IdentityType === "EMAIL_ADDRESS")
      .map((identity) => identity.IdentityName || "");
    return emails;
  }

  /** Optional: cache or store platform application ARNs by platform */
  public pushPlatformArns: PushPlatformArns | undefined;

  /**
   * Creates a platform application for push notifications.
   * You can store the resulting PlatformApplicationArn to reuse for endpoints.
   * @param platform - 'APNS', 'APNS_SANDBOX', 'GCM' (FCM), etc.
   * @param attributes - Optional attributes for the platform app (e.g., PlatformCredential, PlatformPrincipal)
   * @param name - Optional logical name for internal tracking (not strictly required)
   * @returns Promise resolving to the created PlatformApplicationArn
   */
  public async createPlatformApplication(
    platform: string,
    attributes: Record<string, string>
  ): Promise<string> {
    const command = new CreatePlatformApplicationCommand({
      Name: platform + "_application_" + Date.now(),
      Platform: platform,
      Attributes: attributes,
    } as CreatePlatformApplicationCommandInput);
    const response = await this.sns.send(command);
    const arn = response.PlatformApplicationArn;
    // Optionally cache by platform
    if (!this.pushPlatformArns) this.pushPlatformArns = {};
    this.pushPlatformArns[platform] = arn || "";
    return arn || "";
  }

  /**
   * Creates an endpoint for a device token under a given platform application.
   * @param platform - platform key, e.g., 'APNS', 'APNS_SANDBOX', 'GCM'
   * @param token - device push token (device token for APNS, registration token for FCM)
   * @param customUserData - optional custom data to associate with the endpoint
   * @returns Promise resolving to the EndpointArn
   */
  public async createPlatformEndpoint(
    platform: string,
    token: string,
    customUserData?: string
  ): Promise<string> {
    const appArn = this.pushPlatformArns?.[platform];
    if (!appArn) {
      throw new Error(
        `Platform application ARN for ${platform} not found. Create it with createPlatformApplication first.`
      );
    }
    const command = new CreatePlatformEndpointCommand({
      PlatformApplicationArn: appArn,
      Token: token,
      UserData: customUserData,
    } as CreatePlatformEndpointCommandInput);
    const response = await this.sns.send(command);
    return response.EndpointArn || "";
  }

  /**
   * Publish a push notification to a specific endpoint.
   * The Message structure uses platform-specific payloads for APNS/FCM, etc.
   * @param endpointArn - The SNS EndpointArn to target
   * @param message - The generic message payload
   * @param subject - Optional subject (for some platforms)
   * @returns Promise resolving to Publish response with MessageId
   */
  public async publishPushToEndpoint(
    endpointArn: string,
    message: {
      // Common fields; you can structure this as needed
      title?: string;
      body?: string;
      // Optional Apple/Google-specific overrides
      apns?: any; // APNS payload
      android?: any; // Android payload
      default?: string;
    }
  ): Promise<any> {
    // Build a platform-specific JSON payload. AWS SNS expects a JSON object
    // with keys per platform, as a string under the "Message" field,
    // and a "MessageStructure": "json"

    const payload: any = {};

    if (message.apns) payload.APNS = JSON.stringify(message.apns);
    if (message.android) payload.GCM = JSON.stringify(message.android);
    if (message.default) payload.default = message.default;
    // Fallback to a simple default if no platform-specific payload provided
    if (!payload.APNS && !payload.GCM && !payload.default) {
      const simple = {
        aps: {
          alert: {
            title: message.title || "",
            body: message.body || "",
          },
        },
      };
      payload.APNS = JSON.stringify(simple);
      // Some implementations also set GCM
      payload.GCM = JSON.stringify({
        notification: { title: message.title, body: message.body },
      });
    }

    const command = new SNSPublishCommand({
      TargetArn: endpointArn,
      MessageStructure: "json",
      Message: JSON.stringify(payload),
    });

    // Use PublishCommand alias to avoid naming confusion
    return this.sns.send(command);
  }
}
