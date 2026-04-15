import { apiError, apiSuccess } from "@/lib/api";
import { updateSellingPointSchema } from "@/lib/schemas";
import { GenerationService } from "@/services/generation-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = updateSellingPointSchema.parse(await request.json());
    const service = new GenerationService();
    const project = await service.updateSellingPoint(id, payload);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}
