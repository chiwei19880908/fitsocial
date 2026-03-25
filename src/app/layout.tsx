import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FitSocial - 結構化運動紀錄社群",
  description: "以結構化運動紀錄為核心的社群平台，透過課表學習與目標諮詢建立高互動性的運動社群",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body className={inter.className}>
      <AuthProvider>{children}</AuthProvider>
    </body>
    </html>
  );
}
