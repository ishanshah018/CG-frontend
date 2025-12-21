"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getBaseCertificateTemplate } from "@/lib/api/certificates"
import { FileCheck, TrendingUp, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function DashboardPage() {
  const { plan } = useAuth()
  const router = useRouter()
  const [hasTemplate, setHasTemplate] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkBaseTemplate()
  }, [])

  const checkBaseTemplate = async () => {
    try {
      const response = await getBaseCertificateTemplate()
      setHasTemplate(response.success && response.data !== null)
    } catch (error) {
      setHasTemplate(false)
    } finally {
      setIsLoading(false)
    }
  }

  const stats = [
    {
      icon: FileCheck,
      label: "Total Certificates Issued",
      value: "80",
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      label: "Certificates This Month",
      value: "21",
      color: "text-green-600"
    },
    {
      icon: TrendingUp,
      label: "Remaining Monthly Limit",
      value: "79",
      color: "text-purple-600"
    },
    {
      icon: CheckCircle2,
      label: "Base Template Status",
      value: isLoading ? "Loading..." : hasTemplate ? "Active" : "Not Set",
      color: hasTemplate ? "text-green-600" : "text-orange-600"
    }
  ]

  return (
    <div className="relative">
      {/* Plan Type - Top Right */}
      <div className="absolute top-0 right-2 md:top-0 md:right-4">
        <span 
          className="text-base md:text-lg font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {plan?.name ? plan.name.charAt(0).toUpperCase() + plan.name.slice(1) : 'Free'} Plan
        </span>
      </div>

      <div className="space-y-8">
        {/* Page Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Welcome back
          </h1>
          <p className="text-muted-foreground text-sm">
            Here&apos;s a quick overview of your certificate activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <div 
              key={index}
              className="bg-card border border-border rounded-lg p-5 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <p className="text-xs text-muted-foreground font-medium">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Base Template Warning */}
        {!isLoading && !hasTemplate && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className="p-2 bg-orange-100 rounded-lg shrink-0">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    Base Certificate Template Not Found
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    You haven&apos;t uploaded your base certificate yet. Upload one to start generating certificates.
                  </p>
                </div>
                <Button 
                  onClick={() => router.push('/templates')}
                  className="w-full sm:w-auto"
                >
                  Upload Base Certificate →
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Certificate Insights Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">
            Certificate Insights
          </h2>

          {/* Most Issued Highlight Card */}
          <div className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  Most Issued Certificate
                </p>
                <p className="text-lg font-semibold text-foreground">
                  Workshop
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Course
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    10
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Webinar
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    20
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg p-4 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    Workshop
                  </p>
                  <p className="text-2xl font-semibold text-foreground">
                    50
                  </p>
                </div>
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
