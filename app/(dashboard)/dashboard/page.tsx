"use client"

import { useAuth } from "@/lib/auth"

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold text-primary">
        Welcome to Dashboard
      </h1>
    </div>
  )
}
