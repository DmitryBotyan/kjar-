import { S3Client, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import path from "path";
import { createError } from "../middlewares/errorHandler.js";
import { detectImageType } from "./imageType.js";

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT || "http://minio:9000",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: requireCredential("S3_ACCESS_KEY"),
    secretAccessKey: requireCredential("S3_SECRET_KEY"),
  },
  forcePathStyle: true, // Для MinIO обязательно
});

const BUCKET = process.env.S3_BUCKET || "kjar";
const PUBLIC_URL = process.env.S3_PUBLIC_URL || "http://localhost:9000";

// В проде дефолтные ключи minio недопустимы: падаем на старте, а не на первой загрузке
function requireCredential(name: "S3_ACCESS_KEY" | "S3_SECRET_KEY"): string {
  const value = process.env[name];
  if (value) return value;
  if (process.env.NODE_ENV === "production") {
    throw new Error(`${name} не задан в переменных окружения`);
  }
  return "minioadmin";
}

export interface UploadResult {
  key: string;
  url: string;
  publicUrl: string;
  size: number;
  contentType: string;
}

export async function uploadFile(
  file: Express.Multer.File,
  folder: string = "uploads"
): Promise<UploadResult> {
  const type = detectImageType(file.buffer);
  if (!type) {
    throw createError("Загрузить можно только картинку: JPG, PNG, GIF или WebP", 400, "INVALID_FILE_TYPE");
  }
  const key = `${folder}/${uuidv4()}${type.ext}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: file.buffer,
      ContentType: type.mime,
      ACL: "public-read", // Для MinIO это может не работать, но не критично
    },
  });

  await upload.done();

  return {
    key,
    url: `${PUBLIC_URL}/${BUCKET}/${key}`,
    publicUrl: `${PUBLIC_URL}/${BUCKET}/${key}`,
    size: file.size,
    contentType: type.mime,
  };
}

export async function uploadBuffer(
  buffer: Buffer,
  fileName: string,
  contentType: string,
  folder: string = "uploads"
): Promise<UploadResult> {
  const fileExtension = path.extname(fileName);
  const uniqueFileName = `${uuidv4()}${fileExtension}`;
  const key = `${folder}/${uniqueFileName}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  await upload.done();

  return {
    key,
    url: `${PUBLIC_URL}/${BUCKET}/${key}`,
    publicUrl: `${PUBLIC_URL}/${BUCKET}/${key}`,
    size: buffer.length,
    contentType,
  };
}

export async function getSignedUrlForFile(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET,
    Key: key,
  });

  return await getSignedUrl(s3Client, command, { expiresIn });
}

export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET,
        Key: key,
      })
    );
    return true;
  } catch (error) {
    return false;
  }
}

export async function deleteFile(key: string): Promise<void> {
  await s3Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: key,
    })
  );
}

export function getPublicUrl(key: string): string {
  return `${PUBLIC_URL}/${BUCKET}/${key}`;
}
