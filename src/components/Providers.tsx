"use client";

import { CRMProvider } from "@/context/CRMContext";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return <CRMProvider>{children}</CRMProvider>;
}
