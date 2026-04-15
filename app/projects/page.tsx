import Link from "next/link";

import { ProjectLibrary } from "@/components/project-library";
import { ProjectService } from "@/services/project-service";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await ProjectService.listProjects();

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="flex flex-col gap-4 rounded-[32px] border border-white/10 bg-white/5 p-6 backdrop-blur md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/70">项目列表</p>
            <h1 className="text-3xl font-semibold text-white md:text-4xl">搜索、编辑和删除已有画布</h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
              这里展示全部项目。你可以按标题、产品名或产品描述搜索，并直接在列表中修改或删除项目。
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            >
              返回首页
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
            >
              新建画布
            </Link>
          </div>
        </div>

        <ProjectLibrary initialProjects={projects} />
      </div>
    </main>
  );
}
