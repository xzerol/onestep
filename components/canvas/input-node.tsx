"use client";

import { useRef } from "react";

export function InputNode(props: {
  title: string;
  productName: string;
  productInput: string;
  sourceImageUrl?: string | null;
  isBusy?: boolean;
  onFieldChange: (field: "title" | "productName" | "productInput", value: string) => void;
  onSave: () => void;
  onGenerateCopy: () => void;
  onReplaceCopy: () => void;
  onUpload: (file: File) => void;
  onDragStart?: (event: React.PointerEvent) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="canvas-node w-full md:w-[420px] rounded-[30px] p-5 text-sm text-slate-200">
      <div
        className="mb-5 flex cursor-move items-center justify-between"
        onPointerDown={props.onDragStart}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">输入节点</p>
          <h2 className="mt-2 text-xl font-semibold text-white">产品简介</h2>
        </div>
        <div className="status-dot bg-cyan-300 shadow-[0_0_18px_rgba(104,225,253,0.8)]" />
      </div>

      <div className="grid gap-3">
        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">项目标题</span>
          <input
            value={props.title}
            onChange={(event) => props.onFieldChange("title", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">产品名称</span>
          <input
            value={props.productName}
            onChange={(event) => props.onFieldChange("productName", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>

        <label className="grid gap-2">
          <span className="text-xs uppercase tracking-[0.18em] text-slate-400">产品描述</span>
          <textarea
            rows={7}
            value={props.productInput}
            onChange={(event) => props.onFieldChange("productInput", event.target.value)}
            className="rounded-2xl border border-white/10 bg-slate-950/80 px-4 py-3 text-white outline-none transition focus:border-cyan-300/40"
          />
        </label>
      </div>

      <div className="mt-4 rounded-[24px] border border-dashed border-white/10 bg-white/5 p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.18em] text-slate-400">参考图片</p>
          <button
            type="button"
            className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300 transition hover:border-cyan-300/30 hover:text-white"
            onClick={() => fileInputRef.current?.click()}
          >
            上传
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                props.onUpload(file);
              }
            }}
          />
        </div>

        {props.sourceImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.sourceImageUrl}
            alt="参考产品图"
            className="h-48 w-full rounded-[20px] object-cover"
          />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-[20px] bg-slate-950/60 text-center text-sm text-slate-500">
            上传一张白底产品图，有助于生成更精准的图片提示词。
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={props.isBusy}
          onClick={props.onSave}
          className="rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          保存输入
        </button>
        <button
          type="button"
          disabled={props.isBusy}
          onClick={props.onGenerateCopy}
          className="rounded-full bg-cyan-300 px-4 py-2 font-medium text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          生成文案
        </button>
        <button
          type="button"
          disabled={props.isBusy}
          onClick={props.onReplaceCopy}
          className="rounded-full border border-cyan-300/25 px-4 py-2 text-cyan-100 transition hover:border-cyan-300/60 disabled:cursor-not-allowed disabled:opacity-60"
        >
          替换全部文案
        </button>
      </div>
    </div>
  );
}
