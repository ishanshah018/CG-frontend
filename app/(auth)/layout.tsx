"use client"

import { AuthProvider } from "@/lib/auth"
import { GoogleOAuthProvider } from "@react-oauth/google"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  return (
    <AuthProvider>
      {googleClientId ? (
        <GoogleOAuthProvider clientId={googleClientId}>
          {children}
        </GoogleOAuthProvider>
      ) : (
        children
      )}
    </AuthProvider>
  )
}