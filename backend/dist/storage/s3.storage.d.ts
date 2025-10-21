import { IStorageProvider, UploadOptions, StorageMetadata, DownloadResult, StorageConfig } from "./storage.interface.js";
export declare class S3StorageProvider implements IStorageProvider {
    private client;
    private bucket;
    private publicUrl?;
    constructor(config: StorageConfig["s3"]);
    private streamToBuffer;
    private readableToBuffer;
    upload(key: string, options: UploadOptions): Promise<StorageMetadata>;
    download(key: string): Promise<DownloadResult>;
    private extractFilename;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<StorageMetadata | null>;
    list(prefix?: string, limit?: number): Promise<StorageMetadata[]>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
//# sourceMappingURL=s3.storage.d.ts.map