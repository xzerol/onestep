import { notFound } from "next/navigation";

import { WorkspaceCanvas } from "@/components/canvas/workspace-canvas";
import { ProjectService } from "@/services/project-service";

export const dynamic = "force-dynamic";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await ProjectService.getWorkspaceProject(id).catch(() => null);

  if (!project) {
    notFound();
  }

  return <WorkspaceCanvas initialProject={project} />;
}
