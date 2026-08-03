import type { Metadata } from "next";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { Nav } from "@/components/layout/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Typography Playground",
  description: "유니코드 스타일 텍스트 생성기와 키네틱 타이포그래피 엔진",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <div className="grain-overlay" aria-hidden />
        <CustomCursor />
        <Nav />
        {children}
      </body>
    </html>
  );
}
