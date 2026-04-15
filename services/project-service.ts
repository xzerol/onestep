import { AppError } from "@/lib/api";
import { db } from "@/lib/db";
import type { CreateProjectInput } from "@/lib/schemas";

export const projectInclude = {
  sellingPoints: {
    orderBy: {
      order: "asc" as const,
    },
    include: {
      images: true,
    },
  },
  images: {
    orderBy: {
      createdAt: "asc" as const,
    },
  },
};

export class ProjectService {
  static async createProject(input: CreateProjectInput) {
    return db.project.create({
      data: {
        title: input.title,
        productName: input.productName || null,
        productInput: input.productInput,
        sourceImageUrl: input.sourceImageUrl || null,
      },
    });
  }

  static async listProjects(options?: { take?: number }) {
    return db.project.findMany({
      orderBy: {
        updatedAt: "desc",
      },
      ...(options?.take ? { take: options.take } : {}),
    });
  }

  static async getWorkspaceProject(projectId: string) {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: projectInclude,
    });

    if (!project) {
      throw new AppError("PROJECT_NOT_FOUND", "项目不存在", 404);
    }

    return project;
  }

  static async updateProject(
    projectId: string,
    input: {
      title: string;
      productName?: string | null;
      productInput: string;
      sourceImageUrl?: string | null;
    },
  ) {
    const existing = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!existing) {
      throw new AppError("PROJECT_NOT_FOUND", "项目不存在", 404);
    }

    return db.project.update({
      where: { id: projectId },
      data: {
        title: input.title,
        productName: input.productName || null,
        productInput: input.productInput,
        sourceImageUrl: input.sourceImageUrl || null,
      },
      include: projectInclude,
    });
  }

  static async deleteProject(projectId: string) {
    const existing = await db.project.findUnique({
      where: { id: projectId },
      select: { id: true },
    });

    if (!existing) {
      throw new AppError("PROJECT_NOT_FOUND", "项目不存在", 404);
    }

    await db.project.delete({
      where: { id: projectId },
    });

    return { id: projectId };
  }
}
