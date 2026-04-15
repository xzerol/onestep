import type { Prisma } from "@prisma/client";

import type { projectInclude } from "@/services/project-service";

export type WorkspaceProject = Prisma.ProjectGetPayload<{
  include: typeof projectInclude;
}>;
