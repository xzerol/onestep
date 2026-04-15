import { describe, expect, it, vi } from "vitest";

import { GenerationService } from "@/services/generation-service";

function createFakeDb() {
  const state = {
    project: {
      id: "project_1",
      title: "Portable Blender",
      productName: "Portable Blender",
      productInput: "USB-C 充电，300ml，适合健身和旅行",
      sourceImageUrl: null,
      status: "draft",
      sellingPoints: [] as Array<{
        id: string;
        projectId: string;
        order: number;
        headline: string;
        body: string;
        imagePrompt: string | null;
        status: string;
        updatedAt: Date;
      }>,
      images: [] as Array<{
        id: string;
        projectId: string;
        sellingPointId: string;
        prompt: string;
        imageUrl: string | null;
        provider: string;
        providerJobId: string | null;
        status: string;
        errorMessage: string | null;
        attempt: number;
      }>,
    },
  };

  const database = {
    project: {
      findUnique: vi.fn(async () => ({
        ...state.project,
        sellingPoints: [...state.project.sellingPoints],
        images: [...state.project.images],
      })),
      findUniqueOrThrow: vi.fn(async () => ({
        ...state.project,
        sellingPoints: [...state.project.sellingPoints],
        images: [...state.project.images],
      })),
      update: vi.fn(async ({ data }: { data: Partial<typeof state.project> }) => {
        Object.assign(state.project, data);
        return state.project;
      }),
    },
    sellingPoint: {
      createMany: vi.fn(async ({ data }: { data: typeof state.project.sellingPoints }) => {
        state.project.sellingPoints = data.map((item) => ({
          ...item,
          id: `sp_${item.order}`,
          projectId: "project_1",
          updatedAt: new Date(),
        }));
        return { count: data.length };
      }),
      deleteMany: vi.fn(async () => ({ count: 0 })),
      findFirst: vi.fn(async ({ where }: { where: { id: string } }) =>
        state.project.sellingPoints.find((item) => item.id === where.id) ?? null,
      ),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const item = state.project.sellingPoints.find((entry) => entry.id === where.id);
        if (item) {
          Object.assign(item, data, { updatedAt: new Date() });
        }
        return item;
      }),
    },
    generatedImage: {
      deleteMany: vi.fn(async () => ({ count: 0 })),
      updateMany: vi.fn(async ({ where, data }: { where: { sellingPointId: string }; data: Record<string, unknown> }) => {
        const item = state.project.images.find((entry) => entry.sellingPointId === where.sellingPointId);
        if (item) {
          Object.assign(item, data);
        }
        return { count: item ? 1 : 0 };
      }),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { sellingPointId: string };
          create: Record<string, unknown>;
          update: Record<string, unknown>;
        }) => {
          const existing = state.project.images.find((item) => item.sellingPointId === where.sellingPointId);
          if (existing) {
            Object.assign(existing, update);
            return existing;
          }
          const created = {
            id: `img_${state.project.images.length + 1}`,
            providerJobId: null,
            imageUrl: null,
            errorMessage: null,
            attempt: 1,
            ...create,
          } as (typeof state.project.images)[number];
          state.project.images.push(created);
          return created;
        },
      ),
    },
    $transaction: vi.fn(async (callback: (tx: typeof database) => Promise<unknown>) => callback(database)),
  };

  return { database, state };
}

describe("GenerationService", () => {
  it("creates selling points successfully", async () => {
    const { database, state } = createFakeDb();
    const service = new GenerationService({
      database: database as never,
      textProvider: {
        generateSellingPoints: vi.fn(async () => ({
          sellingPoints: Array.from({ length: 5 }, (_, index) => ({
            order: index + 1,
            headline: `卖点${index + 1}`,
            body: `文案${index + 1}`,
            imagePrompt: `prompt ${index + 1}`,
          })),
        })),
      },
      imageProvider: {
        generateImage: vi.fn(),
      },
    });

    const result = await service.generateCopy("project_1", false);

    expect(result.sellingPoints).toHaveLength(5);
    expect(state.project.status).toBe("copy_ready");
  });

  it("marks images stale after copy edits", async () => {
    const { database, state } = createFakeDb();
    state.project.sellingPoints = [
      {
        id: "sp_1",
        projectId: "project_1",
        order: 1,
        headline: "原始标题",
        body: "原始正文",
        imagePrompt: "original prompt",
        status: "done",
        updatedAt: new Date(),
      },
    ];
    state.project.images = [
      {
        id: "img_1",
        projectId: "project_1",
        sellingPointId: "sp_1",
        prompt: "original prompt",
        imageUrl: "https://cdn.example.com/image.png",
        provider: "gemini",
        providerJobId: "job_1",
        status: "succeeded",
        errorMessage: null,
        attempt: 1,
      },
    ];

    const service = new GenerationService({
      database: database as never,
      textProvider: {
        generateSellingPoints: vi.fn(),
      },
      imageProvider: {
        generateImage: vi.fn(),
      },
    });

    const result = await service.updateSellingPoint("project_1", {
      sellingPointId: "sp_1",
      headline: "新标题",
      body: "新正文",
    });

    expect(result.sellingPoints[0]?.status).toBe("image_stale");
    expect(state.project.images[0]?.status).toBe("failed");
  });

  it("allows partial image failures", async () => {
    const { database, state } = createFakeDb();
    state.project.sellingPoints = Array.from({ length: 5 }, (_, index) => ({
      id: `sp_${index + 1}`,
      projectId: "project_1",
      order: index + 1,
      headline: `卖点${index + 1}`,
      body: `文案${index + 1}`,
      imagePrompt: `prompt ${index + 1}`,
      status: "ready",
      updatedAt: new Date(),
    }));

    const service = new GenerationService({
      database: database as never,
      textProvider: {
        generateSellingPoints: vi.fn(),
      },
      imageProvider: {
        generateImage: vi
          .fn()
          .mockResolvedValueOnce({ imageUrl: "https://cdn.example.com/1.png" })
          .mockRejectedValueOnce(new Error("Image provider failed"))
          .mockResolvedValueOnce({ imageUrl: "https://cdn.example.com/3.png" })
          .mockResolvedValueOnce({ imageUrl: "https://cdn.example.com/4.png" })
          .mockResolvedValueOnce({ imageUrl: "https://cdn.example.com/5.png" }),
      },
    });

    const result = await service.generateAllImages("project_1");

    expect(result.images).toHaveLength(5);
    expect(state.project.status).toBe("images_partial");
    expect(state.project.images.some((item) => item.status === "failed")).toBe(true);
  });

  it("throws when project does not exist", async () => {
    const { database } = createFakeDb();
    database.project.findUnique = vi.fn(async () => null) as never;

    const service = new GenerationService({
      database: database as never,
      textProvider: {
        generateSellingPoints: vi.fn(),
      },
      imageProvider: {
        generateImage: vi.fn(),
      },
    });

    await expect(service.generateCopy("missing", false)).rejects.toThrow("项目不存在");
  });
});
