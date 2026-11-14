import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ClientNameEditor } from "@/features/florist/client-name-editor";

const updateClientName = vi.fn(async () => true);
vi.mock("@/features/florist/store", () => ({ useFlorist: () => ({ updateClientName }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn() } }));
afterEach(() => { cleanup(); vi.clearAllMocks(); });

it("saves the original florist-entered name only for the selected phone", async () => {
  const onSaved = vi.fn();
  render(<ClientNameEditor phone="+40712345678" name="+40712345678" onSaved={onSaved} />);
  fireEvent.click(screen.getByRole("button", { name: "Editează numele clientului" }));
  fireEvent.change(screen.getByLabelText("Numele clientului"), { target: { value: "  Ștefan Popa  " } });
  fireEvent.click(screen.getByRole("button", { name: "Salvează" }));
  await waitFor(() => expect(updateClientName).toHaveBeenCalledWith("+40712345678", "  Ștefan Popa  "));
  expect(onSaved).toHaveBeenCalledWith("  Ștefan Popa  ");
});

it("cancel does not save a name", () => {
  render(<ClientNameEditor phone="+40712345678" name="Ana" />);
  fireEvent.click(screen.getByRole("button", { name: "Editează numele clientului" }));
  fireEvent.change(screen.getByLabelText("Numele clientului"), { target: { value: "Mihai" } });
  fireEvent.click(screen.getByRole("button", { name: "Anulează" }));
  expect(updateClientName).not.toHaveBeenCalled();
});

it("retains the editor when saving fails", async () => {
  updateClientName.mockResolvedValueOnce(false);
  render(<ClientNameEditor phone="+40712345678" name="Ana" />);
  fireEvent.click(screen.getByRole("button", { name: "Editează numele clientului" }));
  fireEvent.click(screen.getByRole("button", { name: "Salvează" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvează" })).toBeEnabled());
  expect(screen.getByRole("dialog")).toBeInTheDocument();
});