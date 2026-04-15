import { mkdir } from "node:fs/promises";
import path from "node:path";

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function ensureDirectory(targetPath: string) {
  await mkdir(targetPath, { recursive: true });
}

export function publicFilePath(...segments: string[]) {
  return path.join(/* turbopackIgnore: true */ process.cwd(), "public", ...segments);
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

export function sanitizeFilename(value: string) {
  return value.replace(/[^a-z0-9-_]+/gi, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}
