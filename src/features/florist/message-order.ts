import type { Message } from "./data";

export function newestMessagesFirst(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => new Date(b.received).getTime() - new Date(a.received).getTime());
}

// Automatic replies share the fixed demo hour. Sequential message IDs preserve insertion order.
export function oldestMessagesFirst(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
