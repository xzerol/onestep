"use client";

import type { WorkspaceProject } from "@/components/canvas/types";
import { imageStatusMap } from "@/lib/i18n";

type SellingPoint = WorkspaceProject["sellingPoints"][number];
type GeneratedImage = WorkspaceProject["images"][number];

export function ImageResultNode(props: {
  item: SellingPoint;
  image?: GeneratedImage;
  isBusy?: boolean;
  onRegenerate: (sellingPointId: string) => void;
  onDragStart?: (event: React.PointerEvent) => void;
  onImageClick?: (imageUrl: string, headline: string) => void;
}) {
  const stale = props.item.status === "image_stale";
  const imageUrl = props.image?.imageUrl ?? null;

  return (
    <div className="canvas-node w-full md:w-[360px] rounded-[30px] p-5 text-sm text-slate-200">
      <div
        className="mb-4 flex cursor-move items-start justify-between gap-4"
        onPointerDown={props.onDragStart}
      >
        <div>
          <p className="text-[11px] uppercase tracking-[0.26em] text-cyan-200/70">输出节点 {props.item.order}</p>
          <h3 className="mt-2 text-lg font-semibold text-white">{props.item.headline}</h3>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] ${
            stale ? "bg-amber-300/15 text-amber-200" : "bg-white/8 text-slate-300"
          }`}
        >
          {stale ? "待刷新" : imageStatusMap[props.image?.status ?? "queued"]}
        </span>
      </div>

      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={props.item.headline}
          onClick={() => props.onImageClick?.(imageUrl, props.item.headline)}
          className="h-[260px] w-full cursor-zoom-in rounded-[24px] border border-white/10 object-cover"
        />
      ) : (
        <div className="flex h-[260px] items-center justify-center rounded-[24px] border border-dashed border-white/10 bg-slate-950/80 text-center text-sm text-slate-500">
          生成的图片将显示在这里。
        </div>
      )}

      <div className="mt-4 space-y-1 text-xs leading-6 text-slate-400">
        <p>状态：{stale ? "需要刷新" : imageStatusMap[props.image?.status ?? "queued"]}</p>
        {props.image?.errorMessage ? <p className="text-rose-300">{props.image.errorMessage}</p> : null}
      </div>

      <button
        type="button"
        disabled={props.isBusy}
        onClick={() => props.onRegenerate(props.item.id)}
        className="mt-4 rounded-full border border-white/10 px-4 py-2 text-slate-200 transition hover:border-cyan-300/30 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        重新生成图片
      </button>
    </div>
  );
}
