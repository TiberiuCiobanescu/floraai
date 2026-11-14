import type { Message } from "./data";

export function newestMessagesFirst(messages: readonly Message[]): Message[] {
  return [...messages].sort((a, b) => new Date(b.received).getTime() - new Date(a.received).getTime());
}