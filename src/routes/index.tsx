import { createFileRoute } from "@tanstack/react-router";
import { PresentationPage } from "@/features/presentation/story";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FloraAI · Mai mult timp pentru flori" },
    { name: "description", content: "Un pic de ordine. Un buchet de liniște. Povestea unui atelier cu mai mult timp pentru flori." },
    { property: "og:title", content: "FloraAI · Mai mult timp pentru flori" },
    { property: "og:description", content: "De la mesaje risipite la comenzi în ordine: descoperă povestea FloraAI." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PresentationPage,
});
