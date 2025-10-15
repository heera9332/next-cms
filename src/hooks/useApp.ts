import { AppContext } from "@/contexts/app-context";
import { useContext } from "react";

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within <AppProvider>");
  return ctx;
}
