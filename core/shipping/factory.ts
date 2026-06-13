// packages/shipping/factory.ts

import { CheapCargoProvider } from "./providers/cheapcargo";

export function getShippingProvider(slug: string, config: any) {
  switch (slug) {
    case "cheapcargo":
      return new CheapCargoProvider(config);

    default:
      throw new Error("Unsupported provider");
  }
}