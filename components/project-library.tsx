"use client";

import Link from "next/link";
import { useDeferredValue, useState, useTransition } from "react";

import { projectStatusMap } from "@/lib/i18n";

type ProjectListItem = {
  id: string;
  title: string;
  productName: string | null;
  productInput: string;
  status: string;
  updatedAt: string | Date;
};

type ApiResult<T> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
};

export function ProjectLibrary({ initialProjects }: { initialProjects: ProjectListItem[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [query, setQuery] = useState("");
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [editor, setEditor] = useState({
    title: "",
    productName: "",
    productInput: "",
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const deferredQuery = useDeferredValue(query);

  const filteredProjects = (() => {
    const normalized = deferredQuery.trim().toLowerCase();

    if (!normalized) {
      return projects;
    }

    return projects.filter((project) =>
      [project.title, project.productName ?? "", project.productInput].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  })();

  function startEdit(project: ProjectListItem) {
    setActiveProjectId(project.id);
    setEditor({
      title: project.title,
      productName: project.productName ?? "",
      productInput: project.productInput,
    });
    setError(null);
    setFeedback(null);
  }

  function cancelEdit() {
    setActiveProjectId(null);
    setError(null);
  }

  function updateField(name: "title" | "productName" | "productInput", value: string) {
    setEditor((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function saveProject(projectId: string) {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editor),
      });

      const payload = (await response.json()) as ApiResult<{ project: ProjectListItem }>;

      if (!response.ok || !payload.success || !payload.data) {
        setError(payload.error?.message ?? "保存项目失败");
        return;
      }

      setProjects((current) =>
        current.map((project) => (project.id === projectId ? payload.data!.project : project)),
      );
      setActiveProjectId(null);
      setFeedback("项目已更新");
    });
  }

  function deleteProject(projectId: string) {
    setError(null);
    setFeedback(null);

    if (!window.confirm("确认删除这个项目吗？此操作无法撤销。")) {
      return;
    }

    startTransition(async () => {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as ApiResult<{ id: string }>;

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "删除项目失败");
        return;
      }

      setProjects((current) => current.filter((project) => project.id !== projectId));
      if (activeProjectId === projectId) {
        setActiveProjectId(null);
      }
      setFeedback("项目已删除");
    });
  }

  return (
    <section className="grid gap-4">
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <label className="grid gap-2 text-sm text-slate-300">
          搜索项目
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="按项目标题、产品名称或产品描述搜索"
          />
        </label>
        {feedback ? <p className="mt-3 text-sm text-emerald-300">{feedback}</p> : null}
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/15 bg-white/5 px-6 py-10 text-sm text-slate-400">
          没有找到匹配的项目，试试别的关键词。
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredProjects.map((project) => {
            const isEditing = activeProjectId === project.id;

            return (
              <article key={project.id} className="rounded-[28px] border border-white/10 bg-white/5 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-lg font-medium text-white">{project.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
                      <span className="rounded-full border border-white/10 px-2 py-1">
                        {projectStatusMap[project.status] ?? project.status}
                      </span>
                      <span>更新于 {new Date(project.updatedAt).toLocaleString("zh-CN")}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/workspace/${project.id}`}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
                    >
                      打开画布
                    </Link>
                    <button
                      type="button"
                      onClick={() => startEdit(project)}
                      className="rounded-full border border-white/10 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProject(project.id)}
                      disabled={isPending}
                      className="rounded-full border border-rose-300/20 px-3 py-2 text-sm text-rose-200 transition hover:border-rose-300/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      删除
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="mt-4 grid gap-4">
                    <label className="grid gap-2 text-sm text-slate-300">
                      项目标题
                      <input
                        value={editor.title}
                        onChange={(event) => updateField("title", event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <label className="grid gap-2 text-sm text-slate-300">
                      产品名称
                      <input
                        value={editor.productName}
                        onChange={(event) => updateField("productName", event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <label className="grid gap-2 text-sm text-slate-300">
                      产品描述
                      <textarea
                        rows={5}
                        value={editor.productInput}
                        onChange={(event) => updateField("productInput", event.target.value)}
                        className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => saveProject(project.id)}
                        disabled={isPending}
                        className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isPending ? "保存中..." : "保存修改"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={isPending}
                        className="rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid gap-3 text-sm text-slate-300">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">产品名称</p>
                      <p className="mt-1 text-sm text-slate-200">{project.productName || "未填写"}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">产品描述</p>
                      <p className="mt-1 line-clamp-4 leading-6 text-slate-300">{project.productInput}</p>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
