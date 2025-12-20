/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: "https://cg-backend-myn3.onrender.com",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      LOGOUT: "/api/auth/logout",
      REGISTER: "/api/auth/register",
      ME: "/api/auth/me",
    },
    // Add more endpoints as needed
    CERTIFICATES: "/api/certificates",
    TEMPLATES: "/api/templates",
  },
} as const;

/**
 * Storage keys for session management
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  USER: "user",
  ORGANIZATION: "organization",
  PLAN: "plan",
} as const;
