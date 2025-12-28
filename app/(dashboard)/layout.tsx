"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthProvider, useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { MantineProvider } from "@mantine/core"
import { Toaster } from "@/components/ui/toaster"
import { getDashboardUsage, type DashboardUsageData } from "@/lib/api/certificates"
import { useEffect, useState, createContext, useContext } from "react"
import "@mantine/core/styles.css"

// Usage Context
interface UsageContextType {
  usage: DashboardUsageData | null;
  refetchUsage: () => Promise<void>;
  isLoading: boolean;
}

const UsageContext = createContext<UsageContextType>({
  usage: null,
  refetchUsage: async () => {},
  isLoading: false,
});

export const useUsage = () => useContext(UsageContext);

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, organization, plan } = useAuth()
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
    } catch (error) {
      console.error("Failed to fetch usage:", error)
      // Keep last known values on error
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

  return (
    <UsageContext.Provider value={{ usage, refetchUsage: fetchUsage, isLoading }}>
      <SidebarProvider>
        <AppSidebar />

      <SidebarInset className="bg-surface-canvas min-h-screen">
        {/* TOP BAR */}
        <header className="header-bar flex h-14 items-center justify-between border-b border-border px-4">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <SidebarTrigger />
            <div className="hidden md:block">
              <Breadcrumb />
            </div>
          </div>

          {/* Center Section */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-sm md:text-lg font-semibold text-text-primary">
              {organization?.name || 'Organization'}
            </span>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end gap-1 min-w-[110px] md:min-w-[150px]">
            <span className="text-text-secondary text-xs md:text-sm whitespace-nowrap">
              Certificates Generated
            </span>
            {/* Progress Bar */}
            <div className="w-full max-w-[110px] md:max-w-[150px]">
              <div className="relative w-full h-4 md:h-4.5 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-brand-primary transition-all duration-300"
                  style={{ width: `${usagePercentage}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] md:text-xs font-semibold text-gray-700 whitespace-nowrap px-1 relative z-10" style={{ textShadow: '0 0 2px rgba(255,255,255,0.8)' }}>
                    {used} / {limit}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
    </UsageContext.Provider>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <MantineProvider>
      <AuthProvider requireAuth={true}>
        <DashboardContent>{children}</DashboardContent>
        <Toaster />
      </AuthProvider>
    </MantineProvider>
  )
}