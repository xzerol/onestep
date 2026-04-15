# 2026-04-14 问题修复与画布交互调整

## 九、近期问题修复

### 1. 白底图与生成图像不相关

**问题**：用户上传的白底产品图在最终生成图像时没有被引用，生成结果与产品无关。  
**原因**：`BananaImageProvider.generateImage()` 接收了 `referenceImageUrl` 参数，但构造 Gemini 请求体时只传了文字 `prompt`，完全没有把参考图带进去。

**修复**：
- `services/banana-image.ts`：当 `referenceImageUrl` 存在时，读取本地图片文件并转为 base64，以 `inlineData` 形式插入 `contents.parts`，作为多模态参考图传给 Gemini。
- `tests/banana-image.test.ts`：新增测试用例，验证请求体在传入 `referenceImageUrl` 时包含对应的 `inlineData`。

### 2. 连线不随卡片移动

**问题**：在桌面端拖拽节点后，SVG 连线仍停留在原位置，没有跟随卡片移动。  
**原因**：SVG 连线的坐标使用的是固定的常量（`INPUT_NODE_POSITION`、`COPY_COLUMN_X`、`OUTPUT_COLUMN_X`），没有读取各节点当前的 `nodeOffsets` 拖拽偏移量。

**修复**：
- `components/canvas/workspace-canvas.tsx`：将 SVG 贝塞尔曲线的起点/终点改为动态计算，实时读取 `nodeOffsets["input"]`、`nodeOffsets[\`sp-\${item.id}\`]` 和 `nodeOffsets[\`img-\${item.id}\`]` 的偏移值。
- `components/canvas/input-node.tsx`：新增 `onDragStart` 属性，把拖拽事件绑定到节点头部，使输入节点也可以被拖动。

### 3. 导出 ZIP 中缺少图片

**问题**：点击「导出 ZIP」后，下载的文件中 `images/` 文件夹为空。  
**原因**：`ExportService` 使用 `fetch(image.imageUrl)` 尝试下载图片，但数据库里存的是相对路径（如 `/uploads/gemini-xxx.png`）。服务端执行 `fetch("/uploads/...")` 没有 base URL，请求静默失败并被 catch 吞掉。

**修复**：
- `services/export-service.ts`：改为使用 `readFile` 直接从本地文件系统（`public/uploads/`）读取图片写入 ZIP。
- 扩展名根据 URL 后缀判断（`.jpg`/`.jpeg` → `jpg`，否则 `png`）。
- 单张图片读取失败不影响整体导出流程。

## 十、画布节点交互优化

### 问题与目标
用户反馈画布上卖点节点与图片节点堆叠、按钮难以点击，并需要支持节点拖拽移动和图片放大查看。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `components/canvas/workspace-canvas.tsx` | 增大 `ROW_GAP`（290 → 420）和画布高度（1700 → 2400），避免默认布局堆叠；新增 `nodeOffsets` 状态与 `handleNodePointerDown` / `handlePointerMove` 实现节点在画布内可拖拽移动；拖拽时当前节点 `z-index` 提升到 50；新增 `lightbox` 状态实现图片点击全屏放大查看 |
| `components/canvas/selling-point-node.tsx` | 标题栏增加 `cursor-move` 与 `onPointerDown={props.onDragStart}`，作为拖拽手柄 |
| `components/canvas/image-result-node.tsx` | 标题栏增加拖拽手柄；图片增加 `cursor-zoom-in` 与 `onClick`，触发 lightbox 放大查看；提取 `imageUrl` 局部变量消除 TS 类型报错 |
| `tests/generation-service.test.ts` | 修复 `createMany` 展开顺序与 `findUnique` 返回 `null` 的类型推断错误，确保 TypeScript 编译通过 |

### 交互说明
- **拖拽移动**：在桌面端，按住卖点节点或图片节点的标题栏即可在画布内自由拖动，位置会随画布缩放自动校正。
- **图片放大**：点击已生成的图片，弹出全屏遮罩层查看原图，点击背景或「关闭」按钮退出。

## 十一、生成文案与生成图片增加进度条和文字提醒

### 问题与目标
「生成文案」和「生成全部图片」是耗时操作，原先仅有底部状态栏文字，用户无法感知进度。需要增加明显的进度弹窗，实时显示百分比和阶段提示。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `components/canvas/progress-overlay.tsx` | **新增** 进度弹窗组件。居中显示深色圆角卡片，包含渐变进度条、阶段文字和百分比 |
| `components/canvas/workspace-canvas.tsx` | 新增 `progress` 状态与 `progressInterval`。`handleGenerateCopy` 与 `handleGenerateImages` 在执行期间定时更新进度条；文案生成进度条文字依次为「正在保存项目信息...」→「正在分析产品信息...」→「正在生成卖点文案...」→「正在优化视觉提示词...」；图片生成进度条文字依次为「正在准备图片生成...」→「正在生成第 1-2 张图片...」→「正在生成第 3-4 张图片...」→「正在生成剩余图片...」→「正在保存结果...」。完成后显示 100% 并自动关闭 |

## 十二、默认卖点和图片卡片变为 2 列布局

### 问题与目标
用户希望卖点节点和图片节点在所有屏幕模式下均以 2 列排列，提升信息密度并减少滚动。原先仅移动端使用 grid 2 列，桌面端仍为单列绝对定位。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `components/canvas/workspace-canvas.tsx` | **桌面端也改为 2 列**：调整 `COPY_COLUMN_X`、`OUTPUT_COLUMN_X`、`CANVAS_WIDTH`、`CANVAS_HEIGHT` 等常量；卖点节点与图片节点的 `left`/`top` 按 `index % 2` 和 `Math.floor(index / 2)` 计算行列坐标；SVG 连线坐标同步适配 2 列布局。移动端继续保持 `grid grid-cols-2 gap-6` |
| `components/canvas/input-node.tsx` | 节点宽度从固定 `w-[420px]` 改为响应式 `w-full md:w-[420px]` |
| `components/canvas/selling-point-node.tsx` | 节点宽度从固定 `w-[420px]` 改为响应式 `w-full md:w-[420px]` |
| `components/canvas/image-result-node.tsx` | 节点宽度从固定 `w-[360px]` 改为响应式 `w-full md:w-[360px]` |

### 交互说明
- **桌面端**：输入节点左侧单列，卖点区域与图片区域各自以 2×N 网格排列；节点仍支持拖拽移动，SVG 连线实时跟随。
- **移动端**：继续使用 CSS Grid 的 2 列布局。
