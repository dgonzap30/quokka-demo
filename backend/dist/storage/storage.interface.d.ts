export interface UploadOptions {
    content: Buffer | NodeJS.ReadableStream;
    contentType?: string;
    filename?: string;
    maxSize?: number;
}
export interface StorageMetadata {
    key: string;
    size: number;
    contentType: string;
    uploadedAt: Date;
    url?: string;
    etag?: string;
}
export interface DownloadResult {
    content: Buffer;
    contentType: string;
    filename?: string;
}
export interface IStorageProvider {
    upload(key: string, options: UploadOptions): Promise<StorageMetadata>;
    download(key: string): Promise<DownloadResult>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<StorageMetadata | null>;
    list(prefix?: string, limit?: number): Promise<StorageMetadata[]>;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
export interface StorageConfig {
    provider: "local" | "s3" | "r2";
    local?: {
        rootDir: string;
        baseUrl?: string;
    };
    s3?: {
        bucket: string;
        region: string;
        accessKeyId: string;
        secretAccessKey: string;
        endpoint?: string;
        publicUrl?: string;
    };
}
//# sourceMappingURL=storage.interface.d.ts.map