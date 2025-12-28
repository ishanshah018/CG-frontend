"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { getCurrentUser, clearAuthData, User, Organization, Plan } from "@/lib/api/auth"
import { STORAGE_KEYS } from "@/lib/api/config"
import Loader from "@/components/loader"

// Auth status to prevent flicker
type AuthStatus = "loading" | "authenticated" | "unauthenticated"

interface AuthState {
status: AuthStatus
user: User | null
organization: Organization | null
plan: Plan | null
}

interface AuthContextType extends AuthState {
logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
children: React.ReactNode
requireAuth?: boolean // New prop to specify if auth is required for this layout
}

export function AuthProvider({ children, requireAuth = false }: AuthProviderProps) {
const [authState, setAuthState] = useState<AuthState>({
status: "loading",
user: null,
organization: null,
plan: null,
})

const router = useRouter()
const pathname = usePathname()

const handleLogout = () => {
clearAuthData()
setAuthState({
    status: "unauthenticated",
    user: null,
    organization: null,
    plan: null,
})
router.replace("/login")
}

useEffect(() => {
const checkAuth = async () => {
    // Don't run any auth logic on server side
    if (typeof window === "undefined") return

    const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

    if (token) {
    try {
        const response = await getCurrentUser()
        const { user, organization, plan } = response.data

        setAuthState({
        status: "authenticated",
        user,
        organization,
        plan,
        })

        // AUTO-LOGOUT: If authenticated user tries to access auth routes or unauthorized routes
        if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
        // User is authenticated but trying to access login/signup - logout them
        handleLogout()
        return
        }
        
        // If user navigates to any other route (not dashboard routes), logout
        const allowedRoutes = ["/dashboard", "/settings", "/templates", "/billing", "/certificates", "/generate", "/certificate-mapping", "/account-management"]
        const isAllowedRoute = allowedRoutes.some(route => pathname.startsWith(route))
        
        if (!isAllowedRoute && pathname !== "/") {
        // User is authenticated but trying to access unauthorized route - logout them  
        handleLogout()
        return
        }
    } catch {
        clearAuthData()
        setAuthState({
        status: "unauthenticated",
        user: null,
        organization: null,
        plan: null,
        })

        // If auth is required and token is invalid, redirect to login
        if (requireAuth) {
        router.replace("/login")
        }
    }
    } else {
    setAuthState({
        status: "unauthenticated",
        user: null,
        organization: null,
        plan: null,
    })

    // If auth is required and no token, redirect to login
    if (requireAuth) {
        router.replace("/login")
    }
    }
}

checkAuth()
}, [pathname, router, requireAuth])

// No loader - just render children directly
return (
<AuthContext.Provider
    value={{
    ...authState,
    logout: handleLogout,
    }}
>
    {children}
</AuthContext.Provider>
)
}

export function useAuth() {
const context = useContext(AuthContext)
if (context === undefined) {
throw new Error("useAuth must be used within an AuthProvider")
}
return context
}