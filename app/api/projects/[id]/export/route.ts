import { apiError } from "@/lib/api";
import { ExportService } from "@/services/export-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const buffer = await ExportService.createProjectExport(id);
    const body = new Uint8Array(buffer);

    return new Response(body, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="project-${id}.zip"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
