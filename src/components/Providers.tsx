"use client";

import { CRMProvider } from "@/context/CRMContext";
import GlobalAlertListener from "./GlobalAlertListener";
import AdminCheckInListener from "./AdminCheckInListener";
import { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <CRMProvider>
      {children}
      <GlobalAlertListener />
      <AdminCheckInListener />
    </CRMProvider>
  );
}
