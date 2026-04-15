"use client";

import Link from "next/link";

export function WorkspaceToolbar(props: {
  title: string;
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onGenerateImages: () => void;
  onExport: () => void;
  disableGenerateImages?: boolean;
  disableExport?: boolean;
}) {
  return (
    <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-[26px] border border-white/10 bg-slate-950/75 px-4 py-3 shadow-2xl backdrop-blur">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
        >
          返回
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-slate-400">工作区</p>
          <p className="text-sm font-medium text-white">{props.title}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full border border-white/10 px-3 py-2 text-slate-300">{Math.round(props.scale * 100)}%</span>
        <button
          type="button"
          onClick={props.onZoomOut}
          className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
        >
          缩小
        </button>
        <button
          type="button"
          onClick={props.onZoomIn}
          className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
        >
          放大
        </button>
        <button
          type="button"
          onClick={props.onFit}
          className="rounded-full border border-white/10 px-3 py-2 text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
        >
          适配画布
        </button>
        <button
          type="button"
          disabled={props.disableGenerateImages}
          onClick={props.onGenerateImages}
          className="rounded-full bg-cyan-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          生成全部图片
        </button>
        <button
          type="button"
          disabled={props.disableExport}
          onClick={props.onExport}
          className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          导出 ZIP
        </button>
      </div>
    </div>
  );
}
