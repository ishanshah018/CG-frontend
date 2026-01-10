/**
 * Auth module exports
 * Centralized export point for all auth components and hooks
 */

export { AuthProvider, useAuth } from "./AuthProvider";
export { ProtectedRoute } from "./ProtectedRoute";
export { useRoleAccess } from "./useRoleAccess";
export type { UserRole, RolePermissions } from "./useRoleAccess";