"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function BillingPage() {
  const router = useRouter()
  const { user } = useAuth()

  // Access control - redirect if not owner
  useEffect(() => {
    if (user && user.role !== "owner") {
      toast.error("You don't have permission to access billing")
      router.replace("/dashboard")
    }
  }, [user, router])

  // Don't render anything if not owner (will redirect)
  if (!user || user.role !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <h1 className="text-4xl font-bold text-primary">
        You are in Billing page
      </h1>
    </div>
  )
}
