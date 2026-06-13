// // lib/validation/validateProviderCredentials.ts

import { PROVIDER_CONFIGS } from "@/lib/shipping/providerConfigs";

export function validateProviderCredentials(
  slug: string,
  credentials: Record<string, string> = {}
) {
  const config = PROVIDER_CONFIGS[slug];

  if (!config) {
    throw new Error("Unsupported provider");
  }

  for (const field of config.credentials) {
    if (field.required && !credentials[field.name]) {
      throw new Error(`${field.label} is required`);
    }
  }
}