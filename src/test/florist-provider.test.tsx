import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloristProvider, useFlorist } from "@/features/florist/store";

vi.mock("@tanstack/react-query", () => ({ queryOptions: (options: unknown) => options, useSuspenseQuery: () => ({ data: { orders: [], messages: [], stock: [], limits: {} } }), useQueryClient: () => ({ invalidateQueries: vi.fn() }) }));
vi.mock("@tanstack/react-start", () => ({ useServerFn: () => vi.fn() }));
vi.mock("@/features/florist/database.functions", () => ({ decideCancellation: vi.fn(), getFloristData: vi.fn(), executeFloristOrder: vi.fn(), rejectFloristOrder: vi.fn(), saveClientName: vi.fn(), saveFloristOrder: vi.fn(), saveFloristSettings: vi.fn(), saveMessageStatus: vi.fn(), validateFloristOrder: vi.fn() }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { channel: () => ({ on: () => ({ on: () => ({ subscribe: vi.fn() }) }) }), removeChannel: vi.fn() } }));
afterEach(cleanup);

function ProfileConsumer() {
  const { profile, setProfile } = useFlorist();
  return <button onClick={() => setProfile({ name: "Aylin", description: "Florist", initials: "AY" })}>{profile.name}</button>;
}

function WorkspaceConsumer() {
  const { workspace, setWorkspace } = useFlorist();
  return <button onClick={() => setWorkspace({ name: "Flori de vis", location: "Constanța" })}>{workspace.name} · {workspace.location}</button>;
}

describe("Florist provider", () => {
  it("keeps edited florist identity when a page consumer remounts", () => {
    const view = render(<FloristProvider><WorkspaceConsumer key="initial" /></FloristProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Atelier de flori · București, România" }));
    view.rerender(<FloristProvider><WorkspaceConsumer key="next-page" /></FloristProvider>);
    expect(screen.getByRole("button", { name: "Flori de vis · Constanța" })).toBeInTheDocument();
  });
  it("keeps the edited profile when a page consumer remounts", () => {
    const view = render(<FloristProvider><ProfileConsumer key="initial" /></FloristProvider>);
    fireEvent.click(screen.getByRole("button", { name: "Atelierul meu" }));
    view.rerender(<FloristProvider><ProfileConsumer key="next-page" /></FloristProvider>);
    expect(screen.getByRole("button", { name: "Aylin" })).toBeInTheDocument();
  });
});
