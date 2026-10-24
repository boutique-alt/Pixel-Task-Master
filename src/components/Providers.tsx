"use client";

import { CRMProvider } from "@/context/CRMContext";
import GlobalAlertListener from "./GlobalAlertListener";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CRMProvider>
      {children}
      <GlobalAlertListener />
    </CRMProvider>
  );
}
