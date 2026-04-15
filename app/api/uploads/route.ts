import { randomUUID } from "node:crypto";
import { writeFile } from "node:fs/promises";
import path from "node:path";

import { AppError, apiError, apiSuccess } from "@/lib/api";
import { ensureDirectory, publicFilePath } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError("INVALID_INPUT", "Upload file is required", 400);
    }

    const uploadDir = publicFilePath("uploads");
    await ensureDirectory(uploadDir);

    const extension = path.extname(file.name) || ".png";
    const filename = `${randomUUID()}${extension}`;
    const outputPath = path.join(uploadDir, filename);
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(outputPath, bytes);

    return apiSuccess({
      url: `/uploads/${filename}`,
    });
  } catch (error) {
    return apiError(error);
  }
}
