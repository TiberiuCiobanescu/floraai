import { z } from "zod";

export const extractionSchema = z.object({
  tip_mesaj: z.enum(["comanda_noua", "modificare", "completare", "confirmare", "intrebare_pret", "recomandare", "altceva"]),
  telefon: z.string(),
  nume_client: z.string().nullable(),
  tip_comanda: z.enum(["buchet_oras", "nunta"]).nullable(),
  produse: z.array(z.object({ nume_catalog: z.string(), cantitate: z.number() }).strict()),
  auxiliare: z.array(z.string()),
  data_livrare: z.string().nullable(),
  interval: z.string().nullable(),
  adresa: z.string().nullable(),
  destinatar: z.string().nullable(),
  bilet: z.string().nullable(),
  campuri_lipsa: z.array(z.string()),
  intrebare_client: z.string().nullable(),
  rezumat: z.string(),
}).strict();
export type ExtractedOrder = z.infer<typeof extractionSchema>;