import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import { BottomNav } from "./components/BottomNav";
import { AppLoader } from "./components/AppLoader";
import { AppBlockGuard } from "./components/AppBlockGuard";
import { LayoutLogger } from "./components/LayoutLogger";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Telegram Mini App",
  description: "Front-end для Telegram Mini App",
  other: {
    "cache-control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    "pragma": "no-cache",
    "expires": "0",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased font-sans" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} suppressHydrationWarning>
        <LayoutLogger>
          <Providers>
            <AppLoader />
            <AppBlockGuard>
              <div className="main-content">{children}</div>
              <BottomNav />
            </AppBlockGuard>
          </Providers>
        </LayoutLogger>
      </body>
    </html>
  );
}
