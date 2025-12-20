"use client"

import { useAuth } from "@/lib/auth"

export default function DashboardPage() {
  const { user, organization, plan } = useAuth()

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <h1 className="text-4xl font-bold text-primary">
        Welcome to Dashboard
      </h1>
      {user && (
        <div className="text-center space-y-2">
          <p className="text-lg text-text-secondary">
            Hello, <span className="font-semibold text-text-primary">{user.email}</span>
          </p>
          {organization && (
            <p className="text-sm text-text-secondary">
              Organization: <span className="font-medium">{organization.name}</span>
            </p>
          )}
          {plan && (
            <p className="text-sm text-text-secondary">
              Plan: <span className="font-medium">{plan.name}</span> 
              ({plan.monthly_certificate_limit} certificates/month)
            </p>
          )}
        </div>
      )}
    </div>
  )
}
