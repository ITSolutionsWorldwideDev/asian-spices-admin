# Asian Spices Admin

Next.js (App Router, TypeScript) admin dashboard for Asian Spices. Dev server runs on port 3003 (`npm run dev` — check for an already-running instance before starting a new one, it will fail with `EADDRINUSE` otherwise).

## Structure
- `app/` — pages and API routes (`app/api/**/route.ts`)
- `core/` — shared backend logic: `core/db.ts` (Postgres pool), `core/email.ts` (nodemailer SMTP profiles + `sendEmail`), `core/email-templates.ts` (HTML email builders, e.g. `sendOrderConfirmationEmail`, `sendPartnerRegistrationEmail`, `sendReturnStatusUpdateEmail`)
- `components/` — UI components, grouped by feature area (e.g. `components/platform/`)
- `lib/` — a second, largely unused email helper (`lib/email.ts`) with placeholder/Acme defaults; only wired into the partner-approval flow. Prefer `core/email.ts` for anything new.
- `data/` — static/reference data

## Database
PostgreSQL via the `pg` pool in `core/db.ts`. Query columns have drifted from the live schema before (e.g. a missing `created_at` column caused 500s on `/api/store-assignments`) — verify column names against the actual DB schema when touching SQL, don't assume the query matches the table.

## Related repo
`asian-spices-web` (sibling directory) is the customer-facing storefront — a separate repo, not part of a monorepo/Turborepo setup despite what older docs here implied. Order-confirmation emails to customers are sent from there, not from this admin repo; `sendOrderConfirmationEmail` in `core/email-templates.ts` here is currently unused dead code.
