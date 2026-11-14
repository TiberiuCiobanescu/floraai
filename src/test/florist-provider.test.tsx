import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { FloristProvider, useFlorist } from "@/features/florist/store";

afterEach(cleanup);

function SettingsConsumer() {
  const { limits, setLimits } = useFlorist();
  return (
    <button onClick={() => setLimits({ ...limits, "Buchet în oraș": 5 })}>
      {limits["Buchet în oraș"]}
    </button>
  );
}

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
  it("keeps saved settings available when a route consumer remounts", () => {
    const view = render(<FloristProvider><SettingsConsumer key="initial" /></FloristProvider>);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    view.rerender(<FloristProvider><SettingsConsumer key="next-route" /></FloristProvider>);
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
  });
});