"use client"

import { useAuth } from "@/lib/auth"
import { useState } from "react"
import {
Building2,
Shield,
FileCheck,
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
CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

// Toggle component
const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (val: boolean) => void }) => (
<button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className={`
    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
    ${checked ? "bg-brand-primary" : "bg-gray-200"}
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
const { user, organization } = useAuth()

// State for toggles (static)
const [autoEmailEnabled, setAutoEmailEnabled] = useState(true)
const [notifCertGenerated, setNotifCertGenerated] = useState(true)
const [notifCertFailed, setNotifCertFailed] = useState(true)
const [notifUsageLimit, setNotifUsageLimit] = useState(false)
const [deleteModalOpen, setDeleteModalOpen] = useState(false)

// Static mock data
const mockData = {
orgName: organization?.name || "Acme Corporation",
orgSlug: "acme-corp",
adminEmail: user?.email || "admin@acme.com",
timezone: "America/New_York",
dateFormat: "MM/DD/YYYY",
lastPasswordUpdate: "December 15, 2024",
defaultCertType: "course",
emailSenderName: organization?.name || "Acme Corp",
replyToEmail: user?.email || "noreply@acme.com",
monthlyLimit: 100,
certificatesUsed: 47,
resetDate: "January 1, 2025",
currentRole: "Owner",
teamMembers: 1,
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

    <Separator />

    {/* 1️⃣ ORGANIZATION PROFILE */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-6">
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
        <Input defaultValue={mockData.orgName} placeholder="Your organization name" />
        <p className="text-xs text-muted-foreground">This name appears on certificates and emails</p>
        </div>

        <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Organization Slug</label>
        <Input defaultValue={mockData.orgSlug} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Used in URLs and API references (cannot be changed)</p>
        </div>

        <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Admin Email</label>
        <Input defaultValue={mockData.adminEmail} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground">Primary contact for this organization</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
        <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Timezone</label>
            <Select defaultValue={mockData.timezone}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
            </SelectContent>
            </Select>
        </div>

        <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Date Format</label>
            <Select defaultValue={mockData.dateFormat}>
            <SelectTrigger>
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
            </SelectContent>
            </Select>
        </div>
        </div>

        <div className="pt-2">
        <Button disabled className="w-full sm:w-auto">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Save Changes
        </Button>
        </div>
    </div>
    </section>

    {/* 2️⃣ ACCOUNT SECURITY */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-6">
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
            <p className="text-sm text-muted-foreground">Last updated: {mockData.lastPasswordUpdate}</p>
        </div>
        <Button variant="outline" size="sm">
            Change Password
        </Button>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
            <LogOut className="w-4 h-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Active Sessions</p>
            </div>
            <p className="text-sm text-muted-foreground">Sign out from all devices and browsers</p>
        </div>
        <Button variant="outline" size="sm">
            Logout Everywhere
        </Button>
        </div>

        <Separator />

        <div className="space-y-3">
        <p className="text-sm font-medium text-muted-foreground">Coming Soon</p>
        
        <div className="flex items-center justify-between opacity-50">
            <div className="space-y-1">
            <p className="font-medium text-foreground">Two-Factor Authentication</p>
            <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
        </div>

        <div className="flex items-center justify-between opacity-50">
            <div className="space-y-1">
            <p className="font-medium text-foreground">Session Timeout</p>
            <p className="text-sm text-muted-foreground">Automatically log out after period of inactivity</p>
            </div>
            <Badge variant="outline">Coming Soon</Badge>
        </div>
        </div>
    </div>
    </section>

    {/* 3️⃣ CERTIFICATE PREFERENCES */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-6">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
        <FileCheck className="w-5 h-5 text-purple-600" />
        </div>
        <div>
        <h2 className="text-xl font-semibold text-foreground">Certificate Preferences</h2>
        <p className="text-sm text-muted-foreground">Control how certificates are generated and delivered</p>
        </div>
    </div>

    <div className="space-y-4">
        <div className="grid gap-2">
        <label className="text-sm font-medium text-foreground">Default Certificate Type</label>
        <Select defaultValue={mockData.defaultCertType}>
            <SelectTrigger>
            <SelectValue />
            </SelectTrigger>
            <SelectContent>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="webinar">Webinar</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">Pre-selected type when generating certificates</p>
        </div>

        <Separator />

        <div className="flex items-center justify-between">
        <div className="space-y-1">
            <p className="font-medium text-foreground">Auto-email Certificates</p>
            <p className="text-sm text-muted-foreground">Automatically send certificates after generation</p>
        </div>
        <Toggle checked={autoEmailEnabled} onChange={setAutoEmailEnabled} />
        </div>

        {autoEmailEnabled && (
        <div className="space-y-4 pl-6 border-l-2 border-brand-primary/30">
            <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Email Sender Name</label>
            <Input defaultValue={mockData.emailSenderName} placeholder="Your Organization" />
            <p className="text-xs text-muted-foreground">Appears in the &quot;From&quot; field of certificate emails</p>
            </div>

            <div className="grid gap-2">
            <label className="text-sm font-medium text-foreground">Reply-To Email</label>
            <Input defaultValue={mockData.replyToEmail} placeholder="noreply@example.com" type="email" />
            <p className="text-xs text-muted-foreground">Where replies to certificate emails are sent</p>
            </div>
        </div>
        )}
    </div>
    </section>

    {/* 4️⃣ NOTIFICATION SETTINGS */}
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
        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Certificate Generated</p>
            </div>
            <p className="text-sm text-muted-foreground">Receive confirmation when a certificate is created</p>
        </div>
        <Toggle checked={notifCertGenerated} onChange={setNotifCertGenerated} />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Certificate Failed</p>
            </div>
            <p className="text-sm text-muted-foreground">Get notified when certificate generation fails</p>
        </div>
        <Toggle checked={notifCertFailed} onChange={setNotifCertFailed} />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div className="space-y-1">
            <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <p className="font-medium text-foreground">Usage Near Limit</p>
            </div>
            <p className="text-sm text-muted-foreground">Alert when approaching monthly certificate limit</p>
        </div>
        <Toggle checked={notifUsageLimit} onChange={setNotifUsageLimit} />
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
        <div className="grid sm:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{mockData.certificatesUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">Used</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{mockData.monthlyLimit}</p>
            <p className="text-xs text-muted-foreground mt-1">Monthly Limit</p>
        </div>
        <div className="text-center p-4 bg-muted/30 rounded-lg">
            <p className="text-2xl font-bold text-foreground">{mockData.monthlyLimit - mockData.certificatesUsed}</p>
            <p className="text-xs text-muted-foreground mt-1">Remaining</p>
        </div>
        </div>

        <div className="space-y-2">
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium text-foreground">{Math.round((mockData.certificatesUsed / mockData.monthlyLimit) * 100)}%</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2.5">
            <div
            className="bg-brand-primary h-2.5 rounded-full transition-all"
            style={{ width: `${(mockData.certificatesUsed / mockData.monthlyLimit) * 100}%` }}
            />
        </div>
        <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            Resets on {mockData.resetDate}
        </p>
        </div>

        <Separator />

        <Button variant="outline" className="w-full sm:w-auto">
        View Billing Details →
        </Button>
    </div>
    </section>

    {/* 6️⃣ TEAM & ACCESS */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-6 opacity-60">
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
            <p className="text-sm text-muted-foreground">Full administrative access</p>
        </div>
        <Badge>{mockData.currentRole}</Badge>
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
        <div>
            <p className="font-medium text-foreground">Team Members</p>
            <p className="text-sm text-muted-foreground">Active users in your organization</p>
        </div>
        <span className="text-2xl font-bold text-foreground">{mockData.teamMembers}</span>
        </div>

        <div className="text-center p-6 border-2 border-dashed border-border rounded-lg">
        <Settings className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="font-medium text-foreground mb-1">Team Management Coming Soon</p>
        <p className="text-sm text-muted-foreground">
            Invite team members, assign roles, and manage access control
        </p>
        </div>
    </div>
    </section>

    {/* 7️⃣ DANGER ZONE */}
    <section className="bg-red-50 border-2 border-red-200 rounded-lg p-6 space-y-6">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-red-100 rounded-lg">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        </div>
        <div>
        <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
        <p className="text-sm text-red-700">Irreversible and destructive actions</p>
        </div>
    </div>

    <div className="bg-white border border-red-200 rounded-lg p-6 space-y-4">
        <div className="space-y-2">
        <h3 className="font-semibold text-foreground">Delete Organization</h3>
        <p className="text-sm text-muted-foreground">
            This action is <strong>irreversible</strong> and will permanently delete:
        </p>
        <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
            <li>All certificates and certificate data</li>
            <li>Base certificate templates</li>
            <li>All mappings and configurations</li>
            <li>User accounts and team members</li>
            <li>Billing information and history</li>
        </ul>
        </div>

        <Button
        variant="destructive"
        className="w-full sm:w-auto"
        onClick={() => setDeleteModalOpen(true)}
        >
        <Trash2 className="w-4 h-4 mr-2" />
        Delete Organization
        </Button>
    </div>
    </section>

    {/* Delete Confirmation Modal */}
    <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
    <DialogContent>
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Delete Organization?
        </DialogTitle>
        <DialogDescription className="space-y-3 pt-4">
            <p>
            This action <strong>cannot be undone</strong>. This will permanently delete your organization
            and all associated data.
            </p>
            <p className="text-sm">
            All certificates, templates, and configurations will be lost forever.
            </p>
        </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
        <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
            Cancel
        </Button>
        <Button variant="destructive" disabled>
            I understand, delete everything
        </Button>
        </DialogFooter>
    </DialogContent>
    </Dialog>
</div>
)
}
