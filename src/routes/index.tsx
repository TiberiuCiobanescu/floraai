import { createFileRoute } from "@tanstack/react-router";
import { InboxPage } from "@/features/florist/inbox";
import { pageHead } from "@/features/florist/shared";
export const Route = createFileRoute("/")({
  head: () =>
    pageHead("Inbox", "Mesajele și comenzile clienților florăriei tale, într-un singur loc."),
  component: InboxPage,
});
