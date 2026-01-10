"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useEffect, Fragment } from "react"
import { getBaseCertificateTemplate, getDashboardInsights, getDashboardGraph, type DashboardInsightsData, type DashboardGraphData } from "@/lib/api/certificates"
import { FileCheck, TrendingUp, Calendar, CheckCircle2, AlertCircle, Info, Lock, Mail, Users, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useUsage } from "@/app/(dashboard)/layout"
import { Area, AreaChart, ResponsiveContainer, Tooltip as ChartTooltip, XAxis, YAxis, CartesianGrid } from "recharts"

// Skeleton loader component
const Skeleton = ({ className }: { className?: string }) => (
  <span className={`inline-block animate-pulse bg-gray-200 rounded ${className}`} />
)

export default function DashboardPage() {
  const { plan } = useAuth()
  const { usage } = useUsage()
  const router = useRouter()
  
  // Client-side mount state to avoid hydration issues
  const [isMounted, setIsMounted] = useState(false)
  
  // Base template state
  const [hasTemplate, setHasTemplate] = useState<boolean | null>(null)
  const [isTemplateLoading, setIsTemplateLoading] = useState(true)
  
  // Dashboard insights state
  const [insights, setInsights] = useState<DashboardInsightsData | null>(null)
  const [isInsightsLoading, setIsInsightsLoading] = useState(true)
  
  // Dashboard graph state
  const [graphData, setGraphData] = useState<DashboardGraphData | null>(null)
  const [isGraphLoading, setIsGraphLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Generate year options (current year and up to 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i)

  useEffect(() => {
    setIsMounted(true)
    checkBaseTemplate()
    fetchInsights()
    fetchGraph(selectedYear)
  }, [])

  const checkBaseTemplate = async () => {
    try {
      const response = await getBaseCertificateTemplate()
      setHasTemplate(response.success && response.data !== null)
    } catch (error) {
      setHasTemplate(false)
    } finally {
      setIsTemplateLoading(false)
    }
  }

  const fetchInsights = async () => {
    try {
      const response = await getDashboardInsights()
      if (response.success && response.data) {
        setInsights(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch insights:", error)
    } finally {
      setIsInsightsLoading(false)
    }
  }

  const fetchGraph = async (year: number) => {
    setIsGraphLoading(true)
    try {
      const response = await getDashboardGraph(year)
      if (response.success && response.data) {
        setGraphData(response.data)
      }
    } catch (error) {
      console.error("Failed to fetch graph:", error)
    } finally {
      setIsGraphLoading(false)
    }
  }

  const handleYearChange = (year: string) => {
    const yearNum = parseInt(year)
    setSelectedYear(yearNum)
    fetchGraph(yearNum)
  }

  // Check if graph has any data
  const hasGraphData = graphData?.points?.some(p => p.count > 0) ?? false

  // Format most issued type
  const formatType = (type: string | null) => {
    if (!type) return "No data yet"
    return type.charAt(0).toUpperCase() + type.slice(1)
  }

  // Format reset date to readable format
  const formatResetDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const stats = [
    {
      icon: FileCheck,
      label: "Total Certificates Issued",
      value: isInsightsLoading ? <Skeleton className="w-16 h-8" /> : insights?.total_issued.toString() ?? "0",
      color: "text-blue-600",
      tooltip: "This is the total number of certificates issued since your account was created. This is NOT your monthly limit."
    },
    {
      icon: Calendar,
      label: "Certificates Issued This Month",
      value: isInsightsLoading ? <Skeleton className="w-16 h-8" /> : insights?.issued_this_month.toString() ?? "0",
      color: "text-green-600",
      tooltip: "This means the Certificates generated in the current month only. This does not represent your monthly limit usage."
    },
    {
      icon: TrendingUp,
      label: "Monthly Limit Used",
      value: isInsightsLoading ? <Skeleton className="w-16 h-8" /> : (
        insights ? `${insights.monthly_certificates_used} / ${insights.monthly_certificate_limit}` : "0 / 0"
      ),
      color: "text-purple-600",
      subtext: insights?.billing_cycle?.resets_at ? `Monthly limit resets on ${formatResetDate(insights.billing_cycle.resets_at)}` : null,
      helperText: insights ? `${insights.remaining_monthly_limit} remaining` : null,
      tooltip: "This shows how many certificates you have used from your monthly plan limit."
    },
    {
      icon: CheckCircle2,
      label: "Base Template Status",
      value: isTemplateLoading ? <Skeleton className="w-20 h-8" /> : (hasTemplate ? "Active" : "Not Set"),
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

        {/* Stats Strip - Modern SaaS Metrics Bar */}
        <div className="relative">
          {/* Top gradient line with glow */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#2696be]/40 to-transparent">
            <div className="h-full bg-linear-to-r from-transparent via-[#2696be]/20 to-transparent blur-sm"></div>
          </div>
          
          {/* Stats container - Compact with visible dividers */}
          <div className="py-4 px-4">
            {/* Desktop layout - single row with dividers */}
            <div className="hidden lg:flex items-center justify-between">
              {stats.map((stat, index) => (
                <Fragment key={index}>
                  {/* Metric block */}
                  <div 
                    className="flex flex-col items-center justify-center text-center space-y-2 px-4 flex-1 min-h-25"
                  >
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        {stat.label}
                      </p>
                      {stat.tooltip && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-foreground transition-colors">
                              <Info className="w-3.5 h-3.5" />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-xs">
                            <p className="text-xs leading-relaxed">{stat.tooltip}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {stat.icon && (
                        <stat.icon className={`w-5 h-5 ${stat.color}`} />
                      )}
                      <span className="text-3xl font-bold text-foreground tabular-nums">
                        {stat.value}
                      </span>
                    </div>
                    
                    {stat.helperText && (
                      <p className="text-xs text-muted-foreground font-bold">
                        {stat.helperText}
                      </p>
                    )}
                    
                    {stat.subtext && (
                      <p className="text-xs text-muted-foreground/80">
                        {stat.subtext}
                      </p>
                    )}
                  </div>
                  
                  {/* Visible vertical divider */}
                  {index < stats.length - 1 && (
                    <div 
                      className="shrink-0 self-center"
                      style={{
                        width: '1px',
                        height: '64%',
                        backgroundColor: 'rgba(0, 0, 0, 0.25)',
                        minHeight: '64px'
                      }}
                    />
                  )}
                </Fragment>
              ))}
            </div>
            
            {/* Mobile/Tablet layout - 2x2 grid */}
            <div className="grid grid-cols-2 gap-4 lg:hidden">
              {stats.map((stat, index) => (
                <div 
                  key={index}
                  className="flex flex-col items-center justify-center text-center space-y-1.5 px-2 py-3"
                >
                  <div className="flex items-center gap-1.5">
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </p>
                    {stat.tooltip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button className="text-muted-foreground hover:text-foreground transition-colors">
                            <Info className="w-3 h-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs">
                          <p className="text-xs leading-relaxed">{stat.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1.5">
                    {stat.icon && (
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    )}
                    <span className="text-xl sm:text-2xl font-bold text-foreground tabular-nums">
                      {stat.value}
                    </span>
                  </div>
                  
                  {stat.helperText && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground font-bold">
                      {stat.helperText}
                    </p>
                  )}
                  
                  {stat.subtext && (
                    <p className="text-[9px] sm:text-xs text-muted-foreground/80">
                      {stat.subtext}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Bottom gradient line with glow */}
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-[#2696be]/40 to-transparent">
            <div className="h-full bg-linear-to-r from-transparent via-[#2696be]/20 to-transparent blur-sm"></div>
          </div>
        </div>

        {/* Base Template Warning */}
        {!isTemplateLoading && !hasTemplate && (
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
          <div className="bg-linear-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg p-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-brand-primary/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-brand-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-0.5">
                  Most Issued Certificate
                </p>
                {isInsightsLoading ? (
                  <Skeleton className="w-24 h-7" />
                ) : (
                  <p className="text-lg font-semibold text-foreground">
                    {formatType(insights?.most_issued_type ?? null)}
                  </p>
                )}
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
                  {isInsightsLoading ? (
                    <Skeleton className="w-12 h-8" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {insights?.by_type.course ?? 0}
                    </p>
                  )}
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
                  {isInsightsLoading ? (
                    <Skeleton className="w-12 h-8" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {insights?.by_type.webinar ?? 0}
                    </p>
                  )}
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
                  {isInsightsLoading ? (
                    <Skeleton className="w-12 h-8" />
                  ) : (
                    <p className="text-2xl font-semibold text-foreground">
                      {insights?.by_type.workshop ?? 0}
                    </p>
                  )}
                </div>
                <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Graph Section */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl font-semibold text-foreground">
              Certificate Generation Trend
            </h2>
            {isMounted && (
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            {isGraphLoading ? (
              <div className="h-56 sm:h-80 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : !hasGraphData ? (
              <div className="h-56 sm:h-80 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <FileCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  No certificates generated this year
                </h3>
              </div>
            ) : (
              <div className="h-60 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                  data={graphData?.points ?? []}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2596be" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#2596be" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                  <XAxis
                    dataKey="month"
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9ca3af"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <ChartTooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '8px 12px',
                    }}
                    labelStyle={{ color: '#374151', fontWeight: 600 }}
                    itemStyle={{ color: '#2596be' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#2596be"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCount)"
                    animationDuration={1000}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Account Actions Section */}
      <div className="space-y-6 mt-12">
        {/* Header */}
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-foreground">Quick Account Actions</h2>
          <p className="text-sm text-muted-foreground">Manage your team, security, and account preferences</p>
        </div>

          {/* Action Items Grid */}
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-3">
            {/* Action 1: Change Password */}
            <button
              onClick={() => {
                router.push('/account-management')
                // Allow navigation to complete, then scroll to Account Security section
                setTimeout(() => {
                  const securitySection = document.querySelector('[data-section="account-security"]')
                  if (securitySection) {
                    securitySection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
              className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="shrink-0 p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                <Lock className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-0.5">Change your password</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">Keep your account secure by updating your password</p>
              </div>
              <ChevronRight className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Action 2: Update Primary Email */}
            <button
              onClick={() => {
                router.push('/account-management')
                // Allow navigation to complete, then scroll to Organization Profile section
                setTimeout(() => {
                  const profileSection = document.querySelector('[data-section="organization-profile"]')
                  if (profileSection) {
                    profileSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
              className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="shrink-0 p-2 bg-green-50 rounded-lg group-hover:bg-green-100 transition-colors">
                <Mail className="w-5 h-5 text-green-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-0.5">Update your primary email</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">Change the email used for admin communication and certificates</p>
              </div>
              <ChevronRight className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>

            {/* Action 3: Add Team Members */}
            <button
              onClick={() => {
                router.push('/account-management')
                // Allow navigation to complete, then scroll to Team & Access section
                setTimeout(() => {
                  const teamSection = document.querySelector('[data-section="team-access"]')
                  if (teamSection) {
                    teamSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  }
                }, 100)
              }}
              className="group flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors text-left w-full"
            >
              <div className="shrink-0 p-2 bg-purple-50 rounded-lg group-hover:bg-purple-100 transition-colors">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground mb-0.5 flex items-center gap-2">
                  Add team members
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                    Coming Soon
                  </span>
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-1">Invite teammates and manage access permissions</p>
              </div>
              <ChevronRight className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </div>
    </div>
  )
}
