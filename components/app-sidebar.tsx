"use client"

import * as React from "react"
import Link from "next/link"
import {
LayoutDashboard,
FileText,
Award,
UserCog,
CreditCard,
User,
LogOut,
GraduationCap,
Video,
Briefcase,
ChevronRight,
ChevronUp,
FilePlus,
Map,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth"
import { useRoleAccess } from "@/lib/auth"

import {
Sidebar,
SidebarContent,
SidebarFooter,
SidebarGroup,
SidebarGroupContent,
SidebarHeader,
SidebarMenu,
SidebarMenuButton,
SidebarMenuItem,
SidebarMenuSub,
SidebarMenuSubButton,
SidebarMenuSubItem,
useSidebar,
} from "@/components/ui/sidebar"
import {
DropdownMenu,
DropdownMenuContent,
DropdownMenuItem,
DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const menuItems = [
{
title: "Dashboard",
icon: LayoutDashboard,
url: "/dashboard",
},
{
title: "Base Template",
icon: FileText,
url: "/templates",
},
{
title: "Certificate Mapping",
icon: Map,
url: "/certificate-mapping",
},
{
title: "Generate Certificate",
icon: FilePlus,
items: [
    { title: "Course", icon: GraduationCap, url: "/generate/course" },
    { title: "Webinar", icon: Video, url: "/generate/webinar" },
    { title: "Workshop", icon: Briefcase, url: "/generate/workshop" },
],
},
{
title: "Issued Certificates",
icon: Award,
url: "/certificates",
},
{
    title: "Account Management",
    icon: UserCog,
    url: "/account-management",
},
{
    title: "Billing",
    icon: CreditCard,
    url: "/billing",
},
]

export function AppSidebar() {
const pathname = usePathname()
const { isMobile, setOpenMobile } = useSidebar()
const [isProfileOpen, setIsProfileOpen] = React.useState(false)
const { logout, user } = useAuth()
const { permissions } = useRoleAccess()

const handleMobileClick = () => {
  if (isMobile) {
    setTimeout(() => setOpenMobile(false), 150)
  }
}

// Filter menu items based on role permissions
const filteredMenuItems = menuItems.filter((item) => {
  if (item.title === "Billing" && !permissions.canAccessBilling) {
    return false
  }
  return true
})

// Check if we're currently on a submenu page to determine initial state
const getInitialOpenSubmenu = () => {
  const activeMenuItem = filteredMenuItems.find((item) =>
    item.items?.some((subItem) => pathname === subItem.url)
  )
  return activeMenuItem ? activeMenuItem.title : null
}

const [openSubmenu, setOpenSubmenu] = React.useState<string | null>(getInitialOpenSubmenu)

// Update open submenu when pathname changes
React.useEffect(() => {
  const activeMenuItem = filteredMenuItems.find((item) =>
    item.items?.some((subItem) => pathname === subItem.url)
  )
  if (activeMenuItem) {
    setOpenSubmenu(activeMenuItem.title)
  } else {
    setOpenSubmenu(null)
  }
}, [pathname])

return (
<Sidebar className="relative bg-zinc-900 **:font-heading [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] after:absolute after:top-0 after:right-0 after:w-px after:h-full after:bg-zinc-900 after:z-50" style={{ backgroundColor: '#101213' }}>
    <SidebarHeader className="border-b border-white/10 p-3 md:p-4" style={{ backgroundColor: '#101213' }}>
    <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-brand-primary">
        <Award className="h-5 w-5 md:h-6 md:w-6 text-white" />
        </div>
        <div>
        <h2 className="text-lg md:text-xl font-bold text-white">CertGen</h2>
        <p className="text-xs md:text-sm text-white/60">Certificate Generator</p>
        </div>
    </div>
    </SidebarHeader>

    <SidebarContent className="px-2 py-3 md:py-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" style={{ backgroundColor: '#101213' }}>
    <SidebarGroup>
        <SidebarGroupContent>
        <SidebarMenu className="gap-3 md:gap-4">
            {filteredMenuItems.map((item) => {
            const isActive = pathname === item.url
            const hasSubmenu = item.items && item.items.length > 0

            if (hasSubmenu) {
                const isSubmenuOpen = openSubmenu === item.title

                return (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                    onClick={() =>
                        setOpenSubmenu(isSubmenuOpen ? null : item.title)
                    }
                    className="h-12.5 text-[17px] font-medium tracking-[0.3px] leading-none text-white/80 hover:scale-[1.01] transition-transform rounded-2xl"
                    >
                    <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="whitespace-nowrap text-[17px]">{item.title}</span>
                    <ChevronRight
                        className={`ml-auto h-3 w-3 md:h-4 md:w-4 transition-transform ${
                        isSubmenuOpen ? "rotate-90" : ""
                        }`}
                    />
                    </SidebarMenuButton>
                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isSubmenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                    >
                    <SidebarMenuSub className="gap-2 md:gap-3 mt-1 md:mt-2">
                        {item.items?.map((subItem) => {
                        const isSubActive = pathname === subItem.url
                        return (
                            <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                                asChild
                                className={`h-12.5 text-[17px] font-medium tracking-[0.3px] leading-none text-white/70 hover:scale-[1.01] transition-transform rounded-2xl ${
                                isSubActive
                                    ? "bg-brand-primary font-semibold"
                                    : ""
                                }`}
                                style={isSubActive ? { color: '#101213' } : {}}
                            >
                                <Link href={subItem.url} onClick={handleMobileClick}>
                                <subItem.icon className="h-3 w-3 md:h-4 md:w-4" />
                                <span className="text-[17px]">{subItem.title}</span>
                                </Link>
                            </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                        )
                        })}
                    </SidebarMenuSub>
                    </div>
                </SidebarMenuItem>
                )
            }

            return (
                <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild
                    className={`h-12.5 text-[17px] font-medium tracking-[0.3px] leading-none text-white/80 hover:scale-[1.01] transition-transform rounded-2xl ${
                    isActive ? "bg-brand-primary font-semibold" : ""
                    }`}
                    style={isActive ? { color: '#101213' } : {}}
                >
                    <Link href={item.url || "/"} onClick={handleMobileClick}>
                    <item.icon className="h-4 w-4 md:h-5 md:w-5" />
                    <span className="text-[17px]">{item.title}</span>
                    </Link>
                </SidebarMenuButton>
                </SidebarMenuItem>
            )
            })}
        </SidebarMenu>
        </SidebarGroupContent>
    </SidebarGroup>
    </SidebarContent>

    <SidebarFooter className="border-t border-white/10 p-1.5 md:p-2" style={{ backgroundColor: '#101213' }}>
    <SidebarMenu>
        <SidebarMenuItem>
        <DropdownMenu onOpenChange={setIsProfileOpen}>
            <DropdownMenuTrigger asChild>
            <SidebarMenuButton 
              className="text-white/80 hover:scale-[1.02] transition-transform"
              suppressHydrationWarning
            >
                <div className="flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full bg-brand-primary">
                <User className="h-3 w-3 md:h-4 md:w-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                <span className="text-xs md:text-sm font-medium text-white">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="text-[10px] md:text-xs text-white/60">
                  {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User'}
                </span>
                </div>
                {isProfileOpen ? (
                  <ChevronUp className="ml-auto h-3 w-3 md:h-4 md:w-4 transition-transform" />
                ) : (
                  <ChevronRight className="ml-auto h-3 w-3 md:h-4 md:w-4 transition-transform" />
                )}
            </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
            side="top"
            className="w-48 md:w-56 bg-surface-sidebar border-2 border-white/20 shadow-2xl text-white"
            >
            <DropdownMenuItem className="cursor-pointer hover:bg-brand-primary-hover focus:bg-brand-primary-hover text-white text-sm">
                <User className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span>Account</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer text-red-400 hover:bg-red-900/20 hover:text-red-300 focus:bg-red-900/20 focus:text-red-300 text-sm" onClick={logout}>
                <LogOut className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                <span>Logout</span>
            </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        </SidebarMenuItem>
    </SidebarMenu>
    </SidebarFooter>
</Sidebar>
)
}
