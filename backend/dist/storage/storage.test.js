import { createStorageProvider } from "./index.js";
async function testLocalStorage() {
    console.log("\n🧪 Testing Local Storage Provider...\n");
    const config = {
        provider: "local",
        local: {
            rootDir: "./test-uploads",
            baseUrl: "http://localhost:3001/uploads",
        },
    };
    const storage = await createStorageProvider(config);
    try {
        console.log("✅ Test 1: Upload file");
        const testContent = Buffer.from("Hello, QuokkaQ Storage!", "utf-8");
        const metadata = await storage.upload("test/hello.txt", {
            content: testContent,
            contentType: "text/plain",
            filename: "hello.txt",
        });
        console.log("   Uploaded:", metadata);
        console.log("\n✅ Test 2: Check file exists");
        const exists = await storage.exists("test/hello.txt");
        console.log("   Exists:", exists);
        console.log("\n✅ Test 3: Get metadata");
        const meta = await storage.getMetadata("test/hello.txt");
        console.log("   Metadata:", meta);
        console.log("\n✅ Test 4: Download file");
        const download = await storage.download("test/hello.txt");
        console.log("   Content:", download.content.toString("utf-8"));
        console.log("   Content-Type:", download.contentType);
        console.log("\n✅ Test 5: List files");
        const files = await storage.list("test/");
        console.log("   Files:", files.length);
        console.log("\n✅ Test 6: Get signed URL");
        const url = await storage.getSignedUrl("test/hello.txt", 3600);
        console.log("   URL:", url);
        console.log("\n✅ Test 7: Delete file");
        const deleted = await storage.delete("test/hello.txt");
        console.log("   Deleted:", deleted);
        console.log("\n✅ Test 8: Verify deletion");
        const existsAfter = await storage.exists("test/hello.txt");
        console.log("   Exists after delete:", existsAfter);
        console.log("\n✅ All local storage tests passed!\n");
    }
    catch (error) {
        console.error("\n❌ Test failed:", error);
        throw error;
    }
}
async function testS3Storage() {
    console.log("\n🧪 Testing S3/R2 Storage Provider...\n");
    if (!process.env.STORAGE_S3_BUCKET || !process.env.STORAGE_S3_ACCESS_KEY_ID) {
        console.log("⏭️  Skipping S3 tests (no credentials provided)");
        return;
    }
    const config = {
        provider: "s3",
        s3: {
            bucket: process.env.STORAGE_S3_BUCKET,
            region: process.env.STORAGE_S3_REGION || "us-east-1",
            accessKeyId: process.env.STORAGE_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.STORAGE_S3_SECRET_ACCESS_KEY,
            endpoint: process.env.STORAGE_S3_ENDPOINT,
            publicUrl: process.env.STORAGE_S3_PUBLIC_URL,
        },
    };
    const storage = await createStorageProvider(config);
    try {
        console.log("✅ Test 1: Upload file");
        const testContent = Buffer.from("Hello from S3!", "utf-8");
        const metadata = await storage.upload("test/s3-hello.txt", {
            content: testContent,
            contentType: "text/plain",
            filename: "s3-hello.txt",
        });
        console.log("   Uploaded:", metadata);
        console.log("\n✅ Test 2: Download file");
        const download = await storage.download("test/s3-hello.txt");
        console.log("   Content:", download.content.toString("utf-8"));
        console.log("\n✅ Test 3: Get signed URL");
        const url = await storage.getSignedUrl("test/s3-hello.txt", 3600);
        console.log("   URL:", url.substring(0, 50) + "...");
        console.log("\n✅ Test 4: Delete file");
        const deleted = await storage.delete("test/s3-hello.txt");
        console.log("   Deleted:", deleted);
        console.log("\n✅ All S3 storage tests passed!\n");
    }
    catch (error) {
        console.error("\n❌ S3 test failed:", error);
        throw error;
    }
}
async function main() {
    console.log("=".repeat(60));
    console.log("  Storage Abstraction Test Suite");
    console.log("=".repeat(60));
    try {
        await testLocalStorage();
        await testS3Storage();
        console.log("=".repeat(60));
        console.log("  ✅ All tests completed successfully!");
        console.log("=".repeat(60));
    }
    catch (error) {
        console.error("\n❌ Test suite failed");
        process.exit(1);
    }
}
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
//# sourceMappingURL=storage.test.js.map