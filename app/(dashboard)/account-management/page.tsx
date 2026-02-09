"use client"

import { useAuth } from "@/lib/auth"
import { useState, useEffect } from "react"
import {
Building2,
Shield,
Bell,
BarChart3,
Users,
AlertTriangle,
Lock,
LogOut,
Mail,
Calendar,
Trash2,
Settings,
Loader2,
ArrowRight,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import { getOrganizationProfile, updateOrganizationProfile, changePassword } from "@/lib/api/account"
import { getDashboardInsights, type DashboardInsightsData } from "@/lib/api/certificates"
import { getTeamMembers } from "@/lib/api/team"
import { API_CONFIG, STORAGE_KEYS } from "@/lib/api/config"

// Toggle component with disabled state support
const Toggle = ({ checked, onChange, disabled = false }: { checked: boolean; onChange: (val: boolean) => void; disabled?: boolean }) => (
<button
type="button"
role="switch"
aria-checked={checked}
onClick={() => !disabled && onChange(!checked)}
disabled={disabled}
className={`
  relative inline-flex h-6 w-11 items-center rounded-full transition-colors
  ${checked ? "bg-brand-primary" : "bg-gray-200"}
  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
`}
>
<span
className={`
    inline-block h-4 w-4 transform rounded-full bg-white transition-transform
    ${checked ? "translate-x-6" : "translate-x-1"}
`}
/>
</button>
)

export default function AccountManagementPage() {
const { user, plan } = useAuth()
const router = useRouter()

// Organization Profile state
const [isLoadingProfile, setIsLoadingProfile] = useState(true)
const [orgName, setOrgName] = useState("")
const [adminEmail, setAdminEmail] = useState("")
const [isSavingProfile, setIsSavingProfile] = useState(false)

// Change Password Modal state
const [passwordModalOpen, setPasswordModalOpen] = useState(false)
const [currentPassword, setCurrentPassword] = useState("")
const [newPassword, setNewPassword] = useState("")
const [isChangingPassword, setIsChangingPassword] = useState(false)
const [passwordError, setPasswordError] = useState("")

// Other state
const [notifCertGenerated, setNotifCertGenerated] = useState(true)
const [notifCertFailed, setNotifCertFailed] = useState(true)
const [notifUsageLimit, setNotifUsageLimit] = useState(false)

// Delete modal state
const [deleteModalOpen, setDeleteModalOpen] = useState(false)
const [deleteStep, setDeleteStep] = useState<'warning' | 'confirm' | 'deleting'>('warning')
const [deleteConfirmed, setDeleteConfirmed] = useState(false)
const [deleteError, setDeleteError] = useState('')

// Usage insights state
const [insights, setInsights] = useState<DashboardInsightsData | null>(null)
const [isLoadingInsights, setIsLoadingInsights] = useState(true)

// Team members state
const [totalMembers, setTotalMembers] = useState<number>(0)
const [isLoadingTeamMembers, setIsLoadingTeamMembers] = useState(true)

// Static mock data
const mockData = {
lastPasswordUpdate: "December 15, 2024",
}

// Format role for display
const formatRole = (role: string) => {
return role.charAt(0).toUpperCase() + role.slice(1)
}

// Fetch organization profile and insights on mount
useEffect(() => {
const fetchProfile = async () => {
try {
const response = await getOrganizationProfile()
setOrgName(response.data.organization_name)
setAdminEmail(response.data.admin_email)
} catch (error) {
toast.error(error instanceof Error ? error.message : "Failed to load organization profile")
} finally {
setIsLoadingProfile(false)
}
}

const fetchInsights = async () => {
try {
const response = await getDashboardInsights()
setInsights(response.data)
} catch (error) {
toast.error(error instanceof Error ? error.message : "Failed to load usage data")
} finally {
setIsLoadingInsights(false)
}
}

const fetchTeamMembers = async () => {
try {
const response = await getTeamMembers()
if (response.data && typeof response.data.total_members === 'number') {
setTotalMembers(response.data.total_members)
}
} catch (error) {
// Silently fail - this is not critical
setTotalMembers(0)
} finally {
setIsLoadingTeamMembers(false)
}
}

fetchProfile()
fetchInsights()
fetchTeamMembers()
}, [])

// Handle profile update
const handleUpdateProfile = async () => {
if (!orgName.trim()) {
toast.error("Organization name is required")
return
}

setIsSavingProfile(true)
try {
await updateOrganizationProfile({
organization_name: orgName,
admin_email: adminEmail,
})
toast.success("Organization profile updated successfully")
} catch (error) {
toast.error(error instanceof Error ? error.message : "Failed to update profile")
} finally {
setIsSavingProfile(false)
}
}

// Handle password change
const handleChangePassword = async () => {
setPasswordError("")

if (!currentPassword.trim()) {
setPasswordError("Current password is required")
return
}

if (!newPassword.trim()) {
setPasswordError("New password is required")
return
}

setIsChangingPassword(true)
try {
await changePassword({
current_password: currentPassword,
new_password: newPassword,
})
toast.success("Password updated successfully")
setPasswordModalOpen(false)
setCurrentPassword("")
setNewPassword("")
setPasswordError("")
} catch (error) {
setPasswordError(error instanceof Error ? error.message : "Failed to change password")
} finally {
setIsChangingPassword(false)
}
}

// Handle delete modal open
const handleOpenDeleteModal = () => {
setDeleteModalOpen(true)
setDeleteStep('warning')
setDeleteConfirmed(false)
setDeleteError('')
}

// Handle delete modal close
const handleCloseDeleteModal = () => {
if (deleteStep === 'deleting') return // Prevent closing during deletion
setDeleteModalOpen(false)
setDeleteStep('warning')
setDeleteConfirmed(false)
setDeleteError('')
}

// Handle continue to confirmation step
const handleContinueToConfirm = () => {
setDeleteStep('confirm')
setDeleteConfirmed(false)
setDeleteError('')
}

// Handle delete organization
const handleDeleteOrganization = async () => {
if (!deleteConfirmed) return

setDeleteStep('deleting')
setDeleteError('')

try {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN)

if (!token) {
throw new Error('No authentication token found')
}

const response = await fetch(
`${API_CONFIG.BASE_URL}/api/account/organization`,
{
method: 'DELETE',
headers: {
'Authorization': `Bearer ${token}`,
'Content-Type': 'application/json',
'x-confirm-delete': 'true',
},
}
)

const data = await response.json()

if (!response.ok) {
throw new Error(data.message || 'Failed to delete organization')
}

// SUCCESS: Clear all client-side data
if (typeof window !== 'undefined') {
localStorage.clear()
sessionStorage.clear()
}

// Show farewell message
toast.success('Your organization has been permanently deleted. Thank you for using CertGen.')

// Force redirect to homepage
setTimeout(() => {
window.location.href = '/'
}, 1500)

} catch (error) {
setDeleteError(error instanceof Error ? error.message : 'Something went wrong while deleting your organization. Please try again.')
setDeleteStep('confirm') // Go back to confirm step
setDeleteConfirmed(false) // Reset checkbox
}
}

return (
<div className="max-w-4xl mx-auto p-6 space-y-8">
{/* Page Header */}
<div className="space-y-2">
<h1 className="text-3xl font-bold text-foreground">Account Management</h1>
<p className="text-muted-foreground">
    Manage your organization settings, security, and preferences
</p>
</div>

{/* Free Plan Upgrade Banner */}
{plan?.name === "free" && (
<div 
className="flex items-center justify-between gap-4 p-4 rounded-xl transition-all duration-200 hover:shadow-md"
style={{
    backgroundColor: 'rgba(37, 150, 190, 0.05)',
    border: '1px solid rgba(37, 150, 190, 0.15)',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.04)'
}}
>
<div className="flex items-start gap-3 flex-1">
    {/* Info Icon */}
    <div className="shrink-0 mt-0.5">
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--color-brand-primary)' }}>
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
    </div>
    
    {/* Text Content */}
    <div className="space-y-0.5">
    <p className="text-sm font-semibold text-gray-800">
        You are currently on the Free plan
    </p>
    <p className="text-xs text-gray-600">
        Upgrade anytime to unlock higher certificate limits and email delivery.
    </p>
    </div>
</div>

{/* Upgrade Button */}
<button
    onClick={() => window.location.href = '/pricing'}
    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white rounded-lg transition-all duration-200 whitespace-nowrap"
    style={{
    backgroundColor: 'var(--color-brand-primary)',
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}
    onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)'
    e.currentTarget.style.transform = 'translateY(-1px)'
    e.currentTarget.style.boxShadow = '0 2px 4px 0 rgba(0, 0, 0, 0.08)'
    }}
    onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)'
    e.currentTarget.style.transform = 'translateY(0)'
    e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    }}
