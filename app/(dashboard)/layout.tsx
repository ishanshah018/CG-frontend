"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthProvider, useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { MantineProvider } from "@mantine/core"
import { Toaster } from "@/components/ui/toaster"
import { getDashboardUsage, type DashboardUsageData } from "@/lib/api/certificates"
import { useEffect, useState, createContext, useContext } from "react"
import "@mantine/core/styles.css"

/* ===================== Usage Context ===================== */
interface UsageContextType {
  usage: DashboardUsageData | null
  refetchUsage: () => Promise<void>
  isLoading: boolean
}

const UsageContext = createContext<UsageContextType>({
  usage: null,
  refetchUsage: async () => {},
  isLoading: false,
})

export const useUsage = () => useContext(UsageContext)

/* ===================== Dashboard Content ===================== */
function DashboardContent({ children }: { children: React.ReactNode }) {
  const { organization, plan } = useAuth()
  const pathname = usePathname()
  const [usage, setUsage] = useState<DashboardUsageData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchUsage = async () => {
    setIsLoading(true)
    try {
      const response = await getDashboardUsage()
      if (response.success && response.data) {
        setUsage(response.data)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsage()
  }, [])

  const usagePercentage = usage?.usage_percentage ?? 0
  const used = usage?.monthly_certificates_used ?? 0
  const limit = usage?.monthly_certificate_limit ?? (plan?.monthly_certificate_limit || 100)

  const isPricingPage = pathname === "/pricing"

  return (
    <UsageContext.Provider value={{ usage, refetchUsage: fetchUsage, isLoading }}>
      <SidebarProvider>
        {!isPricingPage && <AppSidebar />}

        {/* Main container with dark background - NO padding/margin/gap */}
        <SidebarInset className="bg-zinc-900 min-h-screen overflow-hidden" style={{ margin: 0, padding: 0 }}>
          {/* Fixed dark background layer */}
          <div className="fixed inset-0 bg-zinc-900 -z-10" />

          {/* Wrapper with proper spacing - adjusts with sidebar state */}
          <div className="h-screen pl-0 pr-3 pt-2 pb-2 md:pr-4 md:pt-2 md:pb-2">
            {/* Fixed rounded white container */}
            <div
              className={`
                ${!isPricingPage ? `
                  h-full w-full
                  bg-white
                  rounded-3xl
                  shadow-[0_0_50px_rgba(0,0,0,0.3)]
                  overflow-hidden
                  flex flex-col
                ` : "w-full h-full"}
              `}
            >
              {/* HEADER - Fixed at top */}
              {!isPricingPage && (
                <header className="shrink-0 flex h-14 items-center justify-between px-6 bg-white border-b relative">
                  {/* Left */}
                  <div className="flex items-center gap-3">
                    <div className="hidden md:block">
                      <Breadcrumb />
                    </div>
                  </div>

                  {/* Center */}
                  <div className="absolute left-1/2 -translate-x-1/2">
                    <span className="text-sm md:text-lg font-semibold">
                      {organization?.name || "Organization"}
                    </span>
                  </div>

                  {/* Right */}
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end text-xs">
                      <span className="text-gray-500">Certificates Generated</span>
                      <div className="w-32 h-4 bg-gray-200 rounded-full overflow-hidden relative">
                        <div
                          className="absolute inset-0 bg-brand-primary"
                          style={{ width: `${usagePercentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] font-semibold">
                          {used} / {limit}
                        </div>
                      </div>
                    </div>

                    {plan?.name === "free" && (
                      <button
                        onClick={() => (window.location.href = "/pricing")}
                        className="hidden md:block px-3 h-7 text-xs font-semibold text-white rounded bg-brand-primary hover:bg-brand-primary-hover"
                      >
                        Upgrade
                      </button>
                    )}
                  </div>
                </header>
              )}

              {/* PAGE CONTENT - Scrollable area */}
              <main className={`flex-1 overflow-y-auto ${isPricingPage ? "" : "p-6 md:p-8"}`}>
                {children}
              </main>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </UsageContext.Provider>
  )
}

/* ===================== Layout Wrapper ===================== */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <MantineProvider>
      <AuthProvider requireAuth>
        <DashboardContent>{children}</DashboardContent>
        <Toaster />
      </AuthProvider>
    </MantineProvider>
  )
}