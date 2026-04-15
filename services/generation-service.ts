import type { PrismaClient } from "@prisma/client";

import { AppError } from "@/lib/api";
import { db } from "@/lib/db";
import { logger } from "@/lib/logger";
import { buildImagePrompt } from "@/lib/prompts";
import { updateSellingPointSchema } from "@/lib/schemas";

import { BananaImageProvider } from "@/services/banana-image";
import { GeminiTextProvider } from "@/services/gemini-text";
import type { ImageProvider, TextProvider } from "@/services/provider-types";
import { projectInclude } from "@/services/project-service";

type DatabaseClient = Pick<
  PrismaClient,
  "project" | "sellingPoint" | "generatedImage" | "$transaction"
>;

export class GenerationService {
  private db: DatabaseClient;
  private textProvider: TextProvider;
  private imageProvider: ImageProvider;

  constructor({
    database = db,
    textProvider = new GeminiTextProvider(),
    imageProvider = new BananaImageProvider(),
  }: {
    database?: DatabaseClient;
    textProvider?: TextProvider;
    imageProvider?: ImageProvider;
  } = {}) {
    this.db = database;
    this.textProvider = textProvider;
    this.imageProvider = imageProvider;
  }

  async generateCopy(projectId: string, replace = false) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: {
        sellingPoints: {
          orderBy: {
            order: "asc",
          },
        },
      },
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "项目不存在", 404);
    }

    if (!project.productInput.trim()) {
      throw new AppError("INVALID_INPUT", "产品描述为必填项", 400);
    }

    if (project.sellingPoints.length > 0 && !replace) {
      throw new AppError("COPY_ALREADY_EXISTS", "卖点已存在。传入 replace=true 以覆盖。", 409);
    }

    const generated = await this.textProvider.generateSellingPoints({
      productName: project.productName,
      productInput: project.productInput,
      sourceImageUrl: project.sourceImageUrl,
    });

    await this.db.$transaction(async (tx) => {
      if (project.sellingPoints.length > 0) {
        await tx.generatedImage.deleteMany({
          where: {
            projectId,
          },
        });
        await tx.sellingPoint.deleteMany({
          where: {
            projectId,
          },
        });
      }

      await tx.sellingPoint.createMany({
        data: generated.sellingPoints.map((item) => ({
          projectId,
          order: item.order,
          headline: item.headline,
          body: item.body,
          imagePrompt: item.imagePrompt,
          status: "ready",
        })),
      });

      await tx.project.update({
        where: { id: projectId },
        data: {
          status: "copy_ready",
        },
      });
    });

    return this.db.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
  }

  async updateSellingPoint(projectId: string, input: unknown) {
    const payload = updateSellingPointSchema.parse(input);

    const sellingPoint = await this.db.sellingPoint.findFirst({
      where: {
        id: payload.sellingPointId,
        projectId,
      },
    });

    if (!sellingPoint) {
      throw new AppError("SELLING_POINT_NOT_FOUND", "卖点不存在", 404);
    }

    await this.db.$transaction(async (tx) => {
      await tx.sellingPoint.update({
        where: { id: payload.sellingPointId },
        data: {
          headline: payload.headline,
          body: payload.body,
          imagePrompt: buildImagePrompt({
            headline: payload.headline,
            body: payload.body,
            imagePrompt: sellingPoint.imagePrompt,
          }),
          status: "image_stale",
        },
      });

      await tx.generatedImage.updateMany({
        where: {
          sellingPointId: payload.sellingPointId,
        },
        data: {
          status: "failed",
          errorMessage: "Stale after selling point update",
        },
      });
    });

    return this.db.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
  }

  async generateAllImages(projectId: string) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: {
        sellingPoints: {
          orderBy: {
            order: "asc",
          },
        },
        images: true,
      },
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "项目不存在", 404);
    }

    if (project.sellingPoints.length === 0) {
      throw new AppError("INVALID_INPUT", "请先生成卖点文案，再请求图片", 400);
    }

    await this.db.project.update({
      where: { id: projectId },
      data: {
        status: "images_generating",
      },
    });

    let successCount = 0;

    for (let index = 0; index < project.sellingPoints.length; index += 2) {
      const chunk = project.sellingPoints.slice(index, index + 2);

      const results = await Promise.allSettled(
        chunk.map(async (sellingPoint) => {
          await this.db.sellingPoint.update({
            where: { id: sellingPoint.id },
            data: {
              status: "generating",
            },
          });

          const existingImage = project.images.find((image) => image.sellingPointId === sellingPoint.id);
          const prompt = buildImagePrompt({
            headline: sellingPoint.headline,
            body: sellingPoint.body,
            imagePrompt: sellingPoint.imagePrompt,
          });

          const generatedImage = await this.imageProvider.generateImage({
            prompt,
            referenceImageUrl: project.sourceImageUrl,
            timeoutMs: 90_000,
          });

          successCount += 1;

          await this.db.generatedImage.upsert({
            where: {
              sellingPointId: sellingPoint.id,
            },
            update: {
              prompt,
              imageUrl: generatedImage.imageUrl,
              provider: "gemini",
              providerJobId: generatedImage.providerJobId,
              status: "succeeded",
              errorMessage: null,
              attempt: existingImage ? existingImage.attempt + 1 : 1,
              rawResponseJson: JSON.stringify(generatedImage.rawResponse ?? null),
            },
            create: {
              projectId,
              sellingPointId: sellingPoint.id,
              prompt,
              imageUrl: generatedImage.imageUrl,
              provider: "gemini",
              providerJobId: generatedImage.providerJobId,
              status: "succeeded",
              rawResponseJson: JSON.stringify(generatedImage.rawResponse ?? null),
            },
          });

          await this.db.sellingPoint.update({
            where: { id: sellingPoint.id },
            data: {
              status: "done",
            },
          });
        }),
      );

      await Promise.all(
        results.map(async (result, offset) => {
          if (result.status === "fulfilled") {
            return;
          }

          const sellingPoint = chunk[offset];

          logger.error("Image generation failed", {
            projectId,
            sellingPointId: sellingPoint.id,
            message: result.reason instanceof Error ? result.reason.message : String(result.reason),
          });

          const existingImage = project.images.find((image) => image.sellingPointId === sellingPoint.id);
          const prompt = buildImagePrompt({
            headline: sellingPoint.headline,
            body: sellingPoint.body,
            imagePrompt: sellingPoint.imagePrompt,
          });

          await this.db.generatedImage.upsert({
            where: {
              sellingPointId: sellingPoint.id,
            },
            update: {
              prompt,
              provider: "gemini",
              status: "failed",
              errorMessage: result.reason instanceof Error ? result.reason.message : "Image generation failed",
              attempt: existingImage ? existingImage.attempt + 1 : 1,
            },
            create: {
              projectId,
              sellingPointId: sellingPoint.id,
              prompt,
              provider: "gemini",
              status: "failed",
              errorMessage: result.reason instanceof Error ? result.reason.message : "Image generation failed",
            },
          });

          await this.db.sellingPoint.update({
            where: { id: sellingPoint.id },
            data: {
              status: "failed",
            },
          });
        }),
      );
    }

    await this.db.project.update({
      where: { id: projectId },
      data: {
        status: successCount === project.sellingPoints.length ? "images_ready" : "images_partial",
      },
    });

    return this.db.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
  }

  async regenerateImage(projectId: string, sellingPointId: string) {
    const project = await this.db.project.findUnique({
      where: { id: projectId },
      include: {
        sellingPoints: true,
        images: true,
      },
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "Project not found", 404);
    }

    const sellingPoint = project.sellingPoints.find((item) => item.id === sellingPointId);

    if (!sellingPoint) {
      throw new AppError("SELLING_POINT_NOT_FOUND", "卖点不存在", 404);
    }

    await this.db.sellingPoint.update({
      where: { id: sellingPointId },
      data: {
        status: "generating",
      },
    });

    const existingImage = project.images.find((image) => image.sellingPointId === sellingPointId);
    const prompt = buildImagePrompt({
      headline: sellingPoint.headline,
      body: sellingPoint.body,
      imagePrompt: sellingPoint.imagePrompt,
    });

    try {
      const generatedImage = await this.imageProvider.generateImage({
        prompt,
        referenceImageUrl: project.sourceImageUrl,
        timeoutMs: 90_000,
      });

      await this.db.generatedImage.upsert({
        where: {
          sellingPointId,
        },
        update: {
          prompt,
          imageUrl: generatedImage.imageUrl,
          provider: "gemini",
          providerJobId: generatedImage.providerJobId,
          status: "succeeded",
          errorMessage: null,
          attempt: existingImage ? existingImage.attempt + 1 : 1,
          rawResponseJson: JSON.stringify(generatedImage.rawResponse ?? null),
        },
        create: {
          projectId,
          sellingPointId,
          prompt,
          imageUrl: generatedImage.imageUrl,
          provider: "gemini",
          providerJobId: generatedImage.providerJobId,
          status: "succeeded",
          rawResponseJson: JSON.stringify(generatedImage.rawResponse ?? null),
        },
      });

      await this.db.sellingPoint.update({
        where: { id: sellingPointId },
        data: {
          status: "done",
        },
      });
    } catch (error) {
      await this.db.generatedImage.upsert({
        where: {
          sellingPointId,
        },
        update: {
          prompt,
          provider: "gemini",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Image generation failed",
          attempt: existingImage ? existingImage.attempt + 1 : 1,
        },
        create: {
          projectId,
          sellingPointId,
          prompt,
          provider: "gemini",
          status: "failed",
          errorMessage: error instanceof Error ? error.message : "Image generation failed",
        },
      });

      await this.db.sellingPoint.update({
        where: { id: sellingPointId },
        data: {
          status: "failed",
        },
      });

      throw error;
    }

    return this.db.project.findUniqueOrThrow({
      where: { id: projectId },
      include: projectInclude,
    });
  }
}
