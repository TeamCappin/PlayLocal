// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const s3 = new S3Client({
  region: process.env.S3_REGION || "us-east-1",
  endpoint: mustGet("S3_ENDPOINT"), // IMPORTANT: inside docker use http://minio:9000
  credentials: {
    accessKeyId: mustGet("S3_ACCESS_KEY_ID"),
    secretAccessKey: mustGet("S3_SECRET_ACCESS_KEY"),
  },
  forcePathStyle: (process.env.S3_FORCE_PATH_STYLE || "true") === "true",
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") || ""; // e.g. games/<gameId>/photos/

  const bucket = mustGet("S3_BUCKET");

  const out = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      MaxKeys: 200,
    })
  );

  const items = (out.Contents || [])
    .filter((o) => o.Key)
    .sort((a, b) => (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0));

  const results = await Promise.all(
    items.map(async (o) => {
      const key = o.Key as string;

      // presign GET (2 minutes)
      const signed = await getSignedUrl(
        s3,
        new GetObjectCommand({ Bucket: bucket, Key: key }),
        { expiresIn: 120 }
      );

      return {
        key,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? null,
        signedPreviewUrl: signed,
      };
    })
  );

  return NextResponse.json({ prefix, count: results.length, items: results });
}
