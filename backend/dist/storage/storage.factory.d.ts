import { IStorageProvider, StorageConfig } from "./storage.interface.js";
export declare function loadStorageConfig(): StorageConfig;
export declare function createStorageProvider(config?: StorageConfig): Promise<IStorageProvider>;
export declare function getStorageProvider(): Promise<IStorageProvider>;
export declare function resetStorageProvider(): void;
//# sourceMappingURL=storage.factory.d.ts.map