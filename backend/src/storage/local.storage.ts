/**
 * Local Filesystem Storage Provider
 *
 * Stores files on local disk (for development)
 * Compatible with the IStorageProvider interface
 */

import * as fs from "fs/promises";
import * as path from "path";
import { Readable } from "stream";
import {
  IStorageProvider,
  UploadOptions,
  StorageMetadata,
  DownloadResult,
  StorageConfig,
} from "./storage.interface.js";

export class LocalStorageProvider implements IStorageProvider {
  private rootDir: string;
  private baseUrl?: string;

  constructor(config: StorageConfig["local"]) {
    if (!config) {
      throw new Error("Local storage config is required");
    }

    this.rootDir = config.rootDir;
    this.baseUrl = config.baseUrl;
  }

  /**
   * Initialize storage (create root directory if needed)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.rootDir, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to initialize local storage: ${error}`);
    }
  }

  /**
   * Get absolute file path from storage key
   */
  private getFilePath(key: string): string {
    // Sanitize key to prevent directory traversal
    const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.rootDir, sanitized);
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

  async upload(key: string, options: UploadOptions): Promise<StorageMetadata> {
    const filePath = this.getFilePath(key);
    const dirPath = path.dirname(filePath);

    // Create directory if it doesn't exist
    await fs.mkdir(dirPath, { recursive: true });

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

    // Write file
    await fs.writeFile(filePath, buffer);

    // Get file stats
    const stats = await fs.stat(filePath);

    return {
      key,
      size: stats.size,
      contentType: options.contentType || "application/octet-stream",
      uploadedAt: stats.mtime,
      url: this.baseUrl ? `${this.baseUrl}/${key}` : undefined,
    };
  }

  async download(key: string): Promise<DownloadResult> {
    const filePath = this.getFilePath(key);

    try {
      const content = await fs.readFile(filePath);

      // Try to determine content type from extension
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".json": "application/json",
      };

      return {
        content,
        contentType: contentTypeMap[ext] || "application/octet-stream",
        filename: path.basename(filePath),
      };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        throw new Error(`File not found: ${key}`);
      }
      throw error;
    }
  }

  async delete(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.unlink(filePath);
      return true;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return false; // File doesn't exist
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const filePath = this.getFilePath(key);

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  async getMetadata(key: string): Promise<StorageMetadata | null> {
    const filePath = this.getFilePath(key);

    try {
      const stats = await fs.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const contentTypeMap: Record<string, string> = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".pdf": "application/pdf",
        ".txt": "text/plain",
        ".json": "application/json",
      };

      return {
        key,
        size: stats.size,
        contentType: contentTypeMap[ext] || "application/octet-stream",
        uploadedAt: stats.mtime,
        url: this.baseUrl ? `${this.baseUrl}/${key}` : undefined,
      };
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return null;
      }
      throw error;
    }
  }

  async list(prefix?: string, limit: number = 1000): Promise<StorageMetadata[]> {
    const searchPath = prefix ? this.getFilePath(prefix) : this.rootDir;
    const results: StorageMetadata[] = [];

    try {
      const entries = await this.listRecursive(searchPath, limit);

      for (const entry of entries) {
        const relativePath = path.relative(this.rootDir, entry);
        const metadata = await this.getMetadata(relativePath);
        if (metadata) {
          results.push(metadata);
        }
      }

      return results;
    } catch (error: any) {
      if (error.code === "ENOENT") {
        return []; // Directory doesn't exist
      }
      throw error;
    }
  }

  /**
   * Recursively list files in directory
   */
  private async listRecursive(dir: string, limit: number, results: string[] = []): Promise<string[]> {
    if (results.length >= limit) {
      return results;
    }

    const entries = await fs.readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= limit) {
        break;
      }

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        await this.listRecursive(fullPath, limit, results);
      } else {
        results.push(fullPath);
      }
    }

    return results;
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // For local storage, we can't generate true signed URLs
    // Return the regular URL or the key itself
    if (this.baseUrl) {
      return `${this.baseUrl}/${key}`;
    }

    // In production, you might want to implement a token-based system
    return `/storage/${key}`;
  }
}
