// app/api/uploads/route.ts
import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function mustGet(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

// Create client lazily (runtime, not build time)
function getS3() {
  return new S3Client({
    region: mustGet("S3_REGION"),
    credentials: {
      accessKeyId: mustGet("S3_ACCESS_KEY_ID"),
      secretAccessKey: mustGet("S3_SECRET_ACCESS_KEY"),
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const prefix = url.searchParams.get("prefix") || "";

  const bucket = mustGet("S3_BUCKET");
  const s3 = getS3();

  const out = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      MaxKeys: 200,
    })
  );

  const items = (out.Contents || [])
    .filter((o) => o.Key)
    .sort(
      (a, b) =>
        (b.LastModified?.getTime() || 0) -
        (a.LastModified?.getTime() || 0)
    );

  const results = await Promise.all(
    items.map(async (o) => {
      const key = o.Key as string;

      const signedPreviewUrl = await getSignedUrl(
        s3,
        new GetObjectCommand({
          Bucket: bucket,
          Key: key,
        }),
        { expiresIn: 120 }
      );

      return {
        key,
        size: o.Size ?? 0,
        lastModified: o.LastModified?.toISOString() ?? null,
        signedPreviewUrl,
      };
    })
  );

  return NextResponse.json({
    prefix,
    count: results.length,
    items: results,
  });
}
