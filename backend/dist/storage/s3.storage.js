import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand, ListObjectsV2Command, } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
export class S3StorageProvider {
    client;
    bucket;
    publicUrl;
    constructor(config) {
        if (!config) {
            throw new Error("S3/R2 storage config is required");
        }
        this.bucket = config.bucket;
        this.publicUrl = config.publicUrl;
        this.client = new S3Client({
            region: config.region,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
            ...(config.endpoint && { endpoint: config.endpoint }),
        });
    }
    async streamToBuffer(stream) {
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async readableToBuffer(readable) {
        const chunks = [];
        for await (const chunk of readable) {
            chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        return Buffer.concat(chunks);
    }
    async upload(key, options) {
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
        const params = {
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
    async download(key) {
        const params = {
            Bucket: this.bucket,
            Key: key,
        };
        const command = new GetObjectCommand(params);
        try {
            const response = await this.client.send(command);
            if (!response.Body) {
                throw new Error("Empty response body");
            }
            const content = await this.readableToBuffer(response.Body);
            return {
                content,
                contentType: response.ContentType || "application/octet-stream",
                filename: this.extractFilename(response.ContentDisposition),
            };
        }
        catch (error) {
            if (error.name === "NoSuchKey" || error.$metadata?.httpStatusCode === 404) {
                throw new Error(`File not found: ${key}`);
            }
            throw error;
        }
    }
    extractFilename(contentDisposition) {
        if (!contentDisposition)
            return undefined;
        const match = contentDisposition.match(/filename="?([^"]+)"?/);
        return match ? match[1] : undefined;
    }
    async delete(key) {
        const command = new DeleteObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        try {
            await this.client.send(command);
            return true;
        }
        catch (error) {
            if (error.name === "NoSuchKey") {
                return false;
            }
            throw error;
        }
    }
    async exists(key) {
        try {
            await this.client.send(new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            }));
            return true;
        }
        catch (error) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                return false;
            }
            throw error;
        }
    }
    async getMetadata(key) {
        try {
            const command = new HeadObjectCommand({
                Bucket: this.bucket,
                Key: key,
            });
            const response = await this.client.send(command);
            return {
                key,
                size: response.ContentLength || 0,
                contentType: response.ContentType || "application/octet-stream",
                uploadedAt: response.LastModified || new Date(),
                url: this.publicUrl ? `${this.publicUrl}/${key}` : undefined,
                etag: response.ETag,
            };
        }
        catch (error) {
            if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
                return null;
            }
            throw error;
        }
    }
    async list(prefix, limit = 1000) {
        const command = new ListObjectsV2Command({
            Bucket: this.bucket,
            Prefix: prefix,
            MaxKeys: limit,
        });
        const response = await this.client.send(command);
        if (!response.Contents || response.Contents.length === 0) {
            return [];
        }
        return response.Contents.filter((obj) => obj.Key).map((obj) => ({
            key: obj.Key,
            size: obj.Size || 0,
            contentType: "application/octet-stream",
            uploadedAt: obj.LastModified || new Date(),
            url: this.publicUrl ? `${this.publicUrl}/${obj.Key}` : undefined,
            etag: obj.ETag,
        }));
    }
    async getSignedUrl(key, expiresIn = 3600) {
        const command = new GetObjectCommand({
            Bucket: this.bucket,
            Key: key,
        });
        return getSignedUrl(this.client, command, { expiresIn });
    }
}
//# sourceMappingURL=s3.storage.js.map