>
    Upgrade plan →
</button>
</div>
)}

<Separator />

{/* 1️⃣ ORGANIZATION PROFILE */}
<section data-section="organization-profile" className="bg-card border border-border rounded-lg p-6 space-y-6">
<div className="flex items-center gap-3">
    <div className="p-2 bg-blue-50 rounded-lg">
    <Building2 className="w-5 h-5 text-blue-600" />
    </div>
    <div>
    <h2 className="text-xl font-semibold text-foreground">Organization Profile</h2>
    <p className="text-sm text-muted-foreground">Basic information about your organization</p>
    </div>
</div>

<div className="space-y-4">
    <div className="grid gap-2">
    <label className="text-sm font-medium text-foreground">Organization Name</label>
    {isLoadingProfile ? (
        <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    ) : (
        <Input 
        value={orgName}
        onChange={(e) => setOrgName(e.target.value)}
        placeholder="Your organization name"
        disabled={user?.role === "member"}
        className={`border-2 border-gray-200 focus:border-brand-primary ${user?.role === "member" ? "bg-muted cursor-not-allowed" : ""}`}
        />
    )}
    <p className="text-xs text-muted-foreground">{user?.role === "member" ? "Only organization owners can edit this field" : "This name appears on certificates and emails"}</p>
    </div>

    <div className="grid gap-2">
    <label className="text-sm font-medium text-foreground">Admin Email</label>
    {isLoadingProfile ? (
        <Skeleton className="h-10 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
    ) : (
        <Input 
        value={adminEmail}
        onChange={(e) => setAdminEmail(e.target.value)}
        placeholder="admin@example.com"
        type="email"
        disabled={user?.role === "member"}
        className={`border-2 border-gray-200 focus:border-brand-primary ${user?.role === "member" ? "bg-muted cursor-not-allowed" : ""}`}
        />
    )}
    <p className="text-xs text-muted-foreground">{user?.role === "member" ? "Only organization owners can edit this field" : "Primary contact for this organization"}</p>
    </div>

    {user?.role !== "member" && (
    <div className="pt-2">
    <Button 
        disabled={isLoadingProfile || isSavingProfile} 
        onClick={handleUpdateProfile}
        className="w-full sm:w-auto border-2 border-gray-200 hover:border-brand-primary"
    >
        {isSavingProfile ? (
        <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Saving...
        </>
        ) : (
        "Save Changes"
        )}
    </Button>
    </div>
    )}
