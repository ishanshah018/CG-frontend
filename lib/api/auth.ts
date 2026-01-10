/**
 * Authentication API handlers
 * Handles all authentication-related API calls
 */

import { API_CONFIG, STORAGE_KEYS } from "./config";

// Types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials {
  organization_name: string;
  email: string;
  password: string;
}

export interface SignupCredentials {
  organization_name: string;
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  role: "owner" | "admin" | "staff" | "member";
}

export interface Organization {
  id: string;
  name: string;
}

export interface Plan {
  name: string;
  monthly_certificate_limit: number;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    access_token: string;
    user: User;
    organization: Organization;
    plan: Plan;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    organization_id: string;
    organization_name: string;
    owner_email: string;
  };
}

export interface SignupResponse {
  success: boolean;
  message: string;
  data: {
    organization_id: string;
    organization_name: string;
    owner_email: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string[]>;
}

export interface MeResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    organization: Organization;
    plan: Plan;
  };
}

/**
 * Login API handler
 * Authenticates user and returns access token with user data
 */
export async function loginUser(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Login failed");
  }

  return data;
}

/**
 * Signup API handler
 * Creates new organization and admin account
 */
export async function signupUser(
  credentials: SignupCredentials
): Promise<SignupResponse> {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.SIGNUP}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Signup failed");
  }

  return data;
}

/**
 * Store authentication data in sessionStorage
 * Only stores necessary data (token, user, organization, plan)
 * For invite accept: organization and plan are optional (will be fetched via /auth/me)
 */
export function storeAuthData(data: LoginResponse["data"] | { access_token: string; user: User; organization?: Organization; plan?: Plan }): void {
  if (typeof window === "undefined") return;

  try {
    if (!data.access_token) {
      throw new Error("Missing authentication token");
    }
    
    sessionStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, data.access_token);
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
    
    // Organization and plan are optional (for invite accept flow)
    if (data.organization) {
      sessionStorage.setItem(
        STORAGE_KEYS.ORGANIZATION,
        JSON.stringify(data.organization)
      );
    }
    if (data.plan) {
      sessionStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(data.plan));
    }
  } catch (error) {
    console.error("Failed to store auth data:", error);
    throw new Error("Failed to save login session");
  }
}

/**
 * Retrieve authentication data from sessionStorage
 */
export function getAuthData() {
  if (typeof window === "undefined") return null;

  try {
    const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
    const userStr = sessionStorage.getItem(STORAGE_KEYS.USER);
    const orgStr = sessionStorage.getItem(STORAGE_KEYS.ORGANIZATION);
    const planStr = sessionStorage.getItem(STORAGE_KEYS.PLAN);

    if (!token || !userStr || !orgStr || !planStr) return null;

    return {
      access_token: token,
      user: JSON.parse(userStr) as User,
      organization: JSON.parse(orgStr) as Organization,
      plan: JSON.parse(planStr) as Plan,
    };
  } catch (error) {
    console.error("Failed to retrieve auth data:", error);
    return null;
  }
}

/**
 * Clear authentication data from sessionStorage
 */
export function clearAuthData(): void {
  if (typeof window === "undefined") return;

  try {
    sessionStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.USER);
    sessionStorage.removeItem(STORAGE_KEYS.ORGANIZATION);
    sessionStorage.removeItem(STORAGE_KEYS.PLAN);
    
    // Clear certificate-related data
    sessionStorage.removeItem("certificate_mapping");
    sessionStorage.removeItem(STORAGE_KEYS.CERTIFICATE_ATTRIBUTES);
  } catch (error) {
    console.error("Failed to clear auth data:", error);
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
}

/**
 * Get current user API handler
 * Validates current session and returns fresh user data
 */
export async function getCurrentUser(): Promise<MeResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  
  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`,
    {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    // Clear invalid session
    clearAuthData();
    throw new Error(data.message || "Authentication failed");
  }

  return data;
}

/**
 * Validate and refresh auth data
 * Calls /me API and updates sessionStorage with fresh data
 */
export async function validateAndRefreshAuth(): Promise<{
  user: User;
  organization: Organization;
  plan: Plan;
}> {
  try {
    const response = await getCurrentUser();
    
    // Update sessionStorage with fresh data
    const { user, organization, plan } = response.data;
    sessionStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    sessionStorage.setItem(STORAGE_KEYS.ORGANIZATION, JSON.stringify(organization));
    sessionStorage.setItem(STORAGE_KEYS.PLAN, JSON.stringify(plan));
    
    return response.data;
  } catch (error) {
    // Clear invalid session on any failure
    clearAuthData();
    throw error;
  }
}

/**
 * Logout user
 * Clears all auth data and redirects to login
 */
export function logout(): void {
  clearAuthData();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
