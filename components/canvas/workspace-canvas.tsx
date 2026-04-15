"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { ImageResultNode } from "@/components/canvas/image-result-node";
import { InputNode } from "@/components/canvas/input-node";
import { ProgressOverlay } from "@/components/canvas/progress-overlay";
import type { WorkspaceProject } from "@/components/canvas/types";
import { SellingPointNode } from "@/components/canvas/selling-point-node";
import { WorkspaceToolbar } from "@/components/canvas/workspace-toolbar";

type BusyState = Record<string, boolean>;

type ApiEnvelope<T> = {
  success: boolean;
  data: T;
  error: { code: string; message: string } | null;
};

type NodeDragState = {
  nodeId: string;
  startX: number;
  startY: number;
  originX: number;
  originY: number;
} | null;

const INPUT_NODE_POSITION = { x: 60, y: 180 };
const COPY_COLUMN_X = 500;
const OUTPUT_COLUMN_X = 1400;
const ROW_START_Y = 120;
const ROW_GAP = 440;
const CANVAS_WIDTH = 2200;
const CANVAS_HEIGHT = 1800;

export function WorkspaceCanvas({ initialProject }: { initialProject: WorkspaceProject }) {
  const [project, setProject] = useState(initialProject);
  const [inputDraft, setInputDraft] = useState({
    title: initialProject.title,
    productName: initialProject.productName ?? "",
    productInput: initialProject.productInput,
    sourceImageUrl: initialProject.sourceImageUrl ?? "",
  });
  const [busy, setBusy] = useState<BusyState>({});
  const [statusMessage, setStatusMessage] = useState<string>("画布就绪。");
  const [scale, setScale] = useState(0.88);
  const [offset, setOffset] = useState({ x: -80, y: -20 });
  const [isDesktop, setIsDesktop] = useState(false);
  const dragState = useRef<{ x: number; y: number; originX: number; originY: number } | null>(null);
  const [nodeDrag, setNodeDrag] = useState<NodeDragState>(null);
  const [nodeOffsets, setNodeOffsets] = useState<Record<string, { x: number; y: number }>>({});
  const [lightbox, setLightbox] = useState<{ imageUrl: string; headline: string } | null>(null);
  const [progress, setProgress] = useState<{ show: boolean; value: number; message: string }>({
    show: false,
    value: 0,
    message: "",
  });
  const progressInterval = useRef<NodeJS.Timeout | null>(null);

  const imageMap = useMemo(() => {
    return new Map(project.images.map((item) => [item.sellingPointId, item]));
  }, [project.images]);

  useEffect(() => {
    function handleResize() {
      setIsDesktop(window.innerWidth >= 768);
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, []);

  function updateBusy(key: string, next: boolean) {
    setBusy((current) => ({ ...current, [key]: next }));
  }

  async function callJson<T>(input: RequestInfo, init?: RequestInit) {
    const response = await fetch(input, init);
    const payload = (await response.json()) as ApiEnvelope<T>;

    if (!response.ok || !payload.success) {
      throw new Error(payload.error?.message ?? "请求失败");
    }

    return payload.data;
  }

  async function refreshProject(nextProject: WorkspaceProject) {
    setProject(nextProject);
    setInputDraft({
      title: nextProject.title,
      productName: nextProject.productName ?? "",
      productInput: nextProject.productInput,
      sourceImageUrl: nextProject.sourceImageUrl ?? "",
    });
  }

  async function saveProjectRequest(nextDraft = inputDraft) {
    const data = await callJson<{ project: WorkspaceProject }>(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(nextDraft),
    });

    await refreshProject(data.project);
    return data.project;
  }

  async function handleSaveProject() {
    updateBusy("project", true);
    try {
      await saveProjectRequest();
      setStatusMessage("输入已保存。");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "保存项目失败");
    } finally {
      updateBusy("project", false);
    }
  }

  async function handleUpload(file: File) {
    updateBusy("upload", true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const upload = await callJson<{ url: string }>("/api/uploads", {
        method: "POST",
        body: formData,
      });

      await saveProjectRequest({
        ...inputDraft,
        sourceImageUrl: upload.url,
      });
      setStatusMessage("参考图已上传。");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "上传失败");
    } finally {
      updateBusy("upload", false);
    }
  }

  async function handleGenerateCopy(replace = false) {
    updateBusy("generateCopy", true);
    setProgress({ show: true, value: 0, message: "正在保存项目信息..." });

    const messages = [
      "正在分析产品信息...",
      "正在生成卖点文案...",
      "正在优化视觉提示词...",
      "即将完成...",
    ];

    let step = 0;
    progressInterval.current = setInterval(() => {
      step += 1;
      const pct = Math.min(95, step * 6);
      const msgIndex = Math.min(Math.floor((pct / 100) * messages.length), messages.length - 1);
      setProgress({ show: true, value: pct, message: messages[msgIndex] });
    }, 280);

    try {
      await saveProjectRequest();
      const data = await callJson<{ project: WorkspaceProject }>(`/api/projects/${project.id}/generate-copy`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ replace }),
      });
      await refreshProject(data.project);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress({ show: true, value: 100, message: replace ? "卖点已替换。" : "卖点已生成。" });
      setTimeout(() => setProgress((p) => ({ ...p, show: false })), 600);
      setStatusMessage(replace ? "卖点已替换。" : "卖点已生成。");
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress({ show: false, value: 0, message: "" });
      setStatusMessage(error instanceof Error ? error.message : "生成文案失败");
    } finally {
      updateBusy("generateCopy", false);
    }
  }

  async function handleSaveSellingPoint(payload: { sellingPointId: string; headline: string; body: string }) {
    updateBusy(`save-${payload.sellingPointId}`, true);
    try {
      const data = await callJson<{ project: WorkspaceProject }>(`/api/projects/${project.id}/update-selling-point`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      await refreshProject(data.project);
      setStatusMessage(`卖点 ${payload.sellingPointId.slice(-4)} 已保存。`);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "保存卖点失败");
    } finally {
      updateBusy(`save-${payload.sellingPointId}`, false);
    }
  }

  async function handleGenerateImages() {
    updateBusy("generateImages", true);
    setProgress({ show: true, value: 0, message: "正在准备图片生成..." });

    const total = Math.max(1, project.sellingPoints.length);
    const messages = [
      "正在准备图片生成...",
      "正在生成第 1-2 张图片...",
      "正在生成第 3-4 张图片...",
      "正在生成剩余图片...",
      "正在保存结果...",
    ];

    let step = 0;
    progressInterval.current = setInterval(() => {
      step += 1;
      const pct = Math.min(95, step * 4);
      const msgIndex = Math.min(Math.floor((pct / 100) * messages.length), messages.length - 1);
      setProgress({ show: true, value: pct, message: messages[msgIndex] });
    }, 600);

    try {
      const data = await callJson<{ project: WorkspaceProject }>(`/api/projects/${project.id}/generate-images`, {
        method: "POST",
      });
      await refreshProject(data.project);
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress({ show: true, value: 100, message: "图片生成完成。" });
      setTimeout(() => setProgress((p) => ({ ...p, show: false })), 600);
      setStatusMessage("图片生成完成。");
    } catch (error) {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
      setProgress({ show: false, value: 0, message: "" });
      setStatusMessage(error instanceof Error ? error.message : "生成图片失败");
    } finally {
      updateBusy("generateImages", false);
    }
  }

  async function handleRegenerateImage(sellingPointId: string) {
    updateBusy(`regen-${sellingPointId}`, true);
    try {
      const data = await callJson<{ project: WorkspaceProject }>(`/api/projects/${project.id}/regenerate-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sellingPointId }),
      });
      await refreshProject(data.project);
      setStatusMessage("图片已刷新。");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "重新生成图片失败");
    } finally {
      updateBusy(`regen-${sellingPointId}`, false);
    }
  }

  async function handleExport() {
    updateBusy("export", true);
    try {
      const response = await fetch(`/api/projects/${project.id}/export`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json()) as ApiEnvelope<null>;
        throw new Error(payload.error?.message ?? "导出项目失败");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${project.title.replace(/\s+/g, "-").toLowerCase() || "project"}.zip`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatusMessage("导出就绪。");
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : "导出项目失败");
    } finally {
      updateBusy("export", false);
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDesktop) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("[data-node]")) {
      return;
    }

    dragState.current = {
      x: event.clientX,
      y: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
  }

  function handleNodePointerDown(event: React.PointerEvent, nodeId: string) {
    event.stopPropagation();
    const origin = nodeOffsets[nodeId] || { x: 0, y: 0 };
    setNodeDrag({
      nodeId,
      startX: event.clientX,
      startY: event.clientY,
      originX: origin.x,
      originY: origin.y,
    });
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (nodeDrag) {
      const dx = (event.clientX - nodeDrag.startX) / scale;
      const dy = (event.clientY - nodeDrag.startY) / scale;
      setNodeOffsets((prev) => ({
        ...prev,
        [nodeDrag.nodeId]: {
          x: nodeDrag.originX + dx,
          y: nodeDrag.originY + dy,
        },
      }));
      return;
    }

    if (!dragState.current) {
      return;
    }

    const nextX = dragState.current.originX + (event.clientX - dragState.current.x);
    const nextY = dragState.current.originY + (event.clientY - dragState.current.y);
    setOffset({ x: nextX, y: nextY });
  }

  function handlePointerUp() {
    setNodeDrag(null);
    dragState.current = null;
  }

  function handleWheel(event: React.WheelEvent<HTMLDivElement>) {
    if (!isDesktop) {
      return;
    }

    event.preventDefault();
    setScale((current) => {
      const next = current - event.deltaY * 0.0007;
      return Math.min(1.2, Math.max(0.55, Number(next.toFixed(2))));
    });
  }

  function fitView() {
    setScale(0.88);
    setOffset({ x: -80, y: -20 });
  }

  return (
    <main className="relative h-screen overflow-hidden bg-[#060c16]">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 p-4 md:p-5">
        <WorkspaceToolbar
          title={project.title}
          scale={scale}
          onZoomIn={() => setScale((current) => Math.min(1.2, Number((current + 0.08).toFixed(2))))}
          onZoomOut={() => setScale((current) => Math.max(0.55, Number((current - 0.08).toFixed(2))))}
          onFit={fitView}
          onGenerateImages={handleGenerateImages}
          onExport={handleExport}
          disableGenerateImages={busy.generateImages || project.sellingPoints.length === 0}
          disableExport={busy.export}
        />
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-full border border-white/10 bg-slate-950/75 px-4 py-2 text-sm text-slate-300 backdrop-blur">
        {statusMessage}
      </div>

      <div
        className="grid-bg h-full w-full overflow-auto md:overflow-hidden"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onWheel={handleWheel}
      >
        <div
          className="relative min-h-full min-w-full px-4 pb-24 pt-28 md:p-0"
          style={
            isDesktop
              ? {
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
                  transformOrigin: "top left",
                  width: CANVAS_WIDTH,
                  height: CANVAS_HEIGHT,
                }
              : undefined
          }
        >
          <svg className="pointer-events-none absolute left-0 top-0 hidden md:block" width={CANVAS_WIDTH} height={CANVAS_HEIGHT} fill="none">
            <defs>
              <linearGradient id="line-gradient" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="rgba(104,225,253,0.22)" />
                <stop offset="100%" stopColor="rgba(118,255,221,0.06)" />
              </linearGradient>
            </defs>
            {project.sellingPoints.map((item, index) => {
              const inputOffset = nodeOffsets["input"] || { x: 0, y: 0 };
              const spOffset = nodeOffsets[`sp-${item.id}`] || { x: 0, y: 0 };
              const imgOffset = nodeOffsets[`img-${item.id}`] || { x: 0, y: 0 };

              const spCol = index % 2;
              const spRow = Math.floor(index / 2);
              const imgCol = index % 2;
              const imgRow = Math.floor(index / 2);

              const inputX = INPUT_NODE_POSITION.x + 420 + inputOffset.x;
              const inputY = INPUT_NODE_POSITION.y + 120 + inputOffset.y;
              const spX = COPY_COLUMN_X + spCol * 444 + spOffset.x;
              const spY = ROW_START_Y + spRow * ROW_GAP + 90 + spOffset.y;
              const imgX = OUTPUT_COLUMN_X + imgCol * 384 + imgOffset.x;
              const imgY = ROW_START_Y + imgRow * ROW_GAP + 90 + imgOffset.y;

              return (
                <g key={item.id}>
                  <path
                    d={`M ${inputX} ${inputY} C ${inputX + 20} ${inputY}, ${spX - 90} ${spY}, ${spX} ${spY}`}
                    stroke="url(#line-gradient)"
                    strokeDasharray="10 10"
                    strokeWidth="2"
                  />
                  <path
                    d={`M ${spX + 420} ${spY} C ${spX + 430} ${spY}, ${imgX - 60} ${imgY}, ${imgX} ${imgY}`}
                    stroke="url(#line-gradient)"
                    strokeDasharray="10 10"
                    strokeWidth="2"
                  />
                </g>
              );
            })}
          </svg>

          <div
            data-node
            className="relative md:absolute"
            style={
              isDesktop
                ? {
                    left: INPUT_NODE_POSITION.x + (nodeOffsets["input"]?.x ?? 0),
                    top: INPUT_NODE_POSITION.y + (nodeOffsets["input"]?.y ?? 0),
                    zIndex: nodeDrag?.nodeId === "input" ? 50 : 10,
                  }
                : undefined
            }
          >
            <InputNode
              title={inputDraft.title}
              productName={inputDraft.productName}
              productInput={inputDraft.productInput}
              sourceImageUrl={inputDraft.sourceImageUrl || undefined}
              isBusy={Boolean(busy.project || busy.upload || busy.generateCopy)}
              onFieldChange={(field, value) => setInputDraft((current) => ({ ...current, [field]: value }))}
              onSave={handleSaveProject}
              onGenerateCopy={() => handleGenerateCopy(false)}
              onReplaceCopy={() => handleGenerateCopy(true)}
              onUpload={handleUpload}
              onDragStart={(event) => handleNodePointerDown(event, "input")}
            />
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 md:mt-0">
            {project.sellingPoints.map((item, index) => {
              const nodeId = `sp-${item.id}`;
              const pos = nodeOffsets[nodeId] || { x: 0, y: 0 };
              const col = index % 2;
              const row = Math.floor(index / 2);
              return (
                <div
                  key={item.id}
                  data-node
                  className="relative md:absolute"
                  style={
                    isDesktop
                      ? {
                          left: COPY_COLUMN_X + col * 444 + pos.x,
                          top: ROW_START_Y + row * ROW_GAP + pos.y,
                          zIndex: nodeDrag?.nodeId === nodeId ? 50 : 10,
                        }
                      : undefined
                  }
                >
                  <SellingPointNode
                    item={item}
                    isSaving={busy[`save-${item.id}`]}
                    isRegenerating={busy[`regen-${item.id}`]}
                    onSave={handleSaveSellingPoint}
                    onRegenerate={handleRegenerateImage}
                    onDragStart={(event) => handleNodePointerDown(event, nodeId)}
                  />
                </div>
              );
            })}
          </div>

          <div className="mt-6 grid grid-cols-2 gap-6 md:mt-0">
            {project.sellingPoints.map((item, index) => {
              const nodeId = `img-${item.id}`;
              const pos = nodeOffsets[nodeId] || { x: 0, y: 0 };
              const col = index % 2;
              const row = Math.floor(index / 2);
              return (
                <div
                  key={`${item.id}-image`}
                  data-node
                  className="relative md:absolute"
                  style={
                    isDesktop
                      ? {
                          left: OUTPUT_COLUMN_X + col * 384 + pos.x,
                          top: ROW_START_Y + row * ROW_GAP + pos.y,
                          zIndex: nodeDrag?.nodeId === nodeId ? 50 : 10,
                        }
                      : undefined
                  }
                >
                  <ImageResultNode
                    item={item}
                    image={imageMap.get(item.id)}
                    isBusy={busy[`regen-${item.id}`]}
                    onRegenerate={handleRegenerateImage}
                    onDragStart={(event) => handleNodePointerDown(event, nodeId)}
                    onImageClick={(imageUrl, headline) => setLightbox({ imageUrl, headline })}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {progress.show ? <ProgressOverlay progress={progress.value} message={progress.message} /> : null}

      {lightbox ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lightbox.imageUrl}
            alt={lightbox.headline}
            className="max-h-full max-w-full rounded-[16px] object-contain"
          />
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full bg-white/10 px-4 py-2 text-white hover:bg-white/20"
            onClick={() => setLightbox(null)}
          >
            关闭
          </button>
        </div>
      ) : null}
    </main>
  );
}