</div>
</section>

{/* 2️⃣ ACCOUNT SECURITY */}
<section data-section="account-security" className="bg-card border border-border rounded-lg p-6 space-y-6">
<div className="flex items-center gap-3">
    <div className="p-2 bg-green-50 rounded-lg">
    <Shield className="w-5 h-5 text-green-600" />
    </div>
    <div>
    <h2 className="text-xl font-semibold text-foreground">Account Security</h2>
    <p className="text-sm text-muted-foreground">Manage your password and security settings</p>
    </div>
</div>

<div className="space-y-4">
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="space-y-1">
        <div className="flex items-center gap-2">
        <Lock className="w-4 h-4 text-muted-foreground" />
        <p className="font-medium text-foreground">Password</p>
        </div>
        <p className="text-sm text-muted-foreground">Secure your account with a strong password</p>
    </div>
    <Button 
        variant="outline" 
        size="sm"
        onClick={() => setPasswordModalOpen(true)}
        className="border-2 border-gray-200 hover:border-brand-primary"
    >
        Change Password
    </Button>
    </div>
</div>
</section>

{/* 3️⃣ NOTIFICATION SETTINGS */}
<section className="bg-card border border-border rounded-lg p-6 space-y-6">
<div className="flex items-center gap-3">
    <div className="p-2 bg-orange-50 rounded-lg">
    <Bell className="w-5 h-5 text-orange-600" />
    </div>
    <div>
    <h2 className="text-xl font-semibold text-foreground">Notification Settings</h2>
    <p className="text-sm text-muted-foreground">Choose which email notifications you receive</p>
    </div>
</div>

