import Link from "next/link";

import { ProjectService } from "@/services/project-service";
import { ProjectForm } from "@/components/project-form";
import { projectStatusMap } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await ProjectService.listProjects({ take: 3 });

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <section className="grid gap-8 rounded-[36px] border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur md:grid-cols-[1.1fr_0.9fr] md:p-12">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-5">
              <p className="inline-flex w-fit rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs uppercase tracking-[0.28em] text-cyan-100/80">
                画布优先工作流
              </p>
              <div className="space-y-4">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.04em] text-white md:text-6xl">
                  一键生成亚马逊主图
                </h1>
                <p className="max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
                  产品输入、可编辑文案与生成图片集中呈现。工作区采用节点板布局，让团队以流程图方式思考，而非在多个标签页间切换。
                </p>
              </div>
            </div>
            <div className="grid gap-4 text-sm text-slate-200 md:grid-cols-3">
              <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-semibold text-cyan-200">1</p>
                <p className="mt-2">输入节点收集产品详情与可选的白底产品图上传。</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-semibold text-cyan-200">5</p>
                <p className="mt-2">卖点节点在生成图片前后均可编辑，灵活调整。</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-black/10 p-4">
                <p className="text-2xl font-semibold text-cyan-200">ZIP</p>
                <p className="mt-2">将图片资源与元数据打包为一份交付文件。</p>
              </div>
            </div>
          </div>
          <ProjectForm />
        </section>

        <section className="grid gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white">最近画布</h2>
              <p className="mt-1 text-sm text-slate-400">保留最近 3 个项目，更多内容进入列表页管理。</p>
            </div>
            <a
              href="/projects"
              className="inline-flex items-center rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
            >
              查看全部项目
            </a>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-sm text-slate-400">
              暂无项目。创建第一个画布，开始生成卖点。
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/workspace/${project.id}`}
                  className="rounded-[28px] border border-white/10 bg-white/5 p-5 transition hover:border-cyan-300/30 hover:bg-white/8"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-medium text-white">{project.title}</p>
                    <span className="rounded-full border border-white/10 px-2 py-1 text-xs uppercase tracking-[0.18em] text-slate-300">
                      {projectStatusMap[project.status] ?? project.status}
                    </span>
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-400">{project.productInput}</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
