import { apiError, apiSuccess } from "@/lib/api";
import { regenerateImageSchema } from "@/lib/schemas";
import { GenerationService } from "@/services/generation-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = regenerateImageSchema.parse(await request.json());
    const service = new GenerationService();
    const project = await service.regenerateImage(id, payload.sellingPointId);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}
