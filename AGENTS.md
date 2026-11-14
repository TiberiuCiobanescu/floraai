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
- Keep florist demo data and editable state in a shared React provider; navigation must preserve edits without introducing persistence or external services.
- Preserve the florist context identity in Vite hot-module data across preview updates; refreshed hooks must read the existing provider without storing SSR state globally.
- Keep independent content routes for inbox, orders, order detail, inventory, and settings; order detail is un-nested so it does not render inside the orders table.
- Define florist visual styles and semantic colors in the global design system so every screen uses a consistent palette.
- Use the shared text normalization helpers for human-text comparisons only; keep original input in state and display, and compare IDs and route paths literally.
- Link follow-up messages through the shared phone-matching helper and append them without mutating orders; confirmation remains an explicit florist action.
- Keep Framer Motion presentation helpers separate from florist state and honor reduced-motion for transforms, opacity, counters and delays; mount one shared Sonner toaster for action feedback.
- Keep the illustrated presentation at / outside AppShell and the inbox at /inbox; retain the root florist provider so entering the presentation does not discard edits.
- Derive shell selection, active navigation, and page animation keys from committed route matches, not the requested location, so pending navigation cannot frame the previous page as the destination.
- Keep presentation graphics independent from live florist state; illustrative messages, orders, and stock must never alter demo data.
- Keep editable demo profile fields in the shared florist provider, with explicit save/cancel in a dialog; profile editing does not imply authentication or account switching.
- Keep florist identity edits in shared demo state, separate from the user profile; the workspace menu opens an explicit save/cancel editor without adding multiple workspaces.
- Sort Inbox views using full received timestamps on a copied message list, so filters remain newest-first without mutating shared data.
- Derive client-question suggestions locally from the editable order and latest linked message; selecting a suggestion only changes the editable question, never sends or confirms an order.
- Derive order observations from saved deadline settings and current stock using explicit flower aliases and summed stem demand; unknown bouquet recipes require manual checking, and WhatsApp templates remain editable simulated messages without stock reservations or automatic substitutions.
- Show deadline and stock templates as separate choices within recommended client questions, not additional message editors; each selection fills the existing editable WhatsApp question with current client, recipient, delivery and product details.
