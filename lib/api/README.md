# API Documentation

## Structure

All API-related code is organized in the `lib/api/` directory following industry best practices.

```
lib/api/
├── index.ts       # Export barrel for clean imports
├── config.ts      # API configuration and constants
└── auth.ts        # Authentication API handlers
```

## Authentication System

### Login

```typescript
import { loginUser, storeAuthData } from "@/lib/api/auth";

const response = await loginUser({ email, password });
storeAuthData(response.data);
```

### User Validation (/me endpoint)

```typescript
import { validateAndRefreshAuth } from "@/lib/api/auth";

try {
  const { user, organization, plan } = await validateAndRefreshAuth();
  // Session is valid and data is refreshed
} catch (error) {
  // Session invalid - user will be redirected to login
}
```

### Auth Context

```typescript
import { useAuth } from "@/lib/auth";

function MyComponent() {
  const { user, organization, plan, isLoading, logout } = useAuth();
  // Component automatically protected if used on protected routes
}
```

## Route Protection

### Automatic Protection
Routes are automatically protected based on path patterns:

**Protected Routes** (require authentication):
- `/dashboard/*`
- `/certificates/*`
- `/templates/*`
- `/generate/*`
- `/settings/*`
- `/billing/*`

**Public Routes** (no authentication required):
- `/login`
- `/signup`

### Manual Protection
```typescript
import { ProtectedRoute } from "@/lib/auth";

<ProtectedRoute>
  <MyProtectedComponent />
</ProtectedRoute>
```

## Authentication Flow

1. **Login Success**: Stores token → redirects to dashboard
2. **Dashboard Access**: AuthProvider calls `/me` → validates session
3. **Valid Session**: Renders dashboard with fresh user data
4. **Invalid Session**: Clears storage → redirects to login
5. **Page Refresh**: Automatically validates session on protected routes

## Configuration

Base URL and endpoints are centralized in `config.ts`:

```typescript
import { API_CONFIG } from "@/lib/api/config";

const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.ME}`;
```

### Storage Keys

Session storage keys are defined as constants:

```typescript
import { STORAGE_KEYS } from "@/lib/api/config";

const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
```

## Adding New APIs

1. Create a new file in `lib/api/` (e.g., `certificates.ts`)
2. Add endpoints to `config.ts`
3. Export from `index.ts`
4. Use in components

Example:

```typescript
// lib/api/certificates.ts
import { API_CONFIG } from "./config";

export async function getCertificates() {
  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES}`
  );
  return response.json();
}
```

## Best Practices

- ✅ Always use centralized API configuration
- ✅ Handle errors gracefully with try-catch
- ✅ Use TypeScript interfaces for type safety
- ✅ Never log sensitive data (tokens, passwords)
- ✅ Store only necessary data in sessionStorage
- ✅ Use async/await for cleaner code
- ✅ Authentication is handled automatically by AuthProvider
- ✅ Protected routes validate sessions automatically
- ✅ Invalid sessions are handled globally
