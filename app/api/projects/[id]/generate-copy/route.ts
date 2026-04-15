import { apiError, apiSuccess } from "@/lib/api";
import { generateCopySchema } from "@/lib/schemas";
import { GenerationService } from "@/services/generation-service";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = generateCopySchema.parse(await request.json().catch(() => ({})));
    const service = new GenerationService();
    const project = await service.generateCopy(id, payload.replace);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}
