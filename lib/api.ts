import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { logger } from "@/lib/logger";
import { toErrorMessage } from "@/lib/utils";

export class AppError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export function apiSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(
    {
      success: true,
      data,
      error: null,
    },
    init,
  );
}

export function apiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: error.code,
          message: error.message,
        },
      },
      { status: error.status },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        error: {
          code: "INVALID_INPUT",
          message: error.issues[0]?.message ?? "请求参数无效",
        },
      },
      { status: 400 },
    );
  }

  const message = toErrorMessage(error);
  logger.error("未处理的 API 错误", { message });

  return NextResponse.json(
    {
      success: false,
      data: null,
      error: {
        code: "INTERNAL_ERROR",
        message,
      },
    },
    { status: 500 },
  );
}
