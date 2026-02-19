"use client";

import { ReactNode, useEffect, useLayoutEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/shared/api/client";
import { ThemeProvider } from "@/shared/theme/ThemeContext";

type Props = {
  children: ReactNode;
};

export const Providers = ({ children }: Props) => {
  useLayoutEffect(() => {
    console.log("[Providers] Providers component render");
  });

  useEffect(() => {
    console.log("[Providers] Providers mounted");
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>{children}</ThemeProvider>
    </QueryClientProvider>
  );
};

