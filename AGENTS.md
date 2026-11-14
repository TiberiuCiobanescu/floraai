<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Application architecture
- Keep missing-interval deadline handling aligned between the shared date helper and the extraction RPC so displayed, saved and late-change checks agree.
- Load florist operational data exclusively from existing connected tables through a server function and a root Query loader; the provider exposes the query result, never demo fallback rows, so navigation and refresh show database data.
- Use the publishable client under the team’s existing demo access policies, never admin credentials; preserve table structure and surface failed operations instead of claiming success.
- Execute saved orders exclusively through the invoker RPC with order/version and deterministic row locks; it aggregates catalog recipes and auxiliary greenery, checks every shortage before writes, and commits stock/status together before refreshing the shared query.
- Reject settled-order writes before touching clients, orders or lines; message updates only target open message statuses, preserving confirmed and ignored records.
- Resolve edited product recipes against the current catalog immediately and clear unknown recipes; guard missing delivery dates instead of serializing invalid dates.
- Preserve the florist context identity in Vite hot-module data across preview updates; refreshed hooks must read the existing provider without storing SSR state globally.
- Keep independent content routes for inbox, orders, order detail, inventory, and settings; order detail is un-nested so it does not render inside the orders table.
- Define florist visual styles in the global design system; scope working-screen tokens to AppShell and reuse presentation tokens with readable paper surfaces so both experiences remain visually consistent without changing presentation styles.
- Use the shared text normalization helpers for human-text comparisons only; keep original input in state and display, and compare IDs and route paths literally.
- Process AI message groups and cancellation decisions through atomic invoker RPCs; validate catalog, live deadlines and version, and deduplicate fallback replies while retaining failed messages in Inbox.
- Keep Framer Motion presentation helpers separate from florist state and honor reduced-motion for transforms, opacity, counters and delays; mount one shared Sonner toaster for action feedback.
- Keep the illustrated presentation at / outside AppShell and the inbox at /inbox; retain the root florist provider so entering the presentation does not discard edits.
- Derive shell selection, active navigation, and page animation keys from committed route matches, not the requested location, so pending navigation cannot frame the previous page as the destination.
- Keep presentation graphics independent from live florist state; illustrative messages, orders, and stock must never alter demo data.
- Keep editable demo profile fields in the shared florist provider, with explicit save/cancel in a dialog; profile editing does not imply authentication or account switching.
- Keep florist identity edits in shared demo state, separate from the user profile; the workspace menu opens an explicit save/cancel editor without adding multiple workspaces.
- Sort Inbox views using full received timestamps on a copied message list, so filters remain newest-first without mutating shared data.
- Derive client-question suggestions locally from the editable order and latest linked message; selecting a suggestion only changes the editable question, never sends or confirms an order.
- Represent recommended questions with explicit short labels and personalized templates rather than inferring labels from message text; all applicable question types fill the same editable composer.
- Derive order observations from saved deadline settings and current stock using explicit flower aliases and summed stem demand; unknown recipes require manual checking, and editable WhatsApp templates open click-to-chat without claiming delivery or reserving stock.
- Keep imported raw messages durable before AI processing and process consecutive same-phone groups sequentially; deduplicate reimports and propagate Stop to avoid duplicate billed work.
- Show deadline and stock templates as separate choices within recommended client questions, not additional message editors; each selection fills the existing editable WhatsApp question with current client, recipient, delivery and product details.
- Keep WhatsApp simulation, florist validation and automatic replies in the existing messages/orders tables; order conversations by sequential message ID, subscribe to both tables through one cleaned-up Realtime channel, and keep florist messages out of Inbox.
- Recommendation extraction uses live stock and the latest outgoing message by sequential ID; its invoker RPC only classifies/replies, never changes orders. Extracted names update only phone-placeholder clients; shared explicit name editing refreshes the root query and syncs the detail draft's name without discarding other edits.
