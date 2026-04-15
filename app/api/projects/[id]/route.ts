import { apiError, apiSuccess } from "@/lib/api";
import { updateProjectSchema } from "@/lib/schemas";
import { ProjectService } from "@/services/project-service";

export async function GET(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const project = await ProjectService.getWorkspaceProject(id);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const payload = updateProjectSchema.parse(await request.json());
    const project = await ProjectService.updateProject(id, payload);

    return apiSuccess({ project });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const result = await ProjectService.deleteProject(id);

    return apiSuccess(result);
  } catch (error) {
    return apiError(error);
  }
}
