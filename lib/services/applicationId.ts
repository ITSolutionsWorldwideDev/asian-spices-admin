// lib/services/applicationId.ts
//
// The partner "Application ID" (a.k.a. Partner ID) — a human-readable code
// like APP-20260604-22251 shown on the Partners and Stores screens and used
// for search. It used to be generated only by the public partner-registration
// form in asian-spices-web, so anything created from the admin (or seeded)
// had a NULL application_id and showed "—" on the store card (ticket 68).
//
// Keep the format identical to asian-spices-web's generator.

/** Build an APP-YYYYMMDD-NNNNN code. `date` defaults to now; pass a partner
 *  registration's `created_at` when backfilling so the date part is real. */
export function generateApplicationId(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const random = Math.floor(10000 + Math.random() * 90000);
  return `APP-${y}${m}${d}-${random}`;
}

/** Same as above but checks `partner_registration.application_id` and retries
 *  until the code is unused. Pass the transaction client so the check runs in
 *  the same transaction as the insert. */
export async function generateUniqueApplicationId(
  client: { query: (sql: string, params?: any[]) => Promise<{ rows: any[] }> },
  date: Date = new Date(),
): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateApplicationId(date);
    const { rows } = await client.query(
      `SELECT 1 FROM partner_registration WHERE application_id = $1 LIMIT 1`,
      [candidate],
    );
    if (rows.length === 0) return candidate;
  }
  // Astronomically unlikely with a 90k-wide random per day; fail loud rather
  // than silently write a duplicate that would break search.
  throw new Error("Could not generate a unique application_id after 10 tries");
}
