# Asian Spices Admin

Next.js (App Router, TypeScript) admin dashboard for Asian Spices. Dev server runs on port 3003 (`npm run dev` — check for an already-running instance before starting a new one, it will fail with `EADDRINUSE` otherwise).

## Structure
- `app/` — pages and API routes (`app/api/**/route.ts`); route paths map to URLs — do not reshuffle casually
- `components/` — all React UI
  - `layout/` — shell wrappers (session, store context, loaders, bootstrap)
  - `shared/` — cross-feature widgets
  - `ui/` — primitives (button, toast, card)
  - `common/` — shared admin chrome (sidebar helpers, pagination, text editor)
  - `modals/` — modal dialogs (template / legacy included)
  - `auth/` — login / forgot-password UI
  - `catalog/` — brand, category, subcategory, tax
  - `products/` — product forms/lists + `products/catalog` (store catalog assignment)
  - `orders/` — order lists + `orders/queue`
  - `store/` — store shell + `store/settings`
  - other feature areas: `platform/`, `shipping/`, `packaging/`, `blogs/`, `customers/`, `dashboard/`, `chatbot/`, `media/`
- `core/` — backend-only shared logic: `core/db.ts` (Postgres pool), `core/email.ts` / `core/email-templates.ts`, `core/auth/`, `core/shipping/`, `core/order-routing/`, `core/packaging-service/`, `core/types/`, `core/utils/`
- `lib/` — app helpers grouped by concern (`auth/`, `orders/`, `shipping/`, `products/`, `services/`, `validations/`, `audit/`, `crypto/`, `errors/`, …). Prefer `core/email.ts` over `lib/email/` for anything new.
- `data/` — static/reference data
  - `navigation/` — routes + sidebar config
  - `partners/` — partner logo/icon assets
  - `json/` — fixture / template datasets
- `docs/` — project documentation
- `media/` — non-app media samples kept out of the repo root
- `scripts/` — one-off scripts
- `public/` — static assets served by Next.js

## Database
PostgreSQL via the `pg` pool in `core/db.ts`. Query columns have drifted from the live schema before (e.g. a missing `created_at` column caused 500s on `/api/store-assignments`) — verify column names against the actual DB schema when touching SQL, don't assume the query matches the table.

## Related repo
`asian-spices-web` (sibling directory) is the customer-facing storefront — a separate repo, not part of a monorepo/Turborepo setup despite what older docs here implied. Order-confirmation emails to customers are sent from there, not from this admin repo; `sendOrderConfirmationEmail` in `core/email-templates.ts` here is currently unused dead code.
