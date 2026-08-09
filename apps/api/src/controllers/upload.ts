import type { Request, Response } from "express";
import { uploadFile, deleteFile, getPublicUrl, fileExists } from "../storage/s3.js";
import { createError } from "../middlewares/errorHandler.js";

/**
 * Загружает один файл
 */
export async function uploadSingleFile(req: Request, res: Response) {
  try {
    if (!req.file) {
      throw createError("Файл не был загружен", 400, "NO_FILE_UPLOADED");
    }

    const folder = (req.query.folder as string) || "uploads";
    const result = await uploadFile(req.file, folder);

    res.json({
      data: {
        ...result,
        originalName: req.file.originalname,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при загрузке файла",
      500,
      "UPLOAD_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Загружает несколько файлов
 */
export async function uploadMultipleFiles(req: Request, res: Response) {
  try {
    if (!req.files || (Array.isArray(req.files) && req.files.length === 0)) {
      throw createError("Файлы не были загружены", 400, "NO_FILES_UPLOADED");
    }

    const files = Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
    const folder = (req.query.folder as string) || "uploads";

    const results = await Promise.all(
      files.map((file) => uploadFile(file, folder))
    );

    res.json({
      data: results.map((result, index) => ({
        ...result,
        originalName: files[index].originalname,
      })),
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при загрузке файлов",
      500,
      "UPLOAD_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Удаляет файл
 */
export async function deleteFileByKey(req: Request, res: Response) {
  try {
    const { key } = req.params;

    if (!key) {
      throw createError("Ключ файла не указан", 400, "MISSING_FILE_KEY");
    }

    const exists = await fileExists(key);
    if (!exists) {
      throw createError("Файл не найден", 404, "FILE_NOT_FOUND");
    }

    await deleteFile(key);

    res.json({
      data: {
        message: "Файл успешно удален",
        key,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при удалении файла",
      500,
      "DELETE_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}

/**
 * Получает информацию о файле
 */
export async function getFileInfo(req: Request, res: Response) {
  try {
    const { key } = req.params;

    if (!key) {
      throw createError("Ключ файла не указан", 400, "MISSING_FILE_KEY");
    }

    const exists = await fileExists(key);
    if (!exists) {
      throw createError("Файл не найден", 404, "FILE_NOT_FOUND");
    }

    const publicUrl = getPublicUrl(key);

    res.json({
      data: {
        key,
        url: publicUrl,
        publicUrl,
      },
    });
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError(
      "Ошибка при получении информации о файле",
      500,
      "GET_FILE_INFO_ERROR",
      { originalError: error instanceof Error ? error.message : String(error) }
    );
  }
}
