// lib/utils/retry.ts

export async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 500
): Promise<T> {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      console.warn(`Retry ${i + 1} failed`, err);

      await new Promise((res) => setTimeout(res, delay * (i + 1)));
    }
  }

  throw lastError;
}