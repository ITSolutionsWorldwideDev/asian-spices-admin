// lib/shipping/providerFactory.ts

import { getProviderCredentials } from "./providerService";
import { resolveProviderCredentials } from "./resolveCredentials";
import { CheapCargoAdapter } from "./adapters/cheapcargo";
import { ShippingAdapter } from "./types";

export async function getShippingProvider(
  slug: string,
  storeId?: string,
): Promise<ShippingAdapter> {
  const provider = await getProviderCredentials(slug);

  const credentials = await resolveProviderCredentials(provider.id, storeId);

  switch (provider.slug) {
    case "cheapcargo":
      return new CheapCargoAdapter({
        apiKey: credentials.apiKey,
        email: credentials.email,
        password: credentials.password,
        sandbox: process.env.IS_CHEAPCARGO_SANDBOX === "true",
      });

    default:
      throw new Error(`Unsupported provider: ${slug}`);
  }
}


  // Determine sandbox status using a platform env var or parsing database flags
  // const isSandbox = process.env.NEXT_PUBLIC_APP_ENV !== "production" || credentials.mode === "sandbox";
  // const isCheapcargoSandbox = process.env.IS_CHEAPCARGO_SANDBOX || true;