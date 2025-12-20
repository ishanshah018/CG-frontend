"use client"

import { usePathname } from "next/navigation"
import { ChevronRight } from "lucide-react"

export function Breadcrumb() {
const pathname = usePathname()

// Map paths to readable names
const pathMap: Record<string, string> = {
"dashboard": "Dashboard",
"templates": "Base Template",
"generate": "Generate Certificate",
"course": "Course",
"webinar": "Webinar",
"workshop": "Workshop",
"certificates": "Issued Certificates",
"settings": "Settings",
"billing": "Billing",
}

// Split pathname and filter empty strings
const segments = pathname.split("/").filter(Boolean)

// If on home page
if (segments.length === 0) {
return <span className="text-text-primary font-medium">Dashboard</span>
}

// Build breadcrumb items
const breadcrumbItems = segments.map((segment) => pathMap[segment] || segment)

return (
<div className="flex items-center gap-2 text-text-primary">
    {breadcrumbItems.map((item, index) => (
    <div key={index} className="flex items-center gap-2">
        {index > 0 && <ChevronRight className="size-4 text-text-tertiary" />}
        <span className={index === breadcrumbItems.length - 1 ? "font-medium" : "text-text-secondary"}>
        {item}
        </span>
    </div>
    ))}
</div>
)
}
