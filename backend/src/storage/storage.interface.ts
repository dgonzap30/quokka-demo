/**
 * Storage Interface
 *
 * Abstraction for file storage operations
 * Supports local filesystem (dev) and cloud storage (S3/R2 for production)
 */

export interface UploadOptions {
  /** File content as Buffer or stream */
  content: Buffer | NodeJS.ReadableStream;
  /** MIME type (e.g., 'image/png', 'application/pdf') */
  contentType?: string;
  /** Original filename (optional, for metadata) */
  filename?: string;
  /** Maximum file size in bytes (default: 10MB) */
  maxSize?: number;
}

export interface StorageMetadata {
  /** Storage key/path */
  key: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  contentType: string;
  /** Upload timestamp */
  uploadedAt: Date;
  /** Public URL (if available) */
  url?: string;
  /** ETag or version identifier */
  etag?: string;
}

export interface DownloadResult {
  /** File content as Buffer */
  content: Buffer;
  /** MIME type */
  contentType: string;
  /** Original filename (if stored) */
  filename?: string;
}

/**
 * Storage Provider Interface
 *
 * All storage implementations must conform to this interface
 */
export interface IStorageProvider {
  /**
   * Upload a file
   * @param key - Storage key (path) for the file
   * @param options - Upload options (content, contentType, etc.)
   * @returns Metadata about the uploaded file
   */
  upload(key: string, options: UploadOptions): Promise<StorageMetadata>;

  /**
   * Download a file
   * @param key - Storage key (path) of the file
   * @returns File content and metadata
   */
  download(key: string): Promise<DownloadResult>;

  /**
   * Delete a file
   * @param key - Storage key (path) of the file
   * @returns true if deleted, false if not found
   */
  delete(key: string): Promise<boolean>;

  /**
   * Check if a file exists
   * @param key - Storage key (path) of the file
   * @returns true if file exists, false otherwise
   */
  exists(key: string): Promise<boolean>;

  /**
   * Get file metadata without downloading content
   * @param key - Storage key (path) of the file
   * @returns File metadata
   */
  getMetadata(key: string): Promise<StorageMetadata | null>;

  /**
   * List files with optional prefix
   * @param prefix - Optional prefix to filter files
   * @param limit - Maximum number of results (default: 1000)
   * @returns Array of file metadata
   */
  list(prefix?: string, limit?: number): Promise<StorageMetadata[]>;

  /**
   * Get a signed URL for temporary access (if supported)
   * @param key - Storage key (path) of the file
   * @param expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
   * @returns Signed URL string
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

/**
 * Storage Configuration
 */
export interface StorageConfig {
  /** Storage provider type */
  provider: "local" | "s3" | "r2";

  /** Local filesystem config */
  local?: {
    /** Root directory for file storage */
    rootDir: string;
    /** Base URL for serving files (optional) */
    baseUrl?: string;
  };

  /** S3/R2 config (compatible with both AWS S3 and Cloudflare R2) */
  s3?: {
    /** S3 bucket name */
    bucket: string;
    /** AWS region (for S3) or account ID (for R2) */
    region: string;
    /** Access key ID */
    accessKeyId: string;
    /** Secret access key */
    secretAccessKey: string;
    /** Custom endpoint (required for R2, optional for S3) */
    endpoint?: string;
    /** Public URL base (for CDN or custom domain) */
    publicUrl?: string;
  };
}
