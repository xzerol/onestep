# 2026-04-14 Prompt 与生成质量调整

## 十三、提示词改为 JSON 格式传递

### 改动目标
将原本用长文本或段落拼接的 prompt 改为结构化 JSON 字符串，提升模型对格式和约束的理解准确性。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `lib/prompts.ts` | `buildSellingPointsPrompt` 与 `buildImagePrompt` 均改为返回 `JSON.stringify(...)` 结果。文案 prompt 包含 `role`、`task`、`requirements`、`input` 四个字段；图片 prompt 包含 `task`、`main_claim`、`support_copy_intent`、`visual_brief`、`visual_requirements`、`style` 六个字段 |

### 说明
该改动只影响**接下来新生成的卖点文案和后续生成的图片**。已有卖点需要点击「替换全部文案」或「重新生成图片」才能生效。

## 十四、卖点文案更详细贴合产品

### 问题与目标
原先生成的卖点文案 `body` 仅 30 字以内，内容过于简短，缺少具体的使用场景、目标人群和使用方法，显得泛泛而谈，不够贴合产品描述。需要让文案更深入地基于产品描述提炼，突出真实场景和人物互动。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `lib/prompts.ts` | 更新 `buildSellingPointsPrompt` 的 `task` 和 `requirements`：1. `task` 明确要求卖点必须深入贴合产品描述，提炼出真实的使用场景、目标人群、使用方法和核心优势；2. `body` 字段限制放宽为 `120字以内`，并要求必须结合产品描述写出具体场景、人物和使用方法；3. 新增 `content_rules`，要求每条卖点必须基于产品描述提炼，禁止编造，必须包含具体场景、人物互动、使用方法，且 5 条卖点之间要有明显差异，覆盖不同角度（功能、场景、人群、情感、细节）；4. `imagePrompt` 字段描述更新为“需把场景、人物和使用方法转化为具体画面描述” |

### 说明
该改动只影响**接下来新生成的卖点文案**。已有卖点需要点击「替换全部文案」才能生效。

## 十五、图片生成强制 2048x2048 并禁止中文

### 问题与目标
用户要求生成的配图必须达到 2048x2048 高分辨率，并且画面上绝对不能出现任何中文字符或中文标语。同时需要确保图片 prompt 以纯 JSON 格式传递。

### 关键改动

| 文件 | 改动说明 |
|------|---------|
| `lib/prompts.ts` | `buildSellingPointsPrompt` 的 `imagePrompt_rules` 新增两条规则：“分辨率：正方形构图，强制输出 2048x2048 高分辨率”和“严禁中文：画面中绝对禁止出现任何中文字符、汉字或中文标语”；`buildImagePrompt` 新增 `resolution: "2048x2048 square format"` 字段，并在 `visual_requirements` 中置顶 `output resolution must be 2048x2048 square` 和 `strictly no Chinese characters, no Chinese text, no Chinese slogans anywhere on the image` |
| `services/banana-image.ts` | 确保发送给 Gemini 的 prompt 为纯 JSON 字符串，不在末尾追加额外文本；2048x2048 和无中文的约束完全通过 `buildImagePrompt` 返回的结构化 JSON 实现 |
| `tests/banana-image.test.ts` | 更新断言，验证请求体中的 `parts[0].text` 即为传入的 prompt，未附加额外文本 |

### 说明
由于 Gemini 图像生成 API 目前不直接开放像素级宽高参数，因此通过结构化 JSON prompt 的方式，在模型层面进行强约束。该改动只影响**接下来新生成的图片**。已有图片需点击「重新生成图片」才能生效。

## 追加规则

- 后续与 prompt、文案质量、画面约束相关的调整，继续追加到同日期下的新文件
- 如果改动已经跨主题，不要硬塞进本文件，优先新建独立条目
