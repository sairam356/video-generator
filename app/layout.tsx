import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telugu Shorts Generator",
  description: "YouTube video to Telugu Short script JSON with Gemini",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
