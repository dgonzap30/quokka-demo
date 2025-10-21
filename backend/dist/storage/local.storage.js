import * as fs from "fs/promises";
import * as path from "path";
export class LocalStorageProvider {
    rootDir;
    baseUrl;
    constructor(config) {
        if (!config) {
            throw new Error("Local storage config is required");
        }
        this.rootDir = config.rootDir;
        this.baseUrl = config.baseUrl;
    }
    async initialize() {
        try {
            await fs.mkdir(this.rootDir, { recursive: true });
        }
        catch (error) {
            throw new Error(`Failed to initialize local storage: ${error}`);
        }
    }
    getFilePath(key) {
        const sanitized = key.replace(/\.\./g, "").replace(/^\/+/, "");
        return path.join(this.rootDir, sanitized);
    }
    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async upload(key, options) {
        const filePath = this.getFilePath(key);
        const dirPath = path.dirname(filePath);
        await fs.mkdir(dirPath, { recursive: true });
        let buffer;
        if (Buffer.isBuffer(options.content)) {
            buffer = options.content;
        }
        else {
            buffer = await this.streamToBuffer(options.content);
        }
        const maxSize = options.maxSize || 10 * 1024 * 1024;
        if (buffer.length > maxSize) {
            throw new Error(`File size ${buffer.length} exceeds limit ${maxSize}`);
        }
        await fs.writeFile(filePath, buffer);
        const stats = await fs.stat(filePath);
        return {
            key,
            size: stats.size,
            contentType: options.contentType || "application/octet-stream",
            uploadedAt: stats.mtime,
            url: this.baseUrl ? `${this.baseUrl}/${key}` : undefined,
        };
    }
    async download(key) {
        const filePath = this.getFilePath(key);
        try {
            const content = await fs.readFile(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const contentTypeMap = {
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
        }
        catch (error) {
            if (error.code === "ENOENT") {
                throw new Error(`File not found: ${key}`);
            }
            throw error;
        }
    }
    async delete(key) {
        const filePath = this.getFilePath(key);
        try {
            await fs.unlink(filePath);
            return true;
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return false;
            }
            throw error;
        }
    }
    async exists(key) {
        const filePath = this.getFilePath(key);
        try {
            await fs.access(filePath);
            return true;
        }
        catch {
            return false;
        }
    }
    async getMetadata(key) {
        const filePath = this.getFilePath(key);
        try {
            const stats = await fs.stat(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const contentTypeMap = {
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
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return null;
            }
            throw error;
        }
    }
    async list(prefix, limit = 1000) {
        const searchPath = prefix ? this.getFilePath(prefix) : this.rootDir;
        const results = [];
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
        }
        catch (error) {
            if (error.code === "ENOENT") {
                return [];
            }
            throw error;
        }
    }
    async listRecursive(dir, limit, results = []) {
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
            }
            else {
                results.push(fullPath);
            }
        }
        return results;
    }
    async getSignedUrl(key, expiresIn = 3600) {
        if (this.baseUrl) {
            return `${this.baseUrl}/${key}`;
        }
        return `/storage/${key}`;
    }
}
//# sourceMappingURL=local.storage.js.map