/**
 * Team Management API handlers
 * Handles all team and access control API calls
 */

import { API_CONFIG, STORAGE_KEYS } from "./config";

// Types
export interface TeamMember {
  id: string;
  email: string;
  role: "owner" | "member";
  status: "active" | "pending";
  joined_at: string;
  last_login_at?: string;
}

export interface PendingInvitation {
  id: string;
  email: string;
  status: "pending" | "accepted" | "expired";
  invited_at: string;
  expires_at: string;
}

export interface InviteRequest {
  email: string;
}

export interface InviteVerifyResponse {
  success: boolean;
  data: {
    organization_name: string;
    email: string;
    token: string;
  };
}

export interface AcceptInviteRequest {
  token: string;
  password: string;
}

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Send team member invitation
 */
export const inviteTeamMember = async (
  data: InviteRequest
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/invite`,
    {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to send invitation");
  }

  return result;
};

/**
 * Get pending invitations
 */
export const getPendingInvitations = async (): Promise<{
  success: boolean;
  data: PendingInvitation[];
}> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/invitations`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch invitations");
  }

  return result;
};

/**
 * Get team members
 */
export const getTeamMembers = async (): Promise<{
  success: boolean;
  data: {
    owner: TeamMember;
    members: TeamMember[];
    total_members: number;
  };
}> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/members`,
    {
      method: "GET",
      headers: getAuthHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch team members");
  }

  return result;
};

/**
 * Remove team member
 */
export const removeTeamMember = async (
  userId: string
): Promise<{ success: boolean; message: string }> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/member/${userId}`,
    {
      method: "DELETE",
      headers: getAuthHeaders(),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to remove team member");
  }

  return result;
};

/**
 * Verify invitation token
 */
export const verifyInviteToken = async (
  token: string
): Promise<InviteVerifyResponse> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/invite/verify?token=${encodeURIComponent(token)}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to verify invitation");
  }

  return result;
};

/**
 * Accept team invitation
 */
export const acceptInvitation = async (
  data: AcceptInviteRequest
): Promise<{
  success: boolean;
  message: string;
  data: {
    token?: string;
    access_token?: string;
    user: {
      id: string;
      email: string;
      role: "owner" | "member";
    };
    organization?: {
      id: string;
      name: string;
    };
    plan?: {
      name: string;
      monthly_certificate_limit: number;
    };
  };
}> => {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/team/invite/accept`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to accept invitation");
  }

  return result;
};
