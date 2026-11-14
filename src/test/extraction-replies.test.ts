import { afterEach, expect, it, vi } from "vitest";
import type { ExtractedOrder } from "@/features/florist/extraction-schema";

const mocks = vi.hoisted(() => ({ rpc: vi.fn(), readTable: vi.fn(), call: vi.fn() }));
vi.mock("@/features/florist/database.functions", () => ({ databaseClient: () => ({ rpc: mocks.rpc }), readTable: mocks.readTable }));
vi.mock("@/features/florist/ai/responses.server", () => ({ createResponsesCall: mocks.call }));
import { handleExtraction } from "@/features/florist/ai/extraction.server";

afterEach(() => { vi.clearAllMocks(); vi.unstubAllEnvs(); });
const output: ExtractedOrder = { tip_mesaj: "intrebare", telefon: "", nume_client: null, tip_comanda: null, produse: [], auxiliare: [], data_livrare: null, interval: null, adresa: null, destinatar: null, bilet: null, campuri_lipsa: [], intrebare_client: "Răspuns", rezumat: "" };
function setup() {
  vi.stubEnv("LOVABLE_API_KEY", "test-placeholder");
  mocks.readTable.mockImplementation(async (_client, table) => table === "mesaje" ? [{ id: "M1", telefon: "+40700000000", directie: "client", status: "nou", tip_mesaj: null, text: "Până când pot modifica?", ora: "2026-11-14 10:05:00" }] : table === "termene" ? [{ tip_comanda: "buchet_oras", ore_inainte_de_livrare: 3 }, { tip_comanda: "nunta", ore_inainte_de_livrare: 120 }] : []);
  mocks.rpc.mockResolvedValue({ data: null, error: null });
}
function request() { return new Request("http://localhost/api/extrage-comanda", { method: "POST", body: JSON.stringify({ ids: ["M1"] }) }); }

it.each(["intrebare", "anulare"] as const)("passes %s without creating mandatory order fields", async tip_mesaj => {
  setup();
  mocks.call.mockReturnValue({ result: { output: Promise.resolve({ ...output, tip_mesaj }), finishReason: Promise.resolve("stop") } });
  await handleExtraction(request()).text();
  expect(mocks.rpc).toHaveBeenCalledWith("aplica_extragere_comanda", expect.objectContaining({ p_mesaje: ["M1"], p_rezultat: expect.objectContaining({ tip_mesaj, campuri_lipsa: [] }), p_comanda: "" }));
});
it("saves an error reply against the original client message when AI fails", async () => {
  setup();
  mocks.call.mockImplementation(() => { throw new Error("Unavailable"); });
  const body = await handleExtraction(request()).text();
  expect(mocks.rpc).toHaveBeenCalledWith("raspunde_eroare_extragere", { p_mesaje: ["M1"] });
  expect(body).toContain('"error":"Unavailable"');
  expect(mocks.rpc).not.toHaveBeenCalledWith("aplica_extragere_comanda", expect.anything());
});
it("reports a failed fallback save instead of claiming the client received a reply", async () => {
  setup();
  mocks.call.mockImplementation(() => { throw new Error("Unavailable"); });
  mocks.rpc.mockResolvedValue({ data: null, error: { message: "Write unavailable" } });
  const body = await handleExtraction(request()).text();
  expect(body).not.toContain('"done":true');
  expect(mocks.rpc).toHaveBeenCalledTimes(1);
});