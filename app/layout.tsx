import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
  title: "一键生成亚马逊主图",
  description: "在单一画布工作区中一键生成亚马逊主图、卖点文案与配图。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
