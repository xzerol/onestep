import { z } from "zod";

export const sellingPointStatusSchema = z.enum([
  "draft",
  "ready",
  "edited",
  "image_stale",
  "generating",
  "done",
  "failed",
]);

export const generatedImageStatusSchema = z.enum(["queued", "generating", "succeeded", "failed"]);

export const projectStatusSchema = z.enum([
  "draft",
  "copy_ready",
  "images_generating",
  "images_partial",
  "images_ready",
  "failed",
]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1, "标题不能为空"),
  productName: z.string().trim().optional().or(z.literal("")),
  productInput: z.string().trim().min(1, "产品描述不能为空"),
  sourceImageUrl: z.string().trim().optional(),
});

export const updateProjectSchema = createProjectSchema.extend({
  sourceImageUrl: z.string().trim().optional().nullable(),
});

export const updateSellingPointSchema = z.object({
  sellingPointId: z.string().min(1, "卖点 ID 不能为空"),
  headline: z.string().trim().min(1, "标题不能为空").max(32, "标题最多 32 个字符"),
  body: z.string().trim().min(1, "正文不能为空").max(120, "正文最多 120 个字符"),
});

export const generateCopySchema = z.object({
  replace: z.boolean().optional().default(false),
});

export const regenerateImageSchema = z.object({
  sellingPointId: z.string().min(1),
});

export const generatedSellingPointSchema = z.object({
  order: z.number().int().min(1).max(5),
  headline: z.string().trim().min(1),
  body: z.string().trim().min(1),
  imagePrompt: z.string().trim().min(1),
});

export const generatedSellingPointsEnvelopeSchema = z.object({
  sellingPoints: z.array(generatedSellingPointSchema).length(5),
});

export const uploadResponseSchema = z.object({
  url: z.string(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateSellingPointInput = z.infer<typeof updateSellingPointSchema>;
export type SellingPointDraft = z.infer<typeof generatedSellingPointSchema>;
