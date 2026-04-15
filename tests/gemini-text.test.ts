import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnvCache } from "@/lib/env";
import { GeminiTextProvider } from "@/services/gemini-text";

describe("GeminiTextProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetEnvCache();
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.APP_URL = "http://localhost:3000";
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_TEXT_MODEL = "gemini-test";
  });

  afterEach(() => {
    resetEnvCache();
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  it("returns validated selling points", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      sellingPoints: Array.from({ length: 5 }, (_, index) => ({
                        order: index + 1,
                        headline: `卖点${index + 1}`,
                        body: `文案${index + 1}`,
                        imagePrompt: `prompt ${index + 1}`,
                      })),
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }),
    );

    const provider = new GeminiTextProvider();
    const result = await provider.generateSellingPoints({
      productName: "Portable Blender",
      productInput: "USB-C 充电便携榨汁机",
    });

    expect(result.sellingPoints).toHaveLength(5);
    expect(result.sellingPoints[0]?.order).toBe(1);
  });

  it("throws when Gemini JSON is invalid", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "{invalid}" }],
              },
            },
          ],
        }),
      }),
    );

    const provider = new GeminiTextProvider();

    await expect(
      provider.generateSellingPoints({
        productInput: "USB-C 充电便携榨汁机",
      }),
    ).rejects.toThrow("Gemini 返回的卖点 JSON 无效");
  });

  it("throws when fields are missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      sellingPoints: [{ order: 1, headline: "缺字段" }],
                    }),
                  },
                ],
              },
            },
          ],
        }),
      }),
    );

    const provider = new GeminiTextProvider();

    await expect(
      provider.generateSellingPoints({
        productInput: "USB-C 充电便携榨汁机",
      }),
    ).rejects.toThrow("Gemini 返回的卖点 JSON 无效");
  });
});
