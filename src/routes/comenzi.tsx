import { createFileRoute } from "@tanstack/react-router";
import { OrdersPage } from "@/features/florist/orders";
import { pageHead } from "@/features/florist/shared";
export const Route = createFileRoute("/comenzi")({
  head: () => pageHead("Comenzi", "Organizează comenzile florăriei după data livrării."),
  component: OrdersPage,
});
