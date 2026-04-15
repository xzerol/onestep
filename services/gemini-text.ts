import { AppError } from "@/lib/api";
import { getEnv, requireProviderEnv } from "@/lib/env";
import { logger } from "@/lib/logger";
import { buildSellingPointsPrompt } from "@/lib/prompts";
import { generatedSellingPointsEnvelopeSchema } from "@/lib/schemas";

import type { TextProvider } from "@/services/provider-types";

type GeminiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export class GeminiTextProvider implements TextProvider {
  async generateSellingPoints(input: {
    productName?: string | null;
    productInput: string;
    sourceImageUrl?: string | null;
  }) {
    const env = getEnv();

    requireProviderEnv("GEMINI_API_KEY", env.GEMINI_API_KEY);

    const prompt = buildSellingPointsPrompt(input);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_TEXT_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!response.ok) {
      throw new AppError("TEXT_PROVIDER_REQUEST_FAILED", `Gemini 请求失败，状态码 ${response.status}`, 502);
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;

    if (!text) {
      throw new AppError("TEXT_PROVIDER_INVALID_JSON", "Gemini 未返回 JSON 内容", 502);
    }

    try {
      const json = JSON.parse(text);

      if (Array.isArray(json)) {
        const parsed = generatedSellingPointsEnvelopeSchema.parse({ sellingPoints: json });
        return parsed;
      }

      const parsed = generatedSellingPointsEnvelopeSchema.parse(json);
      return parsed;
    } catch (error) {
      logger.error("Failed to parse Gemini output", {
        error: error instanceof Error ? error.message : String(error),
        text,
      });
      throw new AppError("TEXT_PROVIDER_SCHEMA_ERROR", "Gemini 返回的卖点 JSON 无效", 502);
    }
  }
}
