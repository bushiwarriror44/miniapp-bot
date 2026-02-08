import "./globals.css";
import type { Metadata } from "next";
import { Providers } from "./providers";
import { BottomNav } from "./components/BottomNav";
import { AppLoader } from "./components/AppLoader";

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
    <html lang="ru" suppressHydrationWarning data-theme="dark">
      <body className="min-h-screen antialiased" style={{ backgroundColor: "var(--color-bg)", color: "var(--color-text)" }} suppressHydrationWarning>
        <Providers>
          <AppLoader />
          <div className="main-content">{children}</div>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
