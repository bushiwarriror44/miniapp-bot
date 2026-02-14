import "./globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "./providers";
import { BottomNav } from "./components/BottomNav";
import { AppLoader } from "./components/AppLoader";
import { AppBlockGuard } from "./components/AppBlockGuard";

export const metadata: Metadata = {
  title: "Telegram Mini App",
  description: "Front-end для Telegram Mini App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" suppressHydrationWarning data-theme="dark" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="min-h-screen antialiased font-sans" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} suppressHydrationWarning>
        <Providers>
          <AppLoader />
          <AppBlockGuard>
            <div className="main-content">{children}</div>
            <BottomNav />
          </AppBlockGuard>
        </Providers>
      </body>
    </html>
  );
}
