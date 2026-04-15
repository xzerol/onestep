"use client";

import { useState } from "react";

import type { WorkspaceProject } from "@/components/canvas/types";
import { sellingPointStatusMap } from "@/lib/i18n";

type SellingPoint = WorkspaceProject["sellingPoints"][number];

const statusColor: Record<string, string> = {
  ready: "bg-cyan-300",
  edited: "bg-amber-300",
  image_stale: "bg-amber-300",
  generating: "bg-violet-300",
  done: "bg-emerald-300",
  failed: "bg-rose-300",
  draft: "bg-slate-500",
};

export function SellingPointNode(props: {
  item: SellingPoint;
  isSaving?: boolean;
  isRegenerating?: boolean;
  onSave: (payload: { sellingPointId: string; headline: string; body: string }) => void;
  onRegenerate: (sellingPointId: string) => void;
  onDragStart?: (event: React.PointerEvent) => void;
}) {
  const [headline, setHeadline] = useState(props.item.headline);
  const [body, setBody] = useState(props.item.body);
  const [showPrompt, setShowPrompt] = useState(false);

  return (
    <div className="canvas-node w-full md:w-[420px] rounded-[30px] p-5 text-sm text-slate-200">
      <div
        className="mb-5 flex cursor-move items-center justify-between"
        onPointerDown={props.onDragStart}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">卖点 {props.item.order}</p>
          <h3 className="mt-2 text-xl font-semibold text-white">{props.item.headline}</h3>
        </div>
        <div className={`status-dot ${statusColor[props.item.status] ?? "bg-slate-500"}`} />
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">标题</span>
          <input
            value={headline}
            onChange={(event) => setHeadline(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">正文</span>
          <textarea
            rows={4}
            value={body}
            onChange={(event) => setBody(event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => setShowPrompt((current) => !current)}
        className="mt-4 inline-flex rounded-full border border-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
      >
        {showPrompt ? "隐藏提示词" : "显示提示词"}
      </button>

      {showPrompt ? (
        <div className="mt-4 rounded-[22px] border border-white/10 bg-slate-950/80 p-4 text-xs leading-6 text-slate-400">
          {props.item.imagePrompt}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.isSaving}
          onClick={() => props.onSave({ sellingPointId: props.item.id, headline, body })}
          className="rounded-full bg-cyan-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          保存文案
        </button>
        <button
          type="button"
          disabled={props.isRegenerating}
          onClick={() => props.onRegenerate(props.item.id)}
          className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          重新生成图片
        </button>
      </div>
    </div>
  );
}
