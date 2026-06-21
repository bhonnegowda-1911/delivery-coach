import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import type { Readable } from 'node:stream'

// Object storage for all binaries (voice recordings, system-design images/video, and later
// resume/JD files). MinIO speaks the S3 API, so this same client points at AWS S3 unchanged
// if we ever move to the cloud. Postgres only stores the object key (see assets table); the
// bytes live here. Transfer is proxied through the backend for now (simple, no browser-side
// MinIO/CORS setup); swapping to presigned URLs later is a localized change.

const ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000'
const REGION = process.env.S3_REGION || 'us-east-1'
const ACCESS_KEY = process.env.S3_ACCESS_KEY || 'minioadmin'
const SECRET_KEY = process.env.S3_SECRET_KEY || 'minioadmin'
export const BUCKET = process.env.S3_BUCKET || 'career-coach'

export const s3 = new S3Client({
  endpoint: ENDPOINT,
  region: REGION,
  forcePathStyle: true, // required for MinIO
  credentials: { accessKeyId: ACCESS_KEY, secretAccessKey: SECRET_KEY },
})

/** Create the bucket if it isn't there yet. */
export async function ensureBucket(): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: BUCKET }))
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: BUCKET }))
  }
}

export async function putObject(key: string, body: Buffer, contentType?: string): Promise<void> {
  await s3.send(new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType }))
}

export async function getObject(key: string): Promise<{ body: Readable; contentType?: string; contentLength?: number }> {
  const out = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }))
  return {
    body: out.Body as Readable,
    contentType: out.ContentType,
    contentLength: out.ContentLength,
  }
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
