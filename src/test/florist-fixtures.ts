// Isolated test inputs only. Never imported by the application.
import type { Order, Message } from "@/features/florist/data";
export const initialLimits = { "Buchet în oraș": 3, "Nuntă": 72 };
export const initialOrders: Order[] = [
  { id: "test-1", client: "Client test", phone: "0722345678", type: "Buchet în oraș", products: [{ name: "Trandafiri roșii", quantity: 15 }], extras: "", date: "2026-11-14", time: "15:00–17:00", address: "", recipient: "Destinatar test", note: "Mesaj test", status: "Draft", versions: [] },
  { id: "test-2", client: "Mihai Ionescu", phone: "0744123456", type: "Buchet în oraș", products: [{ name: "Trandafiri albi", quantity: 11 }], extras: "", date: "2026-11-14", time: "13:00–14:00", address: "Adresă test", recipient: "Ioana Ionescu", note: "Mesaj test", status: "Așteaptă clientul", versions: [] },
  { id: "test-3", client: "Client nuntă", phone: "0733000000", type: "Nuntă", products: [], extras: "", date: "2026-11-21", time: "10:00–12:00", address: "", recipient: "", note: "", status: "Draft", versions: [] },
];
export const initialStock = [{ name: "Trandafir roșu", quantity: 45, threshold: 50 }, { name: "Trandafir alb", quantity: 82, threshold: 25 }, { name: "Frezie", quantity: 18, threshold: 25 }];
export const initialMessages: Message[] = [
  { id: "m1", orderId: "test-1", client: "Client test", phone: "0722345678", time: "08:32", received: "2026-11-14T08:32:00", text: "Mesaj test", channel: "WhatsApp", type: "Comandă nouă", status: "Nou", direction: "client" },
  { id: "m2", orderId: "test-2", client: "Mihai Ionescu", phone: "0744123456", time: "08:45", received: "2026-11-14T08:45:00", text: "Modificare test", channel: "WhatsApp", type: "Modificare", status: "Nou", direction: "client" },
  { id: "m8", orderId: "test-1", client: "Client test", phone: "0722345678", time: "11:40", received: "2026-11-14T11:40:00", text: "Completare test", channel: "WhatsApp", type: "Completare", status: "Nou", direction: "client" },
  { id: "m9", orderId: "test-1", client: "Client test", phone: "0722345678", time: "11:50", received: "2026-11-14T11:50:00", text: "Confirmare test", channel: "WhatsApp", type: "Confirmare", status: "Nou", direction: "client" },
];