import { readFile } from "node:fs/promises";

import JSZip from "jszip";

import { publicFilePath } from "@/lib/utils";
import { ProjectService } from "@/services/project-service";

export class ExportService {
  static async createProjectExport(projectId: string) {
    const project = await ProjectService.getWorkspaceProject(projectId);
    const zip = new JSZip();
    const imagesFolder = zip.folder("images");

    const metadata = {
      project: {
        id: project.id,
        title: project.title,
        productName: project.productName,
        productInput: project.productInput,
        sourceImageUrl: project.sourceImageUrl,
        status: project.status,
      },
      sellingPoints: project.sellingPoints.map((sellingPoint) => {
        const image = project.images.find((item) => item.sellingPointId === sellingPoint.id);

        return {
          id: sellingPoint.id,
          order: sellingPoint.order,
          headline: sellingPoint.headline,
          body: sellingPoint.body,
          imagePrompt: sellingPoint.imagePrompt,
          status: sellingPoint.status,
          image: image
            ? {
                status: image.status,
                imageUrl: image.imageUrl,
                errorMessage: image.errorMessage,
              }
            : null,
        };
      }),
      exportedAt: new Date().toISOString(),
    };

    await Promise.all(
      project.images.map(async (image) => {
        if (!image.imageUrl || !imagesFolder) {
          return;
        }

        try {
          const imagePath = publicFilePath(image.imageUrl.replace(/^\/+/, ""));
          const buffer = await readFile(imagePath);
          const extension = image.imageUrl.toLowerCase().endsWith(".jpg") || image.imageUrl.toLowerCase().endsWith(".jpeg") ? "jpg" : "png";
          const sellingPoint = project.sellingPoints.find((item) => item.id === image.sellingPointId);
          const index = sellingPoint?.order ?? 0;

          imagesFolder.file(`${index}.${extension}`, buffer);
        } catch {
          // Export still succeeds even if one image cannot be read.
        }
      }),
    );

    zip.file("metadata.json", JSON.stringify(metadata, null, 2));

    return zip.generateAsync({ type: "nodebuffer" });
  }
}
