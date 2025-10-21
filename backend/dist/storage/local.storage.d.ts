import { IStorageProvider, UploadOptions, StorageMetadata, DownloadResult, StorageConfig } from "./storage.interface.js";
export declare class LocalStorageProvider implements IStorageProvider {
    private rootDir;
    private baseUrl?;
    constructor(config: StorageConfig["local"]);
    initialize(): Promise<void>;
    private getFilePath;
    private streamToBuffer;
    upload(key: string, options: UploadOptions): Promise<StorageMetadata>;
    download(key: string): Promise<DownloadResult>;
    delete(key: string): Promise<boolean>;
    exists(key: string): Promise<boolean>;
    getMetadata(key: string): Promise<StorageMetadata | null>;
    list(prefix?: string, limit?: number): Promise<StorageMetadata[]>;
    private listRecursive;
    getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}
//# sourceMappingURL=local.storage.d.ts.map