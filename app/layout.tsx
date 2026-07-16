import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;

  return {
    title: "Investor OS｜个人价值投资决策台",
    description: "个人美股与 BTC 价值投资策略、开单理由、决策日志和每周复盘工作台。",
    icons: {
      icon: "/favicon.svg",
      shortcut: "/favicon.svg",
    },
    openGraph: {
      title: "Investor OS｜个人价值投资决策台",
      description: "纪律先于观点，证据先于行动。",
      images: [{ url: `${origin}/og.png`, width: 1536, height: 909, alt: "Investor OS 个人价值投资决策台" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Investor OS｜个人价值投资决策台",
      description: "纪律先于观点，证据先于行动。",
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
