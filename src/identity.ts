export type PrincipalStatus =
  | "pending" | "active" | "suspended" | "disabled" | "deletion_pending" | "deleted";

export type IdentityProvider = "discord" | "steam" | "atlas" | "7dtd" | "ark-se";

export interface PlayerIdentity {
  principalId: string;
  username: string;
  displayName: string | null;
  status: PrincipalStatus;
  linkedAccounts: LinkedAccount[];
}

export interface LinkedAccount {
  provider: IdentityProvider | (string & {});
  externalId: string;
  externalUsername: string | null;
  verifiedAt: string;
}

export interface ServicePrincipal {
  principalId: string;
  applicationName: string;
}
