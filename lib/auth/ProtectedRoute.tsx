"use client"

import React from "react"
import { useAuth } from "./AuthProvider"
import { useRouter } from "next/navigation"
import Loader from "@/components/loader"

interface ProtectedRouteProps {
  children: React.ReactNode
  fallbackPath?: string
}

export function ProtectedRoute({ 
  children, 
  fallbackPath = "/login" 
}: ProtectedRouteProps) {
  const { status } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (status === "unauthenticated") {
      router.push(fallbackPath)
    }
  }, [status, router, fallbackPath])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-canvas">
        <Loader size="large" text="Checking authentication..." />
      </div>
    )
  }

  if (status === "unauthenticated") {
    return null // Will redirect in useEffect
  }

  return <>{children}</>
}