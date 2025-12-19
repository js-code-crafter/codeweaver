import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { retry, RetryOptions } from "./utilities";
import { DownloadParams, UploadParams } from "./basic-types";
import fs from "fs";
import util from "util";

/**
 * Client for interacting with AWS S3 buckets.
 */
export class S3 {
  private client!: S3Client;

  /**
   * Constructor for S3Client.
   * @param {string} [region] - The AWS region to use for the client.
   * If not provided, the default region will be used.
   */
  public constructor(region?: string) {
    if (region != null) {
      this.client = new S3Client({ region });
    }
  }

  /**
   * Uploads a file to an S3 bucket.
   * @param {UploadParams} params - The upload parameters.
   * @param {string} params.bucket - The name of the S3 bucket to upload to.
   * @param {string} params.key - The key of the object to create in the bucket.
   * @param {string} params.filePath - The local path to the file to upload.
   * @param {Record<string, any>} [params.extraArgs] - Additional parameters to pass to the PutObjectCommand.
   * @returns {Promise<void>} A promise resolving when the upload is complete.
   */
  public async upload(
    params: UploadParams,
    retryOptions?: RetryOptions
  ): Promise<void> {
    const { bucket, key, filePath, extraArgs } = params;
    const readFile = util.promisify(fs.promises.readFile);

    const body = await readFile(filePath, undefined);

    await retry(async () => {
      await this.client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body as any,
          ...extraArgs,
        })
      );
    }, retryOptions);
  }

  /**
   * Downloads an object from an S3 bucket.
   * @param {DownloadParams} params - The download parameters.
   * @param {string} params.bucket - The name of the S3 bucket to download from.
   * @param {string} params.key - The key of the object to download.
   * @param {string} params.destPath - The local path to write the downloaded file to.
   * @returns {Promise<void>} A promise resolving when the download is complete.
   */
  public async download(params: DownloadParams): Promise<void> {
    const { bucket, key, destPath } = params;
    const resp = await this.client.send(
      new GetObjectCommand({ Bucket: bucket, Key: key })
    );

    const writeStream = fs.createWriteStream(destPath);

    // resp.Body is a stream
    if (resp.Body && "pipe" in resp.Body) {
      await new Promise<void>((resolve, reject) => {
        (resp.Body as any).pipe(writeStream);
        writeStream.on("finish", () => resolve());
        writeStream.on("error", (e) => reject(e));
      });
    } else {
      // Fallback if Body is not streamable
      const chunks: Buffer[] = [];
      for await (const chunk of resp.Body as any)
        chunks.push(Buffer.from(chunk));
      await fs.promises.writeFile(destPath, Buffer.concat(chunks));
    }
  }

  /**
   * Lists the objects in an S3 bucket, optionally filtered by a prefix.
   * @param {string} bucket - The name of the S3 bucket to list objects from.
   * @param {string} [prefix] - The optional prefix to filter objects by.
   * @returns {Promise<string[]>} A promise resolving with an array of object keys.
   */
  public async listObjects(bucket: string, prefix?: string): Promise<string[]> {
    const cmd = new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix });
    const resp: any = await this.client.send(cmd);
    const keys = (resp.Contents || []).map((c: any) => c.Key).filter(Boolean);
    return keys;
  }

  /**
   * Deletes an object from an S3 bucket.
   * @param {string} bucket - The name of the S3 bucket to delete from.
   * @param {string} key - The key of the object to delete.
   * @returns {Promise<void>} A promise resolving when the delete is complete.
   */
  public async deleteObject(bucket: string, key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: key })
    );
  }

  /**
   * Generates a presigned URL for downloading an object from an S3 bucket.
   * @param bucket The name of the S3 bucket to download from.
   * @param key The key of the object to download.
   * @param expirationInSeconds The number of seconds until the presigned URL expires.
   *   Defaults to 3600 (1 hour).
   * @returns A promise resolving to the presigned URL.
   */
  public async presignedUrl(
    bucket: string,
    key: string,
    expirationInSeconds = 3600
  ): Promise<string> {
    const cmd = new GetObjectCommand({ Bucket: bucket, Key: key });
    return await getSignedUrl(this.client, cmd, {
      expiresIn: expirationInSeconds,
    });
  }
}
