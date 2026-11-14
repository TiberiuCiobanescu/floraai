import { createFileRoute } from "@tanstack/react-router";
import { handleExtraction } from "@/features/florist/ai/extraction.server";
export const Route = createFileRoute("/api/extrage-comanda")({
  server:{handlers:{POST:({request}) => handleExtraction(request)}},
});