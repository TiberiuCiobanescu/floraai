import { createFileRoute } from "@tanstack/react-router";
import { PresentationPage } from "@/features/presentation/story";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "FloraAI · Mai mult timp pentru flori" },
    { name: "description", content: "FloraAI organizează mesajele clienților, comenzile și stocul florăriei într-un singur atelier." },
    { property: "og:title", content: "FloraAI · Mai mult timp pentru flori" },
    { property: "og:description", content: "Descoperă FloraAI: Inbox, comenzi, stoc și setări pentru organizarea florăriei tale." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: PresentationPage,
});
