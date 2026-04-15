# 项目修改记录目录

这个文件现在只作为变更目录入口，避免单个 `CHANGELOG.md` 越积越长、占用过多上下文窗口。

## 使用方式

- 先看本文件，快速定位主题和日期
- 再按需打开对应子文档
- 后续新增变更时，优先新建独立文件，而不是继续把内容追加到本文件

## 目录

### 2026-04-14

- [01-provider-and-localization.md](/Users/xzerol/Desktop/codex/onestep/docs/changelog/2026-04-14/01-provider-and-localization.md)
  说明：Provider 统一到 Gemini、文案解析兼容、前后端全面汉化、测试与 Docker 验证。

- [02-fixes-and-canvas.md](/Users/xzerol/Desktop/codex/onestep/docs/changelog/2026-04-14/02-fixes-and-canvas.md)
  说明：参考图接入、导出修复、画布拖拽与放大、进度弹窗、默认 2 列布局。

- [03-prompt-quality.md](/Users/xzerol/Desktop/codex/onestep/docs/changelog/2026-04-14/03-prompt-quality.md)
  说明：Prompt 改为 JSON、卖点文案更贴合产品、图片强制高分辨率并禁止中文。

## 维护约定

- 文件命名建议：`序号-主题.md`
- 目录建议按日期分组：`docs/changelog/YYYY-MM-DD/`
- 单个文件只记录一组相关改动，控制在易读范围内
- 如果某次改动很小，写成一条短记录，不要补成长篇说明
