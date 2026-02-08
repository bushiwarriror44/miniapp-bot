"use client";

import { useEffect, useState } from "react";
import { getTelegramWebApp } from "@/shared/api/client";

export default function Home() {
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const telegram = getTelegramWebApp();
    if (!telegram) return;
    
    // Вызываем ready() только если метод существует
    if (typeof telegram.ready === 'function') {
      telegram.ready();
    }
    
    const user = telegram.initDataUnsafe?.user;
    if (user) {
      setUsername(user.first_name || user.username || null);
    }
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 px-4">
      <h1 className="text-xl font-semibold">
        {username ? `Привет, ${username}!` : "Telegram Mini App"}
      </h1>
      <p className="text-sm text-slate-300 text-center">
        Здесь будет UI мини‑приложения, данные тянем через TanStack Query, а
        авторизацию и тему берем из Telegram WebApp.
      </p>
    </main>
  );
}
