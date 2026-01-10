"use client"

import { useAuth } from "@/lib/auth"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
Users,
Mail,
Trash2,
Loader2,
AlertTriangle,
UserPlus,
ArrowLeft,
} from "lucide-react"
import Loader from "@/components/loader"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Separator } from "@/components/ui/separator"
import {
Dialog,
DialogContent,
DialogDescription,
DialogFooter,
DialogHeader,
DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
inviteTeamMember,
getPendingInvitations,
getTeamMembers,
removeTeamMember,
type TeamMember,
type PendingInvitation,
} from "@/lib/api/team"

export default function ManageTeamPage() {
const { user, plan } = useAuth()
const router = useRouter()

// State
const [inviteEmail, setInviteEmail] = useState("")
const [isSendingInvite, setIsSendingInvite] = useState(false)
const [inviteError, setInviteError] = useState("")

const [invitations, setInvitations] = useState<PendingInvitation[]>([])
const [isLoadingInvitations, setIsLoadingInvitations] = useState(true)

const [members, setMembers] = useState<TeamMember[]>([])
const [isLoadingMembers, setIsLoadingMembers] = useState(true)

const [removeDialogOpen, setRemoveDialogOpen] = useState(false)
const [memberToRemove, setMemberToRemove] = useState<TeamMember | null>(null)
const [isRemoving, setIsRemoving] = useState(false)

// Access control - redirect if not owner
useEffect(() => {
if (user && user.role !== "owner") {
    toast.error("You don't have permission to manage team members")
    router.replace("/dashboard")
}
}, [user, router])

// Fetch invitations and members on mount
useEffect(() => {
if (user?.role === "owner") {
    fetchInvitations()
    fetchMembers()
}
}, [user])

const fetchInvitations = async () => {
    try {
      const response = await getPendingInvitations()
      console.log('Invitations API Response:', response)
      
      // Handle different response structures
      let invitationsData: PendingInvitation[] = []
      if (Array.isArray(response.data)) {
        invitationsData = response.data
      } else if (response.data && typeof response.data === 'object') {
        // If data is an object, check if it has an invitations property
        const dataObj = response.data as any
        if (Array.isArray(dataObj.invitations)) {
          invitationsData = dataObj.invitations
        }
      }
      
      console.log('Processed invitations:', invitationsData)
      setInvitations(invitationsData)
    } catch (error) {
      console.error('Failed to fetch invitations:', error)
      toast.error(error instanceof Error ? error.message : "Failed to load invitations")
      setInvitations([])
    } finally {
      setTimeout(() => {
        setIsLoadingInvitations(false)
      }, 300)
    }
  }

  const fetchMembers = async () => {
    try {
      const response = await getTeamMembers()
      // Combine owner and members into single array
      const allMembers = response.data.owner ? [response.data.owner, ...response.data.members] : response.data.members
      setMembers(allMembers)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load team members")
      setMembers([])
    } finally {
      setTimeout(() => {
        setIsLoadingMembers(false)
      }, 300)
    }
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError("")

    if (!inviteEmail.trim()) {
      setInviteError("Email address is required")
      return
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inviteEmail)) {
      setInviteError("Please enter a valid email address")
      return
    }

    setIsSendingInvite(true)
    try {
      await inviteTeamMember({ email: inviteEmail })
      toast.success("Invitation sent successfully")
      setInviteEmail("")
      fetchInvitations() // Refresh invitations list
    } catch (error) {
      setInviteError(error instanceof Error ? error.message : "Failed to send invitation")
    } finally {
      setIsSendingInvite(false)
    }
  }

const handleRemoveMember = async () => {
if (!memberToRemove) return

setIsRemoving(true)
try {
    await removeTeamMember(memberToRemove.id)
    toast.success("Team member removed successfully")
    setRemoveDialogOpen(false)
    setMemberToRemove(null)
    fetchMembers() // Refresh members list
} catch (error) {
    toast.error(error instanceof Error ? error.message : "Failed to remove team member")
} finally {
    setIsRemoving(false)
}
}

const openRemoveDialog = (member: TeamMember) => {
setMemberToRemove(member)
setRemoveDialogOpen(true)
}

const getStatusBadge = (status: string) => {
switch (status) {
    case "pending":
    return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
    case "accepted":
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Accepted</Badge>
    case "expired":
    return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Expired</Badge>
    default:
    return <Badge>{status}</Badge>
}
}

const formatDate = (dateString: string) => {
return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
})
}

const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  })
}

// Calculate plan limits
const getPlanLimits = () => {
if (plan?.name === "free") return 1
if (plan?.name === "growth") return 5
if (plan?.name === "scale") return 15
return 1
}

const planLimit = getPlanLimits()
const currentMemberCount = members.length
const isAtLimit = currentMemberCount >= planLimit

// Don't render anything if not owner (will redirect)
if (!user || user.role !== "owner") {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader size="large" />
    </div>
  )
}

