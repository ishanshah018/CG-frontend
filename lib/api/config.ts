/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  BASE_URL: "https://api.ishans.qzz.io",
  ENDPOINTS: {
    AUTH: {
      LOGIN: "/api/auth/login",
      SIGNUP: "/api/auth/signup",
      LOGOUT: "/api/auth/logout",
      REGISTER: "/api/auth/register",
      ME: "/api/auth/me",
      GOOGLE: "/api/auth/google",
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
      GENERATE: "http://localhost:4000/api/certificates/generate",
      ISSUED: "/api/certificates/issued",
      VIEW: "/api/certificates",
      RESEND_EMAIL: "http://localhost:4000/api/certificates",
      DASHBOARD: {
        USAGE: "/api/certificates/dashboard/usage",
      },
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
