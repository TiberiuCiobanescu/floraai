export type OrderStatus =
  "Draft" | "Așteaptă clientul" | "Confirmată" | "În lucru" | "Executată" | "Livrată";
export type OrderType = "Buchet în oraș" | "Nuntă";
export type Product = { name: string; quantity: number };
export type Order = {
  id: string;
  client: string;
  phone: string;
  type: OrderType;
  products: Product[];
  extras: string;
  date: string;
  time: string;
  address: string;
  recipient: string;
  note: string;
  status: OrderStatus;
  versions: string[];
};
export type Message = {
  id: string;
  orderId: string;
  client: string;
  time: string;
  received: string;
  text: string;
  channel: "WhatsApp" | "Telefon" | "Fizic";
  type: string;
  status: string;
};
export const DEMO_NOW = new Date("2026-11-14T12:00:00");
export const initialOrders: Order[] = [
  {
    id: "1001",
    client: "Andreea Popescu",
    phone: "0722 345 678",
    type: "Buchet în oraș",
    products: [{ name: "Trandafiri roșii", quantity: 15 }],
    extras: "Eucalipt, ambalaj crem",
    date: "2026-11-14",
    time: "15:00–17:00",
    address: "",
    recipient: "Maria Popescu",
    note: "La mulți ani, mama! Cu drag, Andreea",
    status: "Draft",
    versions: [],
  },
  {
    id: "1002",
    client: "Mihai Ionescu",
    phone: "0744 123 456",
    type: "Buchet în oraș",
    products: [{ name: "Trandafiri albi", quantity: 11 }],
    extras: "Verdeață, panglică albă",
    date: "2026-11-14",
    time: "13:00–14:00",
    address: "Str. Lalelelor 12, București",
    recipient: "Ioana Ionescu",
    note: "Pentru cea mai frumoasă zi.",
    status: "Așteaptă clientul",
    versions: [
      "v1 · 13 nov., 16:20 · Buchet de 9 trandafiri albi",
      "v2 · 14 nov., 08:45 · Cantitate actualizată: 11 fire",
    ],
  },
  {
    id: "1003",
    client: "Elena Dumitrescu",
    phone: "0733 987 654",
    type: "Nuntă",
    products: [
      { name: "Aranjament mireasă", quantity: 1 },
      { name: "Aranjamente mese", quantity: 12 },
    ],
    extras: "Eucalipt, frezii albe",
    date: "2026-11-21",
    time: "10:00–12:00",
    address: "Domeniul Mogoșoaia, Ilfov",
    recipient: "Elena Dumitrescu",
    note: "",
    status: "Draft",
    versions: [],
  },
  {
    id: "1004",
    client: "Alexandru Stan",
    phone: "0755 234 567",
    type: "Buchet în oraș",
    products: [{ name: "Buchet mixt de toamnă", quantity: 1 }],
    extras: "Ambalaj roz",
    date: "2026-11-14",
    time: "16:00–18:00",
    address: "Bd. Unirii 24, București",
    recipient: "Raluca Stan",
    note: "Cu tine, fiecare zi e frumoasă.",
    status: "Confirmată",
    versions: [],
  },
  {
    id: "1005",
    client: "Ioana Marinescu",
    phone: "0728 456 789",
    type: "Buchet în oraș",
    products: [{ name: "Frezii albe", quantity: 21 }],
    extras: "Verdeață",
    date: "2026-11-15",
    time: "09:00–11:00",
    address: "Str. Paris 18, București",
    recipient: "Ana Marinescu",
    note: "La mulți ani!",
    status: "În lucru",
    versions: [],
  },
  {
    id: "1006",
    client: "Cristina Radu",
    phone: "0766 321 098",
    type: "Buchet în oraș",
    products: [{ name: "Gerbera roz", quantity: 9 }],
    extras: "Ambalaj alb",
    date: "2026-11-14",
    time: "10:00–12:00",
    address: "Calea Victoriei 80, București",
    recipient: "Cristina Radu",
    note: "",
    status: "Livrată",
    versions: [],
  },
];
export const initialMessages: Message[] = [
  {
    id: "m1",
    orderId: "1001",
    client: "Andreea Popescu",
    time: "08:32",
    received: "2026-11-14T08:32:00",
    text: "Bună dimineața! Aș dori un buchet de 15 trandafiri roșii pentru mama mea, Maria. Se poate livra azi între 15:00 și 17:00? Pe bilețel: „La mulți ani, mama! Cu drag, Andreea”. Mulțumesc! 🌷",
    channel: "WhatsApp",
    type: "Comandă nouă",
    status: "Nou",
  },
  {
    id: "m2",
    orderId: "1002",
    client: "Mihai Ionescu",
    time: "08:45",
    received: "2026-11-14T08:45:00",
    text: "Bună! Aș vrea să schimb buchetul de azi: 11 trandafiri albi în loc de 9. Restul detaliilor rămân la fel. Mulțumesc!",
    channel: "WhatsApp",
    type: "Modificare",
    status: "Nou",
  },
  {
    id: "m3",
    orderId: "1003",
    client: "Elena Dumitrescu",
    time: "09:10",
    received: "2026-11-14T09:10:00",
    text: "Bună ziua! Ne pregătim pentru nunta din 21 noiembrie. Ne puteți spune un preț pentru un aranjament de mireasă și 12 aranjamente de masă cu flori albe și eucalipt?",
    channel: "WhatsApp",
    type: "Întrebare de preț",
    status: "Nou",
  },
  {
    id: "m4",
    orderId: "1004",
    client: "Alexandru Stan",
    time: "10:24",
    received: "2026-11-14T10:24:00",
    text: "Confirm buchetul mixt pentru Raluca, astăzi la adresa de pe Unirii. Arată minunat, mulțumesc mult!",
    channel: "WhatsApp",
    type: "Comandă nouă",
    status: "Confirmat",
  },
  {
    id: "m5",
    orderId: "1005",
    client: "Ioana Marinescu",
    time: "10:48",
    received: "2026-11-14T10:48:00",
    text: "Aș dori 21 de frezii albe pentru mâine dimineață. Adresa este Strada Paris 18, pentru Ana Marinescu.",
    channel: "Telefon",
    type: "Comandă nouă",
    status: "Așteaptă clientul",
  },
  {
    id: "m6",
    orderId: "1006",
    client: "Cristina Radu",
    time: "11:05",
    received: "2026-11-14T11:05:00",
    text: "Am primit buchetul de gerbera! Este superb. Vă mulțumesc și o zi frumoasă! 💐",
    channel: "WhatsApp",
    type: "Altceva",
    status: "Ignorat",
  },
  {
    id: "m7",
    orderId: "1004",
    client: "Alexandru Stan",
    time: "11:32",
    received: "2026-11-14T11:32:00",
    text: "Am trecut prin florărie și am ales ambalajul roz pentru buchet. Rămâne livrarea la 16:00.",
    channel: "Fizic",
    type: "Modificare",
    status: "Confirmat",
  },
];
export const initialStock = [
  { name: "Trandafir roșu", quantity: 45, threshold: 50 },
  { name: "Trandafir alb", quantity: 82, threshold: 25 },
  { name: "Lalea", quantity: 60, threshold: 25 },
  { name: "Frezie", quantity: 18, threshold: 25 },
  { name: "Crin", quantity: 32, threshold: 20 },
  { name: "Bujor", quantity: 28, threshold: 20 },
  { name: "Gerbera", quantity: 54, threshold: 20 },
  { name: "Eucalipt", quantity: 36, threshold: 20 },
  { name: "Lisianthus", quantity: 42, threshold: 20 },
];
export const initialLimits = { "Buchet în oraș": 3, Nuntă: 72 };
export function canMarkExecuted(status: OrderStatus) {
  return status === "Confirmată" || status === "În lucru";
}
export function modificationDeadline(order: Order, limits: Record<OrderType, number>) {
  return new Date(
    new Date(`${order.date}T${order.time.slice(0, 5)}:00`).getTime() - limits[order.type] * 3600000,
  );
}
export function isOverdue(message: Message) {
  return (
    message.status === "Nou" &&
    DEMO_NOW.getTime() - new Date(message.received).getTime() > 2 * 3600000
  );
}
export function isLowStock(item: { quantity: number; threshold: number }) {
  return item.quantity < item.threshold;
}
export function dateLabel(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("ro-RO", {
    day: "numeric",
    month: "short",
  });
}
export function productSummary(order: Order) {
  return order.products.map((p) => `${p.quantity} ${p.name.toLowerCase()}`).join(", ");
}
