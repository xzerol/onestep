import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { resetEnvCache } from "@/lib/env";
import { BananaImageProvider } from "@/services/banana-image";

vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return {
    ...actual,
    readFile: vi.fn(),
  };
});

describe("BananaImageProvider", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    resetEnvCache();
    process.env.DATABASE_URL = "file:./dev.db";
    process.env.APP_URL = "http://localhost:3000";
    process.env.GEMINI_API_KEY = "gemini-key";
    process.env.GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
  });

  afterEach(() => {
    resetEnvCache();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  it("returns image url from Gemini inlineData", async () => {
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
                    inlineData: {
                      mimeType: "image/png",
                      data: Buffer.from("fake-image").toString("base64"),
                    },
                  },
                ],
              },
            },
          ],
        }),
      }),
    );

    const provider = new BananaImageProvider();
    const result = await provider.generateImage({ prompt: "hero product" });

    expect(result.imageUrl).toContain("/uploads/gemini-");
    expect(result.imageUrl).toContain(".png");
  });

  it("includes reference image in Gemini request when provided", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: "image/png",
                    data: Buffer.from("fake-image").toString("base64"),
                  },
                },
              ],
            },
          },
        ],
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { readFile } = await import("node:fs/promises");
    vi.mocked(readFile).mockResolvedValue(Buffer.from("fake-reference-image"));

    const provider = new BananaImageProvider();
    await provider.generateImage({
      prompt: "hero product",
      referenceImageUrl: "/uploads/ref.png",
    });

    expect(readFile).toHaveBeenCalled();
    const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(requestBody.contents[0].parts).toHaveLength(2);
    expect(requestBody.contents[0].parts[0]).toEqual({ text: "hero product" });
    expect(requestBody.contents[0].parts[1]).toMatchObject({
      inlineData: {
        mimeType: "image/png",
        data: Buffer.from("fake-reference-image").toString("base64"),
      },
    });
  });

  it("throws request errors", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
      }),
    );

    const provider = new BananaImageProvider();

    await expect(provider.generateImage({ prompt: "hero product" })).rejects.toThrow("Gemini 图片请求失败，状态码 401");
  });

  it("throws when inlineData is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "No image" }],
              },
            },
          ],
        }),
      }),
    );

    const provider = new BananaImageProvider();

    await expect(provider.generateImage({ prompt: "hero product" })).rejects.toThrow("Gemini 未返回图片数据");
  });
});
