export type BotStatus = "draft" | "active" | "paused";

export interface Bot {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  status: BotStatus;
  primaryColor: string;
  welcomeMessage: string;
  systemPrompt: string;
  defaultLanguage: string;
  supportedLanguages: string[];
  allowedDomains: string[];
  createdBy: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  plan: "free" | "starter" | "business" | "enterprise";
}
