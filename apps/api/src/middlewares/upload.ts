import multer from "multer";
import { createError } from "./errorHandler.js";

const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "application/pdf",
    "text/plain",
    "text/markdown",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      createError(
        `Неподдерживаемый тип файла: ${file.mimetype}. Разрешены: изображения, PDF, текстовые файлы`,
        400,
        "INVALID_FILE_TYPE"
      )
    );
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const uploadSingle = (fieldName: string = "file") =>
  upload.single(fieldName);

export const uploadMultiple = (fieldName: string = "files", maxCount: number = 10) =>
  upload.array(fieldName, maxCount);

export const uploadFields = (fields: multer.Field[]) =>
  upload.fields(fields);
