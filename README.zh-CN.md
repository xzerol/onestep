# 一键生成亚马逊主图

这是一个单页画布式工作台，用来生成亚马逊商品主图、卖点文案和配图。页面布局参考 ComfyUI 的工作区体验，但不包含完整的节点编排系统。

## 项目能力

- 在一个完整画布中同时查看输入、文案和输出
- 创建项目并保存产品信息
- 生成 5 条卖点文案
- 手动编辑卖点文案
- 重新生成单张图片
- 导出 ZIP 和 metadata
- 查看最近项目，进入独立列表页搜索、编辑和删除

## 技术栈

- Next.js 16 + App Router
- TypeScript
- Tailwind CSS v4
- Prisma + SQLite
- Zod
- Vitest

## 本地启动

1. 安装依赖：

```bash
npm install
```

2. 复制环境变量文件：

```bash
cp .env.example .env.local
```

3. 配置 API Key 和数据库：

```bash
npx prisma generate
npx prisma migrate dev --name init
```

4. 启动开发服务：

```bash
npm run dev
```

## Docker 启动

开发模式：

```bash
docker compose up --build
```

生产镜像：

```bash
docker build -t amazon-selling-points .
docker run --rm -p 3000:3000 --env-file .env.local amazon-selling-points
```

## 主要页面

- `/`：首页，只展示最近 3 个画布
- `/projects`：项目列表页，支持搜索、编辑和删除
- `/workspace/[id]`：单个项目的画布工作台

## API 接口

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/:id`
- `PATCH /api/projects/:id`
- `DELETE /api/projects/:id`
- `POST /api/projects/:id/generate-copy`
- `POST /api/projects/:id/update-selling-point`
- `POST /api/projects/:id/generate-images`
- `POST /api/projects/:id/regenerate-image`
- `POST /api/projects/:id/export`
- `POST /api/uploads`

## 运行约定

- 文案和图片生成都走 Gemini。
- 文案生成要求返回 5 条结构化卖点。
- 图片生成支持参考图输入。
- 运行时上传文件和导出产物不会提交到 Git。
- 画布页面是桌面优先的，移动端会退化为更紧凑的布局。

## 说明

如果你想快速理解当前项目，建议先看：

1. `app/page.tsx`
2. `app/projects/page.tsx`
3. `components/canvas/workspace-canvas.tsx`
4. `services/generation-service.ts`
5. `README.md`
