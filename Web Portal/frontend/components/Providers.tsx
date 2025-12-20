"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/context/AuthContext";
import "@/i18n";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // i18n is already initialized via static import
  }, []);

  return <AuthProvider>{children}</AuthProvider>;
}
