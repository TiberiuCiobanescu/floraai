import { createContext, useContext, useState, type Context, type ReactNode } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { floristQueryOptions } from "./database-query";
import { saveFloristOrder, saveFloristSettings, saveMessageStatus } from "./database.functions";
import { toast } from "sonner";
import type { Order } from "./data";
function useFloristState() {
  const { data } = useSuspenseQuery(floristQueryOptions);
  const queryClient = useQueryClient();
  const saveOrder = useServerFn(saveFloristOrder);
  const saveSettingsFn = useServerFn(saveFloristSettings);
  const saveStatus = useServerFn(saveMessageStatus);
  const [profile, setProfile] = useState({ name: "Atelierul meu", description: "Florărie independentă", initials: "AZ" });
  const [workspace, setWorkspace] = useState({ name: "Atelier de flori", location: "București, România" });
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: floristQueryOptions.queryKey });
  }
  async function updateOrder(order: Order) {
    try { await saveOrder({ data: order }); await refresh(); return true; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Comanda nu a fost salvată."); return false; }
  }
  async function updateMessage(orderId: string, status: string) {
    await saveStatus({ data: { orderId, status } });
    await refresh();
  }
  async function saveSettings(stock: typeof data.stock, limits: typeof data.limits) {
    await saveSettingsFn({ data: { stock, limits } });
    await refresh();
  }
  return { ...data, profile, setProfile, workspace, setWorkspace, updateOrder, updateMessage, saveSettings };
}
type FloristValue = ReturnType<typeof useFloristState>;
// An open preview can retain the old provider while a route receives the refreshed hook.
// Preserve context identity across hot updates; never share request state globally in SSR.
const previousContext = import.meta.hot?.data?.["floristContext"] as
  | Context<FloristValue | null>
  | undefined;
const FloristContext = previousContext ?? createContext<FloristValue | null>(null);
if (import.meta.hot?.data) import.meta.hot.data["floristContext"] = FloristContext;
export function FloristProvider({ children }: { children: ReactNode }) {
  const value = useFloristState();
  return <FloristContext.Provider value={value}>{children}</FloristContext.Provider>;
}
export function useFlorist() {
  const value = useContext(FloristContext);
  if (!value) throw new Error("FloristProvider missing");
  return value;
}
