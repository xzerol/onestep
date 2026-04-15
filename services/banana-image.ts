import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";

import { AppError } from "@/lib/api";
import { getEnv, requireProviderEnv } from "@/lib/env";
import { ensureDirectory, publicFilePath } from "@/lib/utils";

import type { ImageProvider } from "@/services/provider-types";

type GeminiImageResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
        inlineData?: {
          mimeType: string;
          data: string;
        };
      }>;
    };
  }>;
};

export class BananaImageProvider implements ImageProvider {
  async generateImage(input: {
    prompt: string;
    referenceImageUrl?: string | null;
    aspectRatio?: string;
    size?: string;
    timeoutMs?: number;
    signal?: AbortSignal;
  }) {
    const env = getEnv();

    requireProviderEnv("GEMINI_API_KEY", env.GEMINI_API_KEY);

    const parts: Array<
      | { text: string }
      | {
          inlineData: {
            mimeType: string;
            data: string;
          };
        }
    > = [{ text: input.prompt }];

    if (input.referenceImageUrl) {
      const imagePath = publicFilePath(input.referenceImageUrl.replace(/^\/+/, ""));
      const imageBuffer = await readFile(imagePath);
      const mimeType = imagePath.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      parts.push({
        inlineData: {
          mimeType,
          data: imageBuffer.toString("base64"),
        },
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_IMAGE_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts,
            },
          ],
          generationConfig: {
            responseModalities: ["Text", "Image"],
          },
        }),
        signal: input.signal,
      },
    );

    if (!response.ok) {
      throw new AppError("IMAGE_PROVIDER_REQUEST_FAILED", `Gemini 图片请求失败，状态码 ${response.status}`, 502);
    }

    const payload = (await response.json()) as GeminiImageResponse;
    const inlineData = payload.candidates?.[0]?.content?.parts?.find((part) => part.inlineData)?.inlineData;

    if (!inlineData) {
      throw new AppError("IMAGE_PROVIDER_INVALID_RESPONSE", "Gemini 未返回图片数据", 502);
    }

    const buffer = Buffer.from(inlineData.data, "base64");
    const uploadDir = publicFilePath("uploads");
    await ensureDirectory(uploadDir);

    const filename = `gemini-${randomUUID()}.png`;
    const outputPath = publicFilePath("uploads", filename);
    await writeFile(outputPath, buffer);

    return {
      providerJobId: undefined,
      imageUrl: `/uploads/${filename}`,
      rawResponse: payload,
    };
  }
}
