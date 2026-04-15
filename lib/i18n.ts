export const projectStatusMap: Record<string, string> = {
  draft: "草稿",
  copy_ready: "文案就绪",
  images_generating: "生成图片中",
  images_partial: "部分完成",
  images_ready: "全部完成",
  failed: "失败",
};

export const sellingPointStatusMap: Record<string, string> = {
  draft: "草稿",
  ready: "就绪",
  edited: "已编辑",
  image_stale: "图片待刷新",
  generating: "生成中",
  done: "完成",
  failed: "失败",
};

export const imageStatusMap: Record<string, string> = {
  queued: "排队中",
  generating: "生成中",
  succeeded: "成功",
  failed: "失败",
};
