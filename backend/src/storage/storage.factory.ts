/**
 * Storage Factory
 *
 * Creates and configures the appropriate storage provider
 * based on environment configuration
 */

import { IStorageProvider, StorageConfig } from "./storage.interface.js";
import { LocalStorageProvider } from "./local.storage.js";
import { S3StorageProvider } from "./s3.storage.js";

/**
 * Load storage configuration from environment variables
 */
export function loadStorageConfig(): StorageConfig {
  const provider = (process.env.STORAGE_PROVIDER || "local") as StorageConfig["provider"];

  switch (provider) {
    case "local":
      return {
        provider: "local",
        local: {
          rootDir: process.env.STORAGE_LOCAL_ROOT_DIR || "./uploads",
          baseUrl: process.env.STORAGE_LOCAL_BASE_URL,
        },
      };

    case "s3":
      return {
        provider: "s3",
        s3: {
          bucket: process.env.STORAGE_S3_BUCKET || "",
          region: process.env.STORAGE_S3_REGION || "us-east-1",
          accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY || "",
          endpoint: process.env.STORAGE_S3_ENDPOINT,
          publicUrl: process.env.STORAGE_S3_PUBLIC_URL,
        },
      };

    case "r2":
      // Cloudflare R2 uses S3-compatible API
      return {
        provider: "s3", // Use S3 provider with R2 endpoint
        s3: {
          bucket: process.env.STORAGE_R2_BUCKET || "",
          region: process.env.STORAGE_R2_ACCOUNT_ID || "auto",
          accessKeyId: process.env.STORAGE_R2_ACCESS_KEY_ID || "",
          secretAccessKey: process.env.STORAGE_R2_SECRET_ACCESS_KEY || "",
          // R2 endpoint format: https://<account_id>.r2.cloudflarestorage.com
          endpoint: process.env.STORAGE_R2_ENDPOINT ||
            `https://${process.env.STORAGE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
          publicUrl: process.env.STORAGE_R2_PUBLIC_URL,
        },
      };

    default:
      throw new Error(`Unsupported storage provider: ${provider}`);
  }
}

/**
 * Create storage provider instance from configuration
 */
export async function createStorageProvider(config?: StorageConfig): Promise<IStorageProvider> {
  const storageConfig = config || loadStorageConfig();

  switch (storageConfig.provider) {
    case "local": {
      if (!storageConfig.local) {
        throw new Error("Local storage configuration is missing");
      }
      const provider = new LocalStorageProvider(storageConfig.local);
      await provider.initialize();
      return provider;
    }

    case "s3": {
      if (!storageConfig.s3) {
        throw new Error("S3 storage configuration is missing");
      }

      // Validate required S3 config
      if (!storageConfig.s3.bucket) {
        throw new Error("S3 bucket name is required");
      }
      if (!storageConfig.s3.accessKeyId || !storageConfig.s3.secretAccessKey) {
        throw new Error("S3 credentials (accessKeyId and secretAccessKey) are required");
      }

      return new S3StorageProvider(storageConfig.s3);
    }

    default:
      throw new Error(`Unsupported storage provider: ${storageConfig.provider}`);
  }
}

/**
 * Singleton storage provider instance
 */
let storageInstance: IStorageProvider | null = null;

/**
 * Get the singleton storage provider instance
 */
export async function getStorageProvider(): Promise<IStorageProvider> {
  if (!storageInstance) {
    storageInstance = await createStorageProvider();
  }
  return storageInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetStorageProvider(): void {
  storageInstance = null;
}
