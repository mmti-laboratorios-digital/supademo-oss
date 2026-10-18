import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "./env";

/**
 * Cliente S3-compatível apontando para Cloudflare R2.
 * - Endpoint: https://<account_id>.r2.cloudflarestorage.com
 * - Sem egress fee.
 *
 * 2 clientes: público (screenshots, áudio, OG) e privado (backups, exports).
 */

function r2Client(): S3Client {
  const e = env();
  if (!e.R2_ACCOUNT_ID || !e.R2_ACCESS_KEY_ID || !e.R2_SECRET_ACCESS_KEY) {
    throw new Error("R2 credentials not configured");
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${e.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: e.R2_ACCESS_KEY_ID,
      secretAccessKey: e.R2_SECRET_ACCESS_KEY,
    },
  });
}

export async function presignPut(args: {
  bucket: "public" | "private";
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}): Promise<{ url: string; key: string; bucket: string }> {
  const e = env();
  const client = r2Client();
  const bucket =
    args.bucket === "public" ? e.R2_BUCKET_PUBLIC : e.R2_BUCKET_PRIVATE;

  const cmd = new PutObjectCommand({
    Bucket: bucket,
    Key: args.key,
    ContentType: args.contentType,
  });

  const url = await getSignedUrl(client, cmd, {
    expiresIn: args.expiresInSeconds ?? 600,
  });

  return { url, key: args.key, bucket };
}

export async function putObject(args: {
  bucket: "public" | "private";
  key: string;
  body: Buffer;
  contentType: string;
}): Promise<void> {
  const e = env();
  const client = r2Client();
  const bucket =
    args.bucket === "public" ? e.R2_BUCKET_PUBLIC : e.R2_BUCKET_PRIVATE;

  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: args.key,
      Body: args.body,
      ContentType: args.contentType,
    }),
  );
}

export async function deleteObject(args: {
  bucket: "public" | "private";
  key: string;
}): Promise<void> {
  const e = env();
  const client = r2Client();
  const bucket =
    args.bucket === "public" ? e.R2_BUCKET_PUBLIC : e.R2_BUCKET_PRIVATE;
  await client.send(
    new DeleteObjectCommand({ Bucket: bucket, Key: args.key }),
  );
}

export async function getSignedGetUrl(args: {
  bucket: "public" | "private";
  key: string;
  expiresInSeconds?: number;
}): Promise<string> {
  const e = env();
  const client = r2Client();
  const bucket =
    args.bucket === "public" ? e.R2_BUCKET_PUBLIC : e.R2_BUCKET_PRIVATE;

  return await getSignedUrl(
    client,
    new GetObjectCommand({ Bucket: bucket, Key: args.key }),
    { expiresIn: args.expiresInSeconds ?? 600 },
  );
}

export function publicUrl(key: string): string {
  const base = env().R2_PUBLIC_BASE_URL;
  if (!base) return `/_static/${key}`;
  return `${base.replace(/\/$/, "")}/${key}`;
}