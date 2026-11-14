import { createFileRoute } from "@tanstack/react-router";
import { SimulatorPage } from "@/features/florist/simulator";
import { pageHead } from "@/features/florist/shared";

export const Route = createFileRoute("/simulator")({
  head: () => pageHead("Simulator WhatsApp", "Testează conversațiile clienților, răspunsurile automate și validarea comenzilor FloraAI."),
  component: SimulatorPage,
});
