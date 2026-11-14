import {
  Flower2,
  Inbox,
  ClipboardList,
  Sprout,
  Settings2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ArrowUpRight,
  MessageCircle,
  Phone,
  Store,
  CircleCheck,
  Clock3,
  CircleAlert,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useFlorist } from "./store";
import bouquet from "@/assets/floral-still-life.jpg";
import { textEquals } from "@/lib/normalize-text";
const items = [
  { label: "Inbox", to: "/" as const, icon: Inbox },
  { label: "Comenzi", to: "/comenzi" as const, icon: ClipboardList },
  { label: "Stoc", to: "/stoc" as const, icon: Sprout },
  { label: "Setări", to: "/setari" as const, icon: Settings2 },
];
export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { messages } = useFlorist();
  const unread = messages.filter((m) => textEquals(m.status, "Nou")).length;
  return (
    <div className={`app-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
      <aside className="app-sidebar">
        <Link to="/" className="brand">
          <Flower2 strokeWidth={1.4} />
          <span>
            Florio<span className="brand-subtitle">ASISTENTUL FLORĂRIEI TALE</span>
          </span>
        </Link>
        <div className="workspace">
          <div className="workspace-icon">
            <Flower2 size={19} />
          </div>
          <div className="workspace-copy">
            <strong>Atelier de flori</strong>
            <small>București, România</small>
          </div>
          <ChevronDown size={15} />
        </div>
        <div className="nav-label">ATELIERUL TĂU</div>
        <nav>
          {items.map((item) => (
            <Button
              variant="ghost"
              asChild
              key={item.to}
              className={`nav-item ${pathname === item.to || (item.to === "/comenzi" && pathname.startsWith("/comenzi/")) ? "active" : ""}`}
            >
              <Link to={item.to}>
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.to === "/" && unread > 0 && <b className="nav-count">{unread}</b>}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="floral-note">
            <img
              src={bouquet}
              alt="Trandafiri roz, flori albe și eucalipt"
              width={768}
              height={1024}
            />
            <div>
              <Flower2 size={17} />
              <p>
                Mai mult timp
                <br />
                pentru flori.
              </p>
              <span>Restul îl ținem în ordine.</span>
            </div>
          </div>
          <div className="profile">
            <span className="profile-avatar">AZ</span>
            <div>
              <strong>Atelierul meu</strong>
              <small>Florărie independentă</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="app-main">
        <header className="topbar">
          <div className="topbar-start">
            <Button
              variant="ghost"
              size="icon"
              title={collapsed ? "Deschide meniul" : "Restrânge meniul"}
              aria-label={collapsed ? "Deschide meniul" : "Restrânge meniul"}
              onClick={() => setCollapsed((v) => !v)}
            >
              {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
            </Button>
            <span>Un pic de ordine. Un buchet de liniște.</span>
          </div>
          <div className="topbar-date">
            <span className="online-dot" />
            Sâmbătă, 14 noiembrie 2026<span className="demo-label">DATE DEMO</span>
          </div>
        </header>
        <main className="page-content">{children}</main>
        <footer className="page-footer">
          <span>Cu grijă pentru fiecare comandă.</span>
          <Flower2 size={15} />
          <span>Florio · Atelierul tău, în ordine</span>
        </footer>
      </div>
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="heading-actions">{actions}</div>}
    </div>
  );
}
export function StatusBadge({ value }: { value: string }) {
  let tone = "neutral";
  if (["Nou", "Draft", "Stoc redus"].some((status) => textEquals(status, value))) tone = "rose";
  if (
    ["Confirmat", "Confirmată", "Livrată", "Executată", "În regulă"].some((status) =>
      textEquals(status, value),
    )
  )
    tone = "green";
  if (["Așteaptă clientul", "În lucru", "Modificare"].some((status) => textEquals(status, value)))
    tone = "amber";
  if (textEquals(value, "Comandă nouă")) tone = "green";
  if (textEquals(value, "Completare")) tone = "lilac";
  if (textEquals(value, "Confirmare")) tone = "rose";
  return (
    <span className={`status-badge ${tone}`}>
      <span />
      {value}
    </span>
  );
}
export function Channel({ value }: { value: string }) {
  const Icon = textEquals(value, "WhatsApp")
    ? MessageCircle
    : textEquals(value, "Telefon")
      ? Phone
      : Store;
  return (
    <span className="channel">
      <Icon size={13} />
      {value}
    </span>
  );
}
export function AlertBand({ children, tone = "rose" }: { children: ReactNode; tone?: string }) {
  return (
    <div className={`alert-band ${tone}`}>
      <CircleAlert size={18} />
      {children}
    </div>
  );
}
export const icons = { ArrowUpRight, CircleCheck, Clock3 };
export function pageHead(title: string, description: string) {
  return {
    meta: [
      { title: `${title} · Florio` },
      { name: "description", content: description },
      { property: "og:title", content: `${title} · Florio` },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  };
}