return (
  <div className="max-w-6xl mx-auto p-6 space-y-8">
    {/* Page Header */}
    <div className="space-y-2">
    <div className="flex items-center gap-3 mb-2">
        <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/account-management")}
        className="-ml-2 text-muted-foreground hover:text-brand-primary"
        >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back
        </Button>
    </div>
    <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
    <p className="text-muted-foreground">
        Invite and manage your organization members
    </p>
    </div>

    <Separator />

    {/* Invite Team Member */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-4">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-50 rounded-lg">
        <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
        <h2 className="text-xl font-semibold text-foreground">Invite Team Member</h2>
        <p className="text-sm text-muted-foreground">
            Send an invitation to add a new member to your team
        </p>
        </div>
    </div>

    <form onSubmit={handleSendInvite} className="space-y-4">
        <div className="flex gap-3">
        <div className="flex-1 space-y-2">
            <Input
            type="email"
            placeholder="teammate@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            disabled={isSendingInvite || isAtLimit}
            />
            {inviteError && (
            <p className="text-sm text-red-600">{inviteError}</p>
            )}
        </div>
        <Button
            type="submit"
            disabled={isSendingInvite || isAtLimit}
            className="border-2 border-gray-200 hover:border-brand-primary"
        >
            {isSendingInvite ? (
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
            </>
            ) : (
            "Send Invite"
            )}
        </Button>
        </div>

        {isAtLimit && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800">
                Team member limit reached
            </p>
            <p className="text-sm text-yellow-700 mt-1">
                Upgrade your plan to add more members.{" "}
                <button
                type="button"
                onClick={() => router.push("/pricing")}
                className="underline font-medium"
                >
                View pricing
                </button>
            </p>
            </div>
        </div>
        )}
    </form>
    </section>

    {/* Pending Invitations */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-4">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-50 rounded-lg">
        <Mail className="w-5 h-5 text-purple-600" />
        </div>
        <div>
        <h2 className="text-xl font-semibold text-foreground">Pending Invitations</h2>
        <p className="text-sm text-muted-foreground">
            Track sent invitations and their status
        </p>
        </div>
    </div>

    <div className="border border-border rounded-lg overflow-hidden">
        {isLoadingInvitations ? (
        <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <style jsx>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
        </div>
        ) : invitations.filter((invitation) => invitation.status === 'pending').length === 0 ? (
        <div className="text-center p-8">
            <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No pending invitations</p>
            <p className="text-sm text-muted-foreground mt-1">
            Invite team members to get started
            </p>
        </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-muted/50">
                <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Invited At
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Expires At
                </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {invitations.filter((invitation) => invitation.status === 'pending').map((invitation) => (
                <tr key={invitation.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                    {invitation.email}
                    </td>
                    <td className="px-4 py-3">
                    {getStatusBadge(invitation.status)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(invitation.invited_at)}
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatDateTime(invitation.expires_at)}
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        )}
    </div>
    </section>

    {/* Team Members */}
    <section className="bg-card border border-border rounded-lg p-6 space-y-4">
    <div className="flex items-center gap-3">
        <div className="p-2 bg-green-50 rounded-lg">
        <Users className="w-5 h-5 text-green-600" />
        </div>
        <div>
        <h2 className="text-xl font-semibold text-foreground">Team Members</h2>
        <p className="text-sm text-muted-foreground">
            Active members in your organization
        </p>
        </div>
    </div>

    <div className="border border-border rounded-lg overflow-hidden">
        {isLoadingMembers ? (
        <div className="p-4 space-y-3">
            <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <Skeleton className="h-12 w-full bg-gray-200 dark:bg-gray-700" style={{ background: 'linear-gradient(90deg, #e0e0e0 25%, #f0f0f0 50%, #e0e0e0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            <style jsx>{`
              @keyframes shimmer {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
        </div>
        ) : members.length === 0 ? (
        <div className="text-center p-8">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium text-foreground">No team members yet</p>
            <p className="text-sm text-muted-foreground mt-1">
            Start by inviting your first team member
            </p>
        </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full">
            <thead className="bg-muted/50">
                <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Last Login
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                </th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border">
                {members.map((member) => {
                const isCurrentUser = member.email === user?.email
                const isOwner = member.role === "owner"

                return (
                    <tr key={member.id} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                        {member.email}
                        {isCurrentUser && (
                            <Badge variant="outline" className="text-xs">
                            You
                            </Badge>
                        )}
                        </div>
                    </td>
                    <td className="px-4 py-3">
                        <Badge className={isOwner ? "bg-blue-100 text-blue-800 hover:bg-blue-100" : ""}>
                        {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                        </Badge>
                    </td>
                    <td className="px-4 py-3">
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                        {member.last_login_at ? formatDateTime(member.last_login_at) : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                        {!isOwner && !isCurrentUser && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openRemoveDialog(member)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                        )}
                    </td>
                    </tr>
                )
                })}
            </tbody>
            </table>
        </div>
        )}
    </div>
    </section>

    {/* Remove Member Confirmation Dialog */}
    <Dialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
    <DialogContent>
        <DialogHeader>
        <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" />
            Remove Team Member
        </DialogTitle>
        <DialogDescription>
            Are you sure you want to remove this team member? They will lose access
            to the organization immediately.
        </DialogDescription>
        </DialogHeader>

        {memberToRemove && (
        <div className="p-4 bg-muted/50 rounded-lg">
            <p className="text-sm font-medium text-foreground">
            {memberToRemove.email}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
            {memberToRemove.role.charAt(0).toUpperCase() + memberToRemove.role.slice(1)}
            </p>
        </div>
        )}

        <DialogFooter>
        <Button
            variant="outline"
            onClick={() => setRemoveDialogOpen(false)}
            disabled={isRemoving}
        >
            Cancel
        </Button>
        <Button
            variant="destructive"
            onClick={handleRemoveMember}
            disabled={isRemoving}
            className="bg-red-600 hover:bg-red-700"
        >
            {isRemoving ? (
            <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Removing...
            </>
            ) : (
            "Remove Member"
            )}
        </Button>
        </DialogFooter>
    </DialogContent>
    </Dialog>
    </div>
  )
}
