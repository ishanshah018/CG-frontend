"use client"

import { useAuth } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { getBaseCertificateTemplate, getDashboardInsights, getDashboardGraph, type DashboardInsightsData, type DashboardGraphData } from "@/lib/api/certificates"
import { FileCheck, TrendingUp, Calendar, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUsage } from "@/app/(dashboard)/layout"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"

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

  const stats = [
    {
      icon: FileCheck,
      label: "Total Certificates Issued",
      value: isInsightsLoading ? <Skeleton className="w-16 h-8" /> : insights?.total_issued.toString() ?? "0",
      color: "text-blue-600"
    },
    {
      icon: Calendar,
      label: "Certificates This Month",
      value: isInsightsLoading ? <Skeleton className="w-16 h-8" /> : insights?.issued_this_month.toString() ?? "0",
      color: "text-green-600"
    },
    {
      icon: TrendingUp,
      label: "Remaining Monthly Limit",
      value: usage ? usage.remaining.toString() : <Skeleton className="w-16 h-8" />,
      color: "text-purple-600"
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
                  <div className="text-2xl font-semibold text-foreground">
                    {stat.value}
                  </div>
                </div>
                <div className={`p-2 rounded-lg bg-muted/50 ${stat.color}`}>
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          ))}
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
          <div className="bg-gradient-to-br from-brand-primary/10 to-brand-primary/5 border border-brand-primary/20 rounded-lg p-5">
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
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">
              Certificate Generation Trend
            </h2>
            {isMounted && (
              <Select value={selectedYear.toString()} onValueChange={handleYearChange}>
                <SelectTrigger className="w-32">
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

          <div className="bg-card border border-border rounded-lg p-6">
            {isGraphLoading ? (
              <div className="h-80 flex items-center justify-center">
                <Skeleton className="w-full h-full" />
              </div>
            ) : !hasGraphData ? (
              <div className="h-80 flex flex-col items-center justify-center text-center">
                <div className="p-4 bg-muted/50 rounded-full mb-4">
                  <FileCheck className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  No certificates generated this year
                </h3>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
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
                  <Tooltip
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
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
