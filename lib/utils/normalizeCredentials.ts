// lib/utils/normalizeCredentials.ts
export function normalizeCredentials(
  input: Record<string, unknown> = {}
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined && value !== null) {
      result[key] = String(value);
    }
  }

  return result;
}