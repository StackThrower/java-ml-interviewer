import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whiskers — AI Voice Interviewer",
  description: "Voice technical interviews for Java and ML engineers, powered by Claude Haiku and RAG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
