import { createFileRoute } from "@tanstack/react-router";
import { OrderDetail } from "@/features/florist/detail";
import { pageHead } from "@/features/florist/shared";
export const Route = createFileRoute("/comenzi_/$id")({
  head: () =>
    pageHead("Detaliu comandă", "Editează produsele, livrarea și detaliile comenzii florale."),
  component: Detail,
});
function Detail() {
  const { id } = Route.useParams();
  return <OrderDetail key={id} id={id} />;
}
