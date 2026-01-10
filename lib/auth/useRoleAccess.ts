/**
 * Role-based access control hook
 * Provides utilities for checking user permissions
 */

import { useAuth } from "./AuthProvider"

export type UserRole = "owner" | "member"

export interface RolePermissions {
  canManageTeam: boolean
  canAccessBilling: boolean
  canDeleteOrganization: boolean
  canViewDashboard: boolean
  canGenerateCertificates: boolean
  canViewTemplates: boolean
  canViewCertificates: boolean
  canManageMapping: boolean
}

/**
 * Hook to check user permissions based on role
 */
export function useRoleAccess() {
  const { user } = useAuth()

  const isOwner = user?.role === "owner"
  const isMember = user?.role === "member"

  const permissions: RolePermissions = {
    // Owner-only permissions
    canManageTeam: isOwner,
    canAccessBilling: isOwner,
    canDeleteOrganization: isOwner,
    
    // Shared permissions
    canViewDashboard: true,
    canGenerateCertificates: true,
    canViewTemplates: true,
    canViewCertificates: true,
    canManageMapping: true,
  }

  return {
    user,
    isOwner,
    isMember,
    permissions,
  }
}
