import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/florist/settings";
import { pageHead } from "@/features/florist/shared";
export const Route = createFileRoute("/setari")({
  head: () =>
    pageHead("Setări", "Configurează termenele de modificare și pragurile de stoc ale florăriei."),
  component: SettingsPage,
});
