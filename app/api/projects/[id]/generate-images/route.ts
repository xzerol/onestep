import { apiError, apiSuccess } from "@/lib/api";
import { GenerationService } from "@/services/generation-service";

export async function POST(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const service = new GenerationService();
    const project = await service.generateAllImages(id);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}