<div className="space-y-4">
    {user?.role === "member" && (
      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-700">Members can view notification settings but cannot modify them. Contact your organization owner to make changes.</p>
      </div>
    )}
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="space-y-1">
        <div className="flex items-center gap-2">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <p className="font-medium text-foreground">Certificate Generated</p>
        </div>
        <p className="text-sm text-muted-foreground">Receive confirmation when a certificate is created</p>
    </div>
    <Toggle checked={notifCertGenerated} onChange={setNotifCertGenerated} disabled={user?.role === "member"} />
    </div>

    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="space-y-1">
        <div className="flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
        <p className="font-medium text-foreground">Certificate Failed</p>
        </div>
        <p className="text-sm text-muted-foreground">Get notified when certificate generation fails</p>
    </div>
    <Toggle checked={notifCertFailed} onChange={setNotifCertFailed} disabled={user?.role === "member"} />
    </div>

    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div className="space-y-1">
        <div className="flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-muted-foreground" />
        <p className="font-medium text-foreground">Usage Near Limit</p>
        </div>
        <p className="text-sm text-muted-foreground">Alert when approaching monthly certificate limit</p>
    </div>
    <Toggle checked={notifUsageLimit} onChange={setNotifUsageLimit} disabled={user?.role === "member"} />
    </div>
</div>
</section>

{/* 5️⃣ USAGE SUMMARY */}
<section className="bg-card border border-border rounded-lg p-6 space-y-6">
<div className="flex items-center gap-3">
    <div className="p-2 bg-cyan-50 rounded-lg">
    <BarChart3 className="w-5 h-5 text-cyan-600" />
    </div>
    <div>
    <h2 className="text-xl font-semibold text-foreground">Usage Summary</h2>
    <p className="text-sm text-muted-foreground">Your current certificate usage this month</p>
    </div>
</div>

