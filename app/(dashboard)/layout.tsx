"use client"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/breadcrumb"
import { AuthProvider, useAuth } from "@/lib/auth"
import { usePathname } from "next/navigation"

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
            {pathname === "/dashboard" && (
              <span className="text-sm lg:text-lg text-text-secondary hidden lg:block md:ml-4">
                Welcome Back
              </span>
            )}
          </div>

          {/* Center Section */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-sm md:text-lg font-semibold text-text-primary">
              {organization?.name || 'Organization'}
            </span>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end">
            <span className="font-semibold text-text-primary text-xs md:text-lg">
              {plan?.name ? plan.name.charAt(0).toUpperCase() + plan.name.slice(1) : 'Free'} Plan
            </span>
            <span className="text-[10px] md:text-base text-text-secondary">
              21/{plan?.monthly_certificate_limit || 100}
            </span>
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
    <AuthProvider requireAuth={true}>
      <DashboardContent>{children}</DashboardContent>
    </AuthProvider>
  )
}