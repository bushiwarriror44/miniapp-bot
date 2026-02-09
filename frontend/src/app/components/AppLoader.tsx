"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import logoImg from "@/app/assets/logo.png";

const MIN_LOADING_MS = 400;

export function AppLoader() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setVisible(false), MIN_LOADING_MS);
    return () => clearTimeout(t);
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-6 px-8"
      style={{ backgroundColor: "var(--color-bg)" }}
    >
      <Image
        src={logoImg}
        alt="TeleDoska"
        width={120}
        height={120}
        className="shrink-0 object-contain"
        priority
      />
      {/* Горизонтальный прогресс-бар */}
      <div
        className="w-full max-w-[200px] h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--color-surface)" }}
      >
        <div
          className="loader-progress h-full rounded-full"
          style={{ backgroundColor: "var(--color-accent)" }}
        />
      </div>
    </div>
  );
}
