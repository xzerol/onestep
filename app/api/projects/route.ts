import { apiError, apiSuccess } from "@/lib/api";
import { createProjectSchema } from "@/lib/schemas";
import { ProjectService } from "@/services/project-service";

export async function GET() {
  try {
    const projects = await ProjectService.listProjects();
    return apiSuccess({ projects });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = createProjectSchema.parse(await request.json());
    const project = await ProjectService.createProject(payload);

    return apiSuccess(
      {
        id: project.id,
        status: project.status,
      },
      { status: 201 },
    );
  } catch (error) {
    return apiError(error);
  }
}
