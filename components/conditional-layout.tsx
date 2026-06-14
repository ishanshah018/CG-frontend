"use client"

import { usePathname } from "next/navigation"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Breadcrumb } from "@/components/breadcrumb"

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAuthPage = pathname === "/login" || pathname === "/signup"

  if (isAuthPage) {
    return <>{children}</>
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-surface-canvas min-h-screen">
        {/* TOP BAR */}
        <header className="header-bar flex h-14 items-center justify-between border-b border-border px-4">
          {/* Left Section */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden md:block">
              <Breadcrumb />
            </div>
            <span className="text-sm lg:text-lg text-text-secondary hidden lg:block md:ml-4">Welcome, Ishan.</span>
          </div>

          {/* Center Section */}
          <div className="absolute left-1/2 -translate-x-1/2">
            <span className="text-sm md:text-lg font-semibold text-text-primary">XYZ Company</span>
          </div>

          {/* Right Section */}
          <div className="flex flex-col items-end">
            <span className="font-semibold text-text-primary text-xs md:text-lg">Free Plan</span>
            <span className="text-[10px] md:text-base text-text-secondary">21/100</span>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
