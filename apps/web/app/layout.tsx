import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Code2Cloud — From Git Push to Live URL",
  description:
    "A full-stack cloud deployment platform. Go worker orchestrates cloning, building, Kubernetes deployment, and TLS provisioning — from a single git push.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className={`antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