<div className="space-y-4">
    {isLoadingInsights ? (
      <div className="space-y-4">
        <div className="grid sm:grid-cols-3 gap-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    ) : insights ? (
      <>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{insights.monthly_certificates_used}</p>
            <p className="text-xs text-muted-foreground mt-1">Used</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{insights.monthly_certificate_limit}</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
          </div>
          <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{insights.remaining_monthly_limit}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">
              {Math.round((insights.monthly_certificates_used / insights.monthly_certificate_limit) * 100)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5">
            <div
              className="bg-brand-primary h-2.5 rounded-full transition-all"
              style={{ width: `${(insights.monthly_certificates_used / insights.monthly_certificate_limit) * 100}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Resets on {new Date(insights.billing_cycle.resets_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </div>
      </>
    ) : (
      <p className="text-center text-muted-foreground">Failed to load usage data</p>
    )}

    <Separator />

    {user?.role !== "member" && (
    <Button 
      variant="outline" 
      className="w-full sm:w-auto border-2 border-gray-200 hover:border-brand-primary"
      onClick={() => router.push('/billing')}
    >
      View Billing Details →
    </Button>
    )}
</div>
</section>

{/* 6️⃣ TEAM & ACCESS SUMMARY */}
<section data-section="team-access" className="bg-card border border-border rounded-lg p-6 space-y-6">
<div className="flex items-center gap-3">
    <div className="p-2 bg-indigo-50 rounded-lg">
    <Users className="w-5 h-5 text-indigo-600" />
    </div>
    <div>
    <h2 className="text-xl font-semibold text-foreground">Team & Access</h2>
    <p className="text-sm text-muted-foreground">Manage team members and permissions</p>
    </div>
</div>

<div className="space-y-4">
    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div>
        <p className="font-medium text-foreground">Your Role</p>
        <p className="text-sm text-muted-foreground">
        {user?.role === "owner" ? "Full administrative access" : "Standard member access"}
        </p>
    </div>
    <Badge>{user?.role ? formatRole(user.role) : "Loading..."}</Badge>
    </div>

    <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
    <div>
        <p className="font-medium text-foreground">Active Team Members</p>
        <p className="text-sm text-muted-foreground">Users in your organization</p>
    </div>
    {isLoadingTeamMembers ? (
        <Skeleton className="h-8 w-12" />
    ) : (
        <span className="text-2xl font-bold text-foreground">{totalMembers}</span>
    )}
    </div>

    {user?.role === "owner" && (
    <div className="pt-2">
        <Button 
        variant="outline"
        className="w-full sm:w-auto border-2 border-gray-200 hover:border-brand-primary"
        onClick={() => router.push("/manage-team")}
        >
        <Settings className="w-4 h-4 mr-2" />
        Manage Team
        <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
    </div>
    )}
</div>
</section>

{/* 7️⃣ DANGER ZONE - Owner Only */}
{user?.role === "owner" && (
<section className="bg-red-50 border-2 border-red-200 rounded-lg p-6 space-y-4">
<div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
    <div className="p-2 bg-red-100 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600" />
    </div>
    <div>
        <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
        <p className="text-sm text-red-700">Irreversible and destructive actions</p>
    </div>
    </div>
    <Button
    variant="outline"
    className="border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
    onClick={handleOpenDeleteModal}
    >
    Delete Organization
    </Button>
</div>
</section>
)}

{/* Change Password Modal */}
<Dialog open={passwordModalOpen} onOpenChange={(open) => {
    setPasswordModalOpen(open)
    if (!open) {
    setCurrentPassword("")
    setNewPassword("")
    setPasswordError("")
    }
}}>
<DialogContent>
    <DialogHeader>
    <DialogTitle className="flex items-center gap-2">
        <Lock className="w-5 h-5" />
        Change Password
    </DialogTitle>
    <DialogDescription>
        Enter your current password and a new password to update your account security.
    </DialogDescription>
    </DialogHeader>
    
    <div className="space-y-4 py-4">
    {passwordError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600">{passwordError}</p>
        </div>
    )}

    <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Current Password</label>
        <Input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder="Enter current password"
        disabled={isChangingPassword}
        />
    </div>

    <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">New Password</label>
        <Input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder="Enter new password"
        disabled={isChangingPassword}
        />
    </div>
    </div>

    <DialogFooter className="gap-2">
    <Button 
        variant="outline" 
        onClick={() => setPasswordModalOpen(false)}
        disabled={isChangingPassword}
    >
        Cancel
    </Button>
    <Button 
        onClick={handleChangePassword}
        disabled={isChangingPassword}
    >
        {isChangingPassword ? (
        <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Updating...
        </>
        ) : (
        "Update Password"
        )}
    </Button>
    </DialogFooter>
</DialogContent>
</Dialog>

{/* Delete Organization Modal - Multi-Step Flow */}
<Dialog open={deleteModalOpen} onOpenChange={handleCloseDeleteModal}>
<DialogContent className="sm:max-w-125" onPointerDownOutside={(e) => deleteStep === 'deleting' && e.preventDefault()}>
    {deleteStep === 'warning' && (
    <>
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
            <AlertTriangle className="w-6 h-6" />
            Delete Organization?
        </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-4">
        <p className="text-base font-medium text-foreground">
            This action is permanent and cannot be undone.
        </p>
        <div className="space-y-2">
            <p className="text-sm text-muted-foreground">The following will be permanently deleted:</p>
            <ul className="text-sm text-muted-foreground space-y-2 ml-4 list-disc">
            <li>All certificates and certificate data</li>
            <li>Base certificate templates</li>
            <li>All mappings and configurations</li>
            <li>User accounts and team members</li>
            <li>Billing information and history</li>
            </ul>
        </div>
        </div>
        <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={handleCloseDeleteModal} className="w-full sm:w-auto">
            Cancel
        </Button>
        <Button 
            variant="outline" 
            className="w-full sm:w-auto border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={handleContinueToConfirm}
        >
            Continue
        </Button>
        </DialogFooter>
    </>
    )}

    {deleteStep === 'confirm' && (
    <>
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
            <AlertTriangle className="w-6 h-6" />
            Final Confirmation
        </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
        {deleteError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{deleteError}</p>
            </div>
        )}

        <div className="flex items-start space-x-3">
            <Checkbox 
            id="confirm-delete" 
            checked={deleteConfirmed}
            onCheckedChange={(checked) => setDeleteConfirmed(checked === true)}
            className="mt-1"
            />
            <label 
            htmlFor="confirm-delete" 
            className="text-sm font-medium leading-relaxed cursor-pointer select-none"
            >
            I understand this action is permanent and cannot be undone.
            </label>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
            This will permanently delete your organization and all associated data.
            </p>
        </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
        <Button variant="outline" onClick={handleCloseDeleteModal} className="w-full sm:w-auto">
            Cancel
        </Button>
        <Button 
            variant="destructive"
            className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
            onClick={handleDeleteOrganization}
            disabled={!deleteConfirmed}
        >
            Delete Forever
        </Button>
        </DialogFooter>
    </>
    )}

    {deleteStep === 'deleting' && (
    <>
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600 text-xl">
            <Loader2 className="w-6 h-6 animate-spin" />
            Deleting Organization
        </DialogTitle>
        </DialogHeader>
        
        <div className="py-8 text-center space-y-4">
        <div className="flex justify-center">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
        </div>
        <div className="space-y-2">
            <p className="text-base font-medium text-foreground">
            Deleting your organization...
            </p>
            <p className="text-sm text-muted-foreground">
            This may take a few moments.
            </p>
        </div>
        </div>
    </>
    )}
</DialogContent>
</Dialog>
</div>
)
}
