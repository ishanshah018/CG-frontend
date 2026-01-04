/**
 * Account Management API handlers
 * Handles organization profile and account security operations
 */

import { API_CONFIG, STORAGE_KEYS } from "./config";

// Types
export interface OrganizationProfile {
  organization_name: string;
  admin_email: string;
}

export interface GetOrganizationProfileResponse {
  success: boolean;
  data: OrganizationProfile;
}

export interface UpdateOrganizationProfilePayload {
  organization_name: string;
  admin_email: string;
}

export interface UpdateOrganizationProfileResponse {
  success: boolean;
  message: string;
  data: OrganizationProfile;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  message: string;
}

/**
 * Get organization profile
 */
export async function getOrganizationProfile(): Promise<GetOrganizationProfileResponse> {
  const token = typeof window !== "undefined" 
    ? sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    : null;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/account/organization`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch organization profile");
  }

  return data;
}

/**
 * Update organization profile
 */
export async function updateOrganizationProfile(
  payload: UpdateOrganizationProfilePayload
): Promise<UpdateOrganizationProfileResponse> {
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    : null;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/account/organization`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to update organization profile");
  }

  return data;
}

/**
 * Change password
 */
export async function changePassword(
  payload: ChangePasswordPayload
): Promise<ChangePasswordResponse> {
  const token = typeof window !== "undefined"
    ? sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)
    : null;

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/account/change-password`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to change password");
  }

  return data;
}
