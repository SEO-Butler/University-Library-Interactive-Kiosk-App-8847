import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand
} from '@aws-sdk/client-s3';

// Thin wrapper over the S3 API. Works with MinIO, RustFS, Garage, AWS S3 or any other
// S3-compatible store; only the endpoint and credentials differ.
export function createStorage(config) {
  const { bucket } = config.s3;
  const client = new S3Client({
    endpoint: config.s3.endpoint,
    region: config.s3.region,
    forcePathStyle: config.s3.forcePathStyle,
    credentials: {
      accessKeyId: config.s3.accessKey,
      secretAccessKey: config.s3.secretKey
    },
    // Some S3-compatible servers reject the newer checksum headers; only send them
    // when the operation requires them.
    requestChecksumCalculation: 'WHEN_REQUIRED',
    responseChecksumValidation: 'WHEN_REQUIRED',
    maxAttempts: 2,
    requestHandler: { requestTimeout: 20000, connectionTimeout: 5000 }
  });

  const isMissing = (error) =>
    error?.$metadata?.httpStatusCode === 404 ||
    ['NotFound', 'NoSuchBucket', 'NoSuchKey'].includes(error?.name);

  return {
    bucket,

    async ensureBucket() {
      try {
        await client.send(new HeadBucketCommand({ Bucket: bucket }));
      } catch (error) {
        if (!isMissing(error)) throw error;
        await client.send(new CreateBucketCommand({ Bucket: bucket }));
      }
    },

    async ping() {
      await client.send(new HeadBucketCommand({ Bucket: bucket }));
    },

    async put(key, body, contentType) {
      await client.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: body,
          ContentType: contentType,
          ContentLength: body.length
        })
      );
    },

    // Returns null if the object does not exist.
    async get(key) {
      try {
        const result = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
        return {
          body: result.Body,
          contentType: result.ContentType,
          contentLength: result.ContentLength,
          etag: result.ETag,
          lastModified: result.LastModified
        };
      } catch (error) {
        if (isMissing(error)) return null;
        throw error;
      }
    },

    async remove(key) {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
    },

    destroy() {
      client.destroy();
    }
  };
}
