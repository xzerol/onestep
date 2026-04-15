"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ProjectForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    productName: "",
    productInput: "",
  });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as {
        success: boolean;
        data: { id: string };
        error: { message: string } | null;
      };

      if (!response.ok || !payload.success) {
        setError(payload.error?.message ?? "创建项目失败");
        return;
      }

      router.push(`/workspace/${payload.data.id}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-black/10 p-6 backdrop-blur md:p-8">
      <div className="mb-6">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200/70">新建画布</p>
        <h2 className="mt-3 text-2xl font-semibold text-white">开启产品视觉工作区</h2>
      </div>

      <div className="grid gap-4">
        <label className="grid gap-2 text-sm text-slate-300">
          项目标题
          <input
            required
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="便携式榨汁机主图"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          产品名称
          <input
            value={form.productName}
            onChange={(event) => setForm((current) => ({ ...current, productName: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="便携式榨汁机"
          />
        </label>

        <label className="grid gap-2 text-sm text-slate-300">
          产品描述
          <textarea
            required
            rows={5}
            value={form.productInput}
            onChange={(event) => setForm((current) => ({ ...current, productInput: event.target.value }))}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
            placeholder="一款便携式榨汁机，USB-C 充电，300ml，适合健身和旅行"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-cyan-300 px-4 py-3 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "创建中..." : "创建工作区"}
      </button>
    </form>
  );
}
