import { describe, expect, it } from "vitest";
import { initialMessages } from "./florist-fixtures";
import { newestMessagesFirst, oldestMessagesFirst } from "@/features/florist/message-order";

describe("Inbox chronological order", () => {
  it("shows the last received message first without changing the source list", () => {
    const originalIds = initialMessages.map((message) => message.id);
    expect(newestMessagesFirst(initialMessages).map((message) => message.id)).toEqual([
      "m9", "m8", "m2", "m1",
    ]);
    expect(initialMessages.map((message) => message.id)).toEqual(originalIds);
  });
  it("sorts by the complete date rather than only the displayed hour", () => {
    const message = initialMessages[0];
    if (!message) throw new Error("Missing message fixture");
    const messages = [
      { ...message, id: "older", received: "2026-11-13T23:50:00", time: "23:50" },
      { ...message, id: "newer", received: "2026-11-14T08:00:00", time: "08:00" },
    ];
    expect(newestMessagesFirst(messages).map((item) => item.id)).toEqual(["newer", "older"]);
  });
  it("orders conversations by sequential insertion IDs, not the fixed automatic reply hour", () => {
    const message = initialMessages[0];
    if (!message) throw new Error("Missing message fixture");
    const messages = [
      { ...message, id: "M10", received: "2026-11-14 10:05:00", direction: "florarie" as const },
      { ...message, id: "M9", received: "2026-11-14 18:30:00", direction: "client" as const },
      { ...message, id: "M11", received: "2026-11-14 10:05:00", direction: "florarie" as const },
    ];
    expect(oldestMessagesFirst(messages).map((item) => item.id)).toEqual(["M9", "M10", "M11"]);
    expect(messages.map((item) => item.id)).toEqual(["M10", "M9", "M11"]);
  });
});