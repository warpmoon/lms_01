import type { Metadata } from "next";
import "@/styles/globals.css";
import Providers from "@/components/common/Providers";

export const metadata: Metadata = {
  title: "KREDU LMS",
  description: "Next.js 기반의 새로운 KREDU 학습 관리 시스템",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
