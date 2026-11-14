import type { Message } from "./data";
import { oldestMessagesFirst } from "./message-order";
import { dateLabel } from "./data";

export function ConversationBubbles({ messages }: { messages: readonly Message[] }) {
  const ordered = oldestMessagesFirst(messages);
  if (!ordered.length) {
    return <div className="conversation-empty">Niciun mesaj. Scrie primul mesaj al clientului.</div>;
  }
  return (
    <div className="conversation-bubbles" aria-live="polite">
      {ordered.map((message) => {
        const fromClient = message.direction === "client";
        return (
          <article key={message.id} className={`conversation-message ${fromClient ? "from-client" : "from-florist"}`}>
            <p>{message.text}</p>
            <small>
              {dateLabel(message.received.slice(0, 10))} · {message.time}
              {!fromClient ? " · FloraAI" : ""}
            </small>
          </article>
        );
      })}
    </div>
  );
}
