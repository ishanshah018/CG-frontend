/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: "https://cg-backend-myn3.onrender.com",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      SIGNUP: "/api/auth/signup",
      LOGOUT: "/api/auth/logout",
      REGISTER: "/api/auth/register",
      ME: "/api/auth/me",
    },
    CERTIFICATES: {
      TEMPLATES: {
        BASE: "/api/certificates/templates/base",
        UPLOAD: "/api/certificates/templates/upload",
      },
      MAPPING: {
        SAVE: "/api/certificates/mapping/save",
        GET: "/api/certificates/mapping",
      },
      GENERATE: "/api/certificates/generate",
    },
    // Add more endpoints as needed
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
  CERTIFICATE_ATTRIBUTES: "certificate_attributes",
} as const;
