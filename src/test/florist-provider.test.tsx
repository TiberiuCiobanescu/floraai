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

describe("Florist provider", () => {
  it("keeps saved settings available when a route consumer remounts", () => {
    const view = render(<FloristProvider><SettingsConsumer key="initial" /></FloristProvider>);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    view.rerender(<FloristProvider><SettingsConsumer key="next-route" /></FloristProvider>);
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
  });
});