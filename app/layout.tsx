import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Image Editor - Nano Banana Pro",
  description: "Professional image editing with AI-powered tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
