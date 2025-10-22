/**
 * S3/R2 Storage Provider
 *
 * Stores files in AWS S3 or Cloudflare R2 (both use S3-compatible API)
 * Compatible with the IStorageProvider interface
 */

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  type PutObjectCommandInput,
  type GetObjectCommandInput,
  type HeadObjectCommandOutput,
  type _Object,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "stream";
import {
  IStorageProvider,
  UploadOptions,
  StorageMetadata,
  DownloadResult,
  StorageConfig,
} from "./storage.interface.js";

export class S3StorageProvider implements IStorageProvider {
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: StorageConfig["s3"]) {
    if (!config) {
      throw new Error("S3/R2 storage config is required");
    }

    this.bucket = config.bucket;
    this.publicUrl = config.publicUrl;

    // Initialize S3 client
    // Works for both AWS S3 and Cloudflare R2
    this.client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
      // Custom endpoint for R2 or S3-compatible services
      ...(config.endpoint && { endpoint: config.endpoint }),
    });
  }

  /**
   * Convert stream to buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /**
   * Convert S3 readable stream to buffer
   */
  private async readableToBuffer(readable: Readable): Promise<Buffer> {
    const chunks: Buffer[] = [];

    for await (const chunk of readable) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  async upload(key: string, options: UploadOptions): Promise<StorageMetadata> {
    // Convert content to buffer if it's a stream
    let buffer: Buffer;
    if (Buffer.isBuffer(options.content)) {
      buffer = options.content;
    } else {
      buffer = await this.streamToBuffer(options.content);
    }

    // Check file size limit
    const maxSize = options.maxSize || 10 * 1024 * 1024; // 10MB default
    if (buffer.length > maxSize) {
      throw new Error(`File size ${buffer.length} exceeds limit ${maxSize}`);
    }

    const params: PutObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: options.contentType || "application/octet-stream",
      ...(options.filename && { ContentDisposition: `inline; filename="${options.filename}"` }),
    };

    const command = new PutObjectCommand(params);
    const response = await this.client.send(command);

    return {
      key,
      size: buffer.length,
      contentType: options.contentType || "application/octet-stream",
      uploadedAt: new Date(),
      url: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
      etag: response.ETag,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const params: GetObjectCommandInput = {
      Bucket: this.bucket,
      Key: key,
    };

    const command = new GetObjectCommand(params);

    try {
      const response = await this.client.send(command);

      if (!response.Body) {
        throw new Error("Empty response body");
      }

      // Convert readable stream to buffer
      const content = await this.readableToBuffer(response.Body as Readable);

      return {
        content,
        contentType: response.ContentType || "application/octet-stream",
        filename: this.extractFilename(response.ContentDisposition),
      };
    } catch (error: any) {
      if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  /**
   * Extract filename from Content-Disposition header
   */
  private extractFilename(contentDisposition?: string): string | undefined {
    if (!contentDisposition) return undefined;

    const match = contentDisposition.match(/filename="?([^"]+)"?/);
    return match ? match[1] : undefined;
  }

  async delete(key: string): Promise<boolean> {
    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    try {
      await this.client.send(command);
      return true;
    } catch (error: any) {
      if (error.name === "NoSuchKey") {
        return false;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: key,
        })
      );
      return true;
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return false;
      }
      throw error;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    try {
      const command = new HeadObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });

      const response: HeadObjectCommandOutput = await this.client.send(command);

      return {
        key,
        size: response.ContentLength || 0,
        contentType: response.ContentType || "application/octet-stream",
        uploadedAt: response.LastModified || new Date(),
        url: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
        etag: response.ETag,
      };
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  async list(prefix?: string, limit: number = 1000): Promise<StorageMetadata[]> {
    const command = new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
      MaxKeys: limit,
    });

    const response = await this.client.send(command);

    if (!response.Contents || response.Contents.length === 0) {
      return [];
    }

    return response.Contents.filter((obj: _Object) => obj.Key).map((obj: _Object) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      contentType: "application/octet-stream", // S3 doesn't return content type in list
      uploadedAt: obj.LastModified || new Date(),
      url: this.publicUrl ? `${this.publicUrl}/${obj.Key}` : undefined,
      etag: obj.ETag,
    }));
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }
}
