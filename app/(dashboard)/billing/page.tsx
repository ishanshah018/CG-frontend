"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { getDashboardInsights, type DashboardInsightsData } from "@/lib/api/certificates"
import { toast } from "sonner"
import { Loader2, Check, CreditCard, Calendar, TrendingUp, Download, FileText, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"

// Helper function to format date
function formatDate(dateString: string) {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', { 
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Helper function to get plan price
function getPlanPrice(planName: string) {
  const prices: Record<string, { monthly: number, annual: number, display: string }> = {
    starter: { monthly: 0, annual: 0, display: '₹0 / month' },
    growth: { monthly: 299, annual: 3588, display: '₹299 / month' },
    scale: { monthly: 599, annual: 7188, display: '₹599 / month' },
  }
  return prices[planName.toLowerCase()] || prices.starter
}

// Helper function to capitalize plan name
function capitalizePlanName(name: string) {
  return name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
}

// Helper function to get plan tier level (for comparison)
function getPlanTier(planName: string): number {
  const tiers: Record<string, number> = {
    starter: 1,
    growth: 2,
    scale: 3,
  }
  return tiers[planName.toLowerCase()] || 0
}

export default function BillingPage() {
  const router = useRouter()
  const { user, organization, plan } = useAuth()
  const [insights, setInsights] = useState<DashboardInsightsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly")

  // Access control - redirect if not owner
  useEffect(() => {
    if (user && user.role !== "owner") {
      toast.error("You don't have permission to access billing")
      router.replace("/dashboard")
    }
  }, [user, router])

  // Fetch insights data for billing cycle
  useEffect(() => {
    if (user && user.role === "owner") {
      fetchInsights()
    }
  }, [user])

  const fetchInsights = async () => {
    try {
      setLoading(true)
      const response = await getDashboardInsights()
      setInsights(response.data)
    } catch (error) {
      console.error("Failed to fetch insights:", error)
      toast.error("Failed to load billing information")
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if not owner (will redirect)
  if (!user || user.role !== "owner") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-brand-primary" />
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--color-brand-primary)' }} />
      </div>
    )
  }

  const currentPlanName = plan?.name || 'starter'
  const currentPlanTier = getPlanTier(currentPlanName)
  const planPrice = getPlanPrice(currentPlanName)

  // Calculate prices for billing cycle
  const calculatePrice = (planName: string) => {
    const prices = getPlanPrice(planName)
    if (billingCycle === "monthly") {
      return { 
        display: prices.monthly, 
        period: "/month",
        originalPrice: null,
        yearlyTotal: null
      }
    }
    const discountedMonthly = Math.round(prices.monthly * 0.85)
    const yearlyPrice = discountedMonthly * 12
    return { 
      display: discountedMonthly, 
      period: "/month",
      originalPrice: prices.monthly,
      yearlyTotal: yearlyPrice
    }
  }

  const plans = [
    {
      name: "Starter",
      badge: "Free forever",
      badgeColor: "bg-gray-100 text-gray-700",
      price: 0,
      description: "Perfect for getting started",
      planKey: "starter",
      features: [
        { text: "100 certificates / month", included: true },
        { text: "Certificate generation", included: true },
        { text: "Download & store certificates", included: true },
        { text: "Custom mapping", included: true },
      ],
    },
    {
      name: "Growth",
      badge: "Most Popular",
      badgeColor: "bg-blue-100 text-blue-700",
      popular: true,
      price: 299,
      description: "For growing teams",
      planKey: "growth",
      features: [
        { text: "500 certificates / month", included: true },
        { text: "Certificate generation and Storage", included: true },
        { text: "Send Certificate via Email", included: true },
        { text: "Custom mapping", included: true },
        { text: "Add up to 2 team members", included: true },
        { text: "Priority support", included: true },
      ],
    },
    {
      name: "Scale",
      badge: "Enterprise",
      badgeColor: "bg-purple-100 text-purple-700",
      price: 599,
      description: "For large-scale operations",
      planKey: "scale",
      features: [
        { text: "2000 certificates / month", included: true },
        { text: "Certificate generation and Storage", included: true },
        { text: "Send Certificate via Email", included: true },
        { text: "Resend email support", included: true },
        { text: "Custom mapping", included: true },
        { text: "Custom email sender (domain, reply-to, branding)", included: true },
        { text: "Add up to 4 team members", included: true },
        { text: "Advanced support (24/7)", included: true },
      ],
    },
  ]

  // Dummy billing history data
  const billingHistory = [
    {
      id: "INV-2026-001",
      date: "2026-02-01",
      description: "Growth Plan - Monthly",
      amount: "₹299",
      status: "paid",
    },
    {
      id: "INV-2026-002",
      date: "2026-01-01",
      description: "Growth Plan - Monthly",
      amount: "₹299",
      status: "paid",
    },
    {
      id: "INV-2025-012",
      date: "2025-12-01",
      description: "Starter Plan - Free",
      amount: "₹0",
      status: "paid",
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 py-8 space-y-8">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Billing & Subscription
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your subscription, view invoices, and update payment methods
          </p>
        </div>

        {/* Section 1: Current Plan Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div 
            className="p-6 border-b border-gray-200"
            style={{
              background: 'linear-gradient(135deg, rgba(37, 150, 190, 0.05) 0%, rgba(37, 150, 190, 0.02) 100%)'
            }}
          >
            <div className="flex items-center gap-3 mb-1">
              <CreditCard className="w-5 h-5" style={{ color: 'var(--color-brand-primary)' }} />
              <h2 className="text-xl font-bold text-foreground">Your Current Plan</h2>
            </div>
            <p className="text-xs text-muted-foreground ml-8">Active subscription details</p>
          </div>

          <div className="p-6 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Plan Name */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <TrendingUp className="w-4 h-4" />
                  <span>Plan</span>
                </div>
                <p className="text-xl font-bold" style={{ color: 'var(--color-brand-primary)' }}>
                  {capitalizePlanName(currentPlanName)}
                </p>
              </div>

              {/* Price */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CreditCard className="w-4 h-4" />
                  <span>Price</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {planPrice.display}
                </p>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-4 h-4" />
                  <span>Status</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="text-xl font-bold text-green-600">Active</p>
                </div>
              </div>

              {/* Next Billing Date */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Next Billing</span>
                </div>
                <p className="text-xl font-bold text-foreground">
                  {insights?.billing_cycle?.resets_at 
                    ? formatDate(insights.billing_cycle.resets_at)
                    : 'N/A'}
                </p>
              </div>
            </div>

            {/* Usage Info */}
            {insights && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Certificate Usage This Month</p>
                    <p className="text-lg font-semibold text-foreground">
                      {insights.monthly_certificates_used.toLocaleString()} / {insights.monthly_certificate_limit.toLocaleString()} certificates used
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Resets on {insights.billing_cycle?.resets_at ? formatDate(insights.billing_cycle.resets_at) : 'N/A'}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className="h-2.5 rounded-full transition-all duration-500"
                    style={{ 
                      width: `${Math.min((insights.monthly_certificates_used / insights.monthly_certificate_limit) * 100, 100)}%`,
                      background: 'linear-gradient(90deg, var(--color-brand-primary), var(--color-brand-primary-hover))'
                    }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Available Plans */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-2">Available Plans</h2>
            <p className="text-sm text-muted-foreground">Choose a plan that works best for your needs</p>
          </div>

          {/* Billing Toggle */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "monthly"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle("annually")}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  billingCycle === "annually"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Annually
                <span className="ml-1.5 text-xs font-semibold text-green-600">Save 15%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((planItem) => {
              const pricing = planItem.price === 0 
                ? { display: 0, period: "/month", originalPrice: null, yearlyTotal: null } 
                : calculatePrice(planItem.planKey)
              
              const planTier = getPlanTier(planItem.planKey)
              const isCurrentPlan = planItem.planKey.toLowerCase() === currentPlanName.toLowerCase()
              const canUpgrade = planTier > currentPlanTier
              const isDowngrade = planTier < currentPlanTier

              return (
                <div
                  key={planItem.name}
                  className={`relative flex flex-col bg-white border rounded-2xl p-6 transition-all duration-300 ${
                    planItem.popular
                      ? "shadow-lg scale-105 hover:shadow-2xl"
                      : "border-gray-200 hover:border-gray-300 hover:shadow-lg"
                  } ${isCurrentPlan ? 'ring-2 ring-offset-2' : ''}`}
                  style={
                    planItem.popular || isCurrentPlan
                      ? {
                          borderColor: 'var(--color-brand-primary)',
                          boxShadow: isCurrentPlan 
                            ? '0 10px 40px -10px rgba(37, 150, 190, 0.4), 0 0 0 1px var(--color-brand-primary)'
                            : '0 10px 40px -10px rgba(37, 150, 190, 0.3), 0 0 0 1px var(--color-brand-primary)',
                        }
                      : undefined
                  }
                >
                  {/* Current Plan Badge */}
                  {isCurrentPlan && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span 
                        className="inline-block px-4 py-1 rounded-full text-xs font-semibold text-white shadow-md"
                        style={{ backgroundColor: 'var(--color-brand-primary)' }}
                      >
                        Current Plan
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  {planItem.badge && !isCurrentPlan && (
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${planItem.badgeColor}`}>
                        {planItem.badge}
                      </span>
                    </div>
                  )}

                  {isCurrentPlan && <div className="mb-4 h-6"></div>}

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold text-foreground mb-2">{planItem.name}</h3>
                  
                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6">{planItem.description}</p>

                  {/* Price Block */}
                  <div className="mb-6" style={{ minHeight: '100px' }}>
                    <div className="flex flex-col">
                      {/* Strikethrough original price */}
                      <div className="mb-1" style={{ minHeight: '24px' }}>
                        {pricing.originalPrice && (
                          <span className="text-base text-gray-400 line-through">
                            ₹{pricing.originalPrice} / month
                          </span>
                        )}
                      </div>
                      
                      {/* Main price display */}
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-foreground">
                          ₹{pricing.display}
                        </span>
                        <span className="text-lg text-muted-foreground">{pricing.period}</span>
                      </div>
                      
                      {/* Yearly total */}
                      <div className="mt-2" style={{ minHeight: '20px' }}>
                        {pricing.yearlyTotal && (
                          <p className="text-sm text-muted-foreground">
                            ₹{pricing.yearlyTotal} billed annually
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    disabled={isCurrentPlan || isDowngrade}
                    onClick={() => {
                      toast.info("Upgrade feature coming soon!")
                    }}
                    className="w-full mb-6 h-11 font-semibold"
                    variant={isCurrentPlan ? "outline" : canUpgrade ? "default" : "outline"}
                    style={
                      isCurrentPlan
                        ? {
                            borderColor: "var(--color-brand-primary)",
                            color: "var(--color-brand-primary)",
                            backgroundColor: "white",
                            cursor: "default",
                          }
                        : canUpgrade && planItem.popular
                        ? {
                            backgroundColor: "var(--color-brand-primary)",
                            color: "white",
                            border: "none",
                          }
                        : canUpgrade
                        ? {
                            borderColor: "var(--color-brand-primary)",
                            color: "var(--color-brand-primary)",
                            backgroundColor: "white",
                          }
                        : {
                            opacity: 0.5,
                            cursor: "not-allowed",
                          }
                    }
                  >
                    {isCurrentPlan 
                      ? "Current Plan" 
                      : isDowngrade 
                      ? "Not Available" 
                      : `Upgrade to ${planItem.name}`}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3 flex-1">
                    {planItem.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="shrink-0 mt-0.5">
                          <Check className="w-5 h-5 text-green-600" strokeWidth={2.5} />
                        </div>
                        <span className="text-sm text-foreground">{feature.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Section 3: Billing History */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center gap-3 mb-1">
              <FileText className="w-5 h-5" style={{ color: 'var(--color-brand-primary)' }} />
              <h2 className="text-xl font-bold text-foreground">Billing History</h2>
            </div>
            <p className="text-xs text-muted-foreground ml-8">View and download your invoices</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Invoice ID
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {billingHistory.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-medium text-foreground">
                        {invoice.id}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-muted-foreground">
                        {formatDate(invoice.date)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-foreground">
                        {invoice.description}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-foreground">
                        {invoice.amount}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toast.info("Download feature coming soon!")}
                        className="text-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State (if no history) */}
          {billingHistory.length === 0 && (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                No billing history yet
              </h3>
              <p className="text-sm text-muted-foreground">
                Your invoices will appear here once you start a paid subscription
              </p>
            </div>
          )}
        </div>

        {/* Footer Note */}
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Need help with billing? Contact our support team at{" "}
            <a 
              href="mailto:support@example.com" 
              className="font-medium hover:underline"
              style={{ color: 'var(--color-brand-primary)' }}
            >
              support@example.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
