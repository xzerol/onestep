"use client";

export function ProgressOverlay({ progress, message }: { progress: number; message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-80 rounded-2xl border border-white/10 bg-slate-950/90 p-6 shadow-2xl">
        <p className="mb-4 text-center text-sm text-slate-200">{message}</p>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-3 text-center text-xs text-slate-400">{progress}%</p>
      </div>
    </div>
  );
}
