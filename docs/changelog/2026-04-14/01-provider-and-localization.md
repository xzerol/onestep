# 2026-04-14 Provider 与汉化调整

## 一、API 配置：统一使用 Gemini

### 改动目标
将原本分别调用 **Gemini（文案）** 和 **BananaPro（图片）** 的外部服务，统一改为仅调用 **Gemini** 一家 API，降低部署复杂度。

### 关键文件

| 文件 | 改动说明 |
|------|---------|
| `.env.local` | 新增环境变量文件，配置 `GEMINI_API_KEY` 和 `GEMINI_IMAGE_MODEL` |
| `lib/env.ts` | 新增 `GEMINI_IMAGE_MODEL` 环境变量读取，默认值 `gemini-2.5-flash-image` |
| `services/banana-image.ts` | 将 `BananaImageProvider` 内部逻辑改为调用 Gemini 图像生成接口，返回的 base64 图片保存到 `public/uploads/` 后返回本地 URL |
| `services/generation-service.ts` | 数据库中 `provider` 字段从 `"banana-pro"` 改为 `"gemini"` |
| `docker-compose.yml` | `env_file` 从 `.env.example` 改为 `.env.local`，确保容器能读取真实 API Key |

### 图像生成流程
1. 调用 `POST https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_IMAGE_MODEL}:generateContent`
2. 请求体中携带 `responseModalities: ["Text", "Image"]`
3. 解析返回的 `candidates[0].content.parts[].inlineData.data`（base64）
4. 写入 `public/uploads/gemini-{uuid}.png`
5. 返回 `/uploads/gemini-{uuid}.png`

### 模型选择
- 文案模型：`gemini-2.5-pro`（默认）
- 图像模型：`gemini-2.5-flash-image`（经测试，该模型支持图像生成且可用）

## 二、文案生成兼容性修复

### 问题
Gemini 有时会直接返回 JSON 数组（`[{...}, {...}]`），而不是预期的对象包裹格式（`{ sellingPoints: [...] }`），导致解析报错 `TEXT_PROVIDER_SCHEMA_ERROR`。

### 修复
- `services/gemini-text.ts`：在 `JSON.parse` 后增加 `Array.isArray` 判断，如果是数组则自动包装为 `{ sellingPoints: json }` 再校验。

## 三、前端界面全面汉化

### 改动范围
所有用户可见的英文界面文案均已翻译为中文，包括页面标题、按钮、表单标签、状态提示、错误信息等。

### 页面级别

| 文件 | 汉化内容 |
|------|---------|
| `app/layout.tsx` | `lang="zh-CN"`，`title="亚马逊卖点画布"` |
| `app/page.tsx` | 首页标题、描述、特性卡片、最近项目列表全部中文；项目状态使用 `projectStatusMap` 映射显示 |
| `components/project-form.tsx` | 表单标签：项目标题、产品名称、产品描述；按钮：创建中... / 创建工作区 |
| `components/canvas/workspace-toolbar.tsx` | 返回、工作区、缩小、放大、适配画布、生成全部图片、导出 ZIP |
| `components/canvas/input-node.tsx` | 输入节点、产品简介、参考图片、上传、保存输入、生成文案、替换全部文案 |
| `components/canvas/selling-point-node.tsx` | 卖点、标题、正文、显示/隐藏提示词、保存文案、重新生成图片 |
| `components/canvas/image-result-node.tsx` | 输出节点、状态中文映射、重新生成图片 |
| `components/canvas/workspace-canvas.tsx` | 所有底部状态提示改为中文（画布就绪、输入已保存、卖点已生成、图片生成完成、导出就绪等） |

### 新增国际化映射工具
- `lib/i18n.ts`：集中管理状态映射
- `projectStatusMap`：草稿 / 文案就绪 / 生成图片中 / 部分完成 / 全部完成 / 失败
- `sellingPointStatusMap`：草稿 / 就绪 / 已编辑 / 图片待刷新 / 生成中 / 完成 / 失败
- `imageStatusMap`：排队中 / 生成中 / 成功 / 失败

## 四、后端错误信息汉化

### 改动范围
所有抛给前端的业务错误信息已翻译为中文，提升中文用户的使用体验。

| 文件 | 修改示例 |
|------|---------|
| `services/project-service.ts` | `"Project not found"` → `"项目不存在"` |
| `services/generation-service.ts` | `"Product description is required"` → `"产品描述为必填项"`；`"Selling points already exist..."` → `"卖点已存在。传入 replace=true 以覆盖。"`；`"Generate selling points before requesting images"` → `"请先生成卖点文案，再请求图片"` |
| `services/gemini-text.ts` | `"Gemini request failed with ..."` → `"Gemini 请求失败，状态码 ..."`；`"Gemini did not return JSON content"` → `"Gemini 未返回 JSON 内容"`；`"Gemini returned invalid selling point JSON"` → `"Gemini 返回的卖点 JSON 无效"` |
| `services/banana-image.ts` | `"Gemini image request failed with ..."` → `"Gemini 图片请求失败，状态码 ..."`；`"Gemini did not return image data"` → `"Gemini 未返回图片数据"` |
| `lib/api.ts` | `"Invalid request payload"` → `"请求参数无效"`；`"Unhandled API error"` → `"未处理的 API 错误"` |
| `lib/schemas.ts` | Zod 校验错误增加中文提示：`"标题不能为空"`、`"正文最多 120 个字符"` 等 |

## 五、测试用例同步更新

### 修改文件
- `tests/banana-image.test.ts`：适配 Gemini 图像生成逻辑，断言文案改为中文
- `tests/gemini-text.test.ts`：断言文案改为中文
- `tests/generation-service.test.ts`：`provider` 值改为 `"gemini"`，断言文案改为中文

### 测试结果

```bash
npm test
# Test Files  4 passed (4)
# Tests  12 passed (12)
```

## 六、Docker 测试验证

已使用 `docker compose up --build -d` 成功拉起服务，并完成端到端测试：

1. `POST /api/projects`：创建项目成功
2. `POST /api/projects/:id/generate-copy`：生成 5 条中文卖点文案成功
3. `POST /api/projects/:id/generate-images`：生成 5 张配图全部成功，状态变为 `images_ready`
4. 图片已保存并可访问：`/uploads/gemini-{uuid}.png`

## 七、快速启动命令

```bash
# 本地开发
npm install
cp .env.example .env.local
# 填入 GEMINI_API_KEY 后执行：
npx prisma generate
npx prisma migrate dev --name init
npm run dev

# Docker 开发
docker compose up --build -d
```

## 八、当前环境变量示例（`.env.local`）

```env
DATABASE_URL="file:./dev.db"

GEMINI_API_KEY="你的 Gemini API Key"
GEMINI_TEXT_MODEL="gemini-2.5-pro"
GEMINI_IMAGE_MODEL="gemini-2.5-flash-image"

BANANAPRO_BASE_URL=""
BANANAPRO_API_KEY=""
BANANAPRO_MODEL="nano-banana-pro"

APP_URL="http://localhost:3000"
```

> 注意：`BANANAPRO_*` 变量目前保留但不再使用，图像生成已完全迁移至 Gemini。
