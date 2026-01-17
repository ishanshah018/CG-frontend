"use client"

import { GoogleOAuthProvider } from "@react-oauth/google"

interface ProvidersProps {
  children: React.ReactNode
}

export default function Providers({ children }: ProvidersProps) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  
  // If Google OAuth is configured, wrap with provider
  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {children}
      </GoogleOAuthProvider>
    )
  }
  
  // Return children without provider if not configured
  return <>{children}</>
}
