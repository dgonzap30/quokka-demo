import { LocalStorageProvider } from "./local.storage.js";
import { S3StorageProvider } from "./s3.storage.js";
export function loadStorageConfig() {
    const provider = (process.env.STORAGE_PROVIDER || "local");
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
            return {
                provider: "s3",
                s3: {
                    bucket: process.env.STORAGE_R2_BUCKET || "",
                    region: process.env.STORAGE_R2_ACCOUNT_ID || "auto",
                    accessKeyId: process.env.STORAGE_R2_ACCESS_KEY_ID || "",
                    secretAccessKey: process.env.STORAGE_R2_SECRET_ACCESS_KEY || "",
                    endpoint: process.env.STORAGE_R2_ENDPOINT ||
                        `https://${process.env.STORAGE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
                    publicUrl: process.env.STORAGE_R2_PUBLIC_URL,
                },
            };
        default:
            throw new Error(`Unsupported storage provider: ${provider}`);
    }
}
export async function createStorageProvider(config) {
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
let storageInstance = null;
export async function getStorageProvider() {
    if (!storageInstance) {
        storageInstance = await createStorageProvider();
    }
    return storageInstance;
}
export function resetStorageProvider() {
    storageInstance = null;
}
//# sourceMappingURL=storage.factory.js.map