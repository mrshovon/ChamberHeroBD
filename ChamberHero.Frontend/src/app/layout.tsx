import "./globals.css";
import type { Metadata, Viewport } from "next";

// 1. Separate Core SEO Metadata
export const metadata: Metadata = {
  title: "ChamberHero BD - Medical Practice Management",
  description:
    "Secure multi-chamber practice management platform for healthcare professionals",
};

// 2. Separate Viewport Configuration (Fixes the Next.js 15 warning)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Keep it here if your extension adds things to the html tag
    <html lang="en" suppressHydrationWarning>
      {/* ADD IT HERE to silence the body attribute mismatch! */}
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
