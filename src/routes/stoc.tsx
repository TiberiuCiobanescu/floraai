import { createFileRoute } from "@tanstack/react-router";
import { StockPage } from "@/features/florist/stock";
import { pageHead } from "@/features/florist/shared";
export const Route = createFileRoute("/stoc")({
  head: () => pageHead("Stoc", "Florile din atelier, alertele de stoc și livrările furnizorilor."),
  component: StockPage,
});
