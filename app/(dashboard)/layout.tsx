"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthProvider, useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"
import { MantineProvider } from "@mantine/core"
import "@mantine/core/styles.css"

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { user, organization, plan } = useAuth()
  const pathname = usePathname()

  return (
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
                  style={{ width: `${(21 / (plan?.monthly_certificate_limit || 100)) * 100}%` }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[10px] md:text-xs font-semibold text-gray-700 whitespace-nowrap px-1 relative z-10" style={{ textShadow: '0 0 2px rgba(255,255,255,0.8)' }}>
                    21 / {plan?.monthly_certificate_limit || 100}
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
      </AuthProvider>
    </MantineProvider>
  )
}