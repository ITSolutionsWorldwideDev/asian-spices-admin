// lib/shipping/providerConfigs.ts

export type CredentialField = {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
};

export const PROVIDER_CONFIGS: Record<
  string,
  {
    label: string;
    credentials: CredentialField[];
  }
> = {
  cheapcargo: {
    label: "CheapCargo",
    credentials: [
      { name: "apiKey", label: "API Key", required: true },
      { name: "email", label: "Email", required: true },
      { name: "password", label: "Password", type: "password", required: true },
    ],
  },

  dhl: {
    label: "DHL",
    credentials: [
      { name: "apiKey", label: "API Key", required: true },
      { name: "apiSecret", label: "API Secret", required: true },
    ],
  },

  fedex: {
    label: "FedEx",
    credentials: [
      { name: "clientId", label: "Client ID", required: true },
      { name: "clientSecret", label: "Client Secret", required: true },
    ],
  },
};