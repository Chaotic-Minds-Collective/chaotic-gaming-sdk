export type PermissionScopeType = "platform" | "game" | "cluster" | "server" | "guild";

export interface PermissionScope {
  type: PermissionScopeType;
  id: string;
}

export interface AuthorizationContext {
  principalId: string;
  permission: string;
  scope: PermissionScope;
}

export interface AuthorizationDecision {
  allowed: boolean;
  reason:
    | "granted"
    | "no_matching_assignment"
    | "principal_inactive"
    | "scope_mismatch"
    | "authorization_unavailable";
}
