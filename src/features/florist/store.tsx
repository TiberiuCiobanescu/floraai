import { createContext, useContext, useEffect, useState, type Context, type ReactNode } from "react";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { floristQueryOptions } from "./database-query";
import { decideCancellation, executeFloristOrder, rejectFloristOrder, saveClientName, saveFloristOrder, saveFloristSettings, saveMessageStatus, validateFloristOrder } from "./database.functions";
import { toast } from "sonner";
import type { Order } from "./data";
function useFloristState() {
  const { data } = useSuspenseQuery(floristQueryOptions);
  const queryClient = useQueryClient();
  const saveOrder = useServerFn(saveFloristOrder);
  const saveSettingsFn = useServerFn(saveFloristSettings);
  const saveStatus = useServerFn(saveMessageStatus);
  const executeOrderFn = useServerFn(executeFloristOrder);
  const validateOrderFn = useServerFn(validateFloristOrder);
  const rejectOrderFn = useServerFn(rejectFloristOrder);
  const saveClientNameFn = useServerFn(saveClientName);
  const cancellationFn = useServerFn(decideCancellation);
  const [profile, setProfile] = useState({ name: "Atelierul meu", description: "Florărie independentă", initials: "AZ" });
  const [workspace, setWorkspace] = useState({ name: "Atelier de flori", location: "București, România" });
  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: floristQueryOptions.queryKey });
  }
  async function updateOrder(order: Order) {
    try { await saveOrder({ data: order }); await refresh(); return true; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Comanda nu a fost salvată."); return false; }
  }
  async function updateClientName(phone: string, name: string) {
    try {
      await saveClientNameFn({ data: { phone, name } });
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Numele clientului nu a putut fi salvat.");
      return false;
    }
  }
  async function executeOrder(order: Order) {
    try {
      if (order.version === undefined) throw new Error("Reîncarcă datele înainte de execuție.");
      const result = await executeOrderFn({ data: { id: order.id, version: order.version } });
      if (!result.ok) {
        toast.warning("Stoc insuficient. Comanda nu a fost executată.", {
          description: result.shortages.map((item) => `${item.flower}: lipsesc ${item.missing} fire`).join("; "),
          duration: 10000,
        });
        return false;
      }
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comanda nu a putut fi executată.");
      return false;
    }
  }
  async function validateOrder(order: Order) {
    try {
      if (order.version === undefined) throw new Error("Reîncarcă datele înainte de validare.");
      await validateOrderFn({ data: { id: order.id, version: order.version } });
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comanda nu a putut fi validată.");
      return false;
    }
  }
  async function rejectOrder(order: Order, reason: string) {
    try {
      if (order.version === undefined) throw new Error("Reîncarcă datele înainte de respingere.");
      await rejectOrderFn({ data: { id: order.id, version: order.version, reason } });
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Comanda nu a putut fi respinsă.");
      return false;
    }
  }
  async function updateMessage(orderId: string, status: string) {
    try { await saveStatus({ data: { orderId, status } }); await refresh(); return true; }
    catch (error) { toast.error(error instanceof Error ? error.message : "Statusul mesajului nu a fost salvat."); return false; }
  }
  async function resolveCancellation(order: Order, accept: boolean) {
    try {
      if (order.version === undefined) throw new Error("Reîncarcă datele înainte de decizie.");
      await cancellationFn({ data: { id: order.id, version: order.version, accept } });
      await refresh();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Decizia nu a putut fi salvată.");
      return false;
    }
  }
  async function saveSettings(stock: typeof data.stock, limits: typeof data.limits) {
    await saveSettingsFn({ data: { stock, limits } });
    await refresh();
  }
  useEffect(() => {
    const channel = supabase
      .channel("florist-live-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "mesaje" }, () => {
        void queryClient.invalidateQueries({ queryKey: floristQueryOptions.queryKey });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "comenzi" }, () => {
        void queryClient.invalidateQueries({ queryKey: floristQueryOptions.queryKey });
      })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [queryClient]);
  return { ...data, profile, setProfile, workspace, setWorkspace, updateOrder, updateClientName, executeOrder, validateOrder, rejectOrder, resolveCancellation, updateMessage, saveSettings, refresh };
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
