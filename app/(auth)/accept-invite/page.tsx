"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Image from "next/image"
import { toast } from "sonner"
import { Loader2, CheckCircle, XCircle, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyInviteToken, acceptInvitation } from "@/lib/api/team"
import { storeAuthData } from "@/lib/api/auth"

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [isVerifying, setIsVerifying] = useState(true)
  const [isValid, setIsValid] = useState(false)
  const [organizationName, setOrganizationName] = useState("")
  const [email, setEmail] = useState("")
  const [verifyError, setVerifyError] = useState("")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isAccepting, setIsAccepting] = useState(false)
  const [acceptError, setAcceptError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Password validation state
  const [passwordValidation, setPasswordValidation] = useState({
    minLength: false,
    hasLowerCase: false,
    hasUpperCase: false,
    hasNumber: false,
  })

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setVerifyError("No invitation token found")
      setIsVerifying(false)
      return
    }

    const verifyToken = async () => {
      try {
        const response = await verifyInviteToken(token)
        setIsValid(true)
        setOrganizationName(response.data.organization_name)
        setEmail(response.data.email)
      } catch (error) {
        setVerifyError(error instanceof Error ? error.message : "Invalid or expired invitation")
        setIsValid(false)
      } finally {
        setIsVerifying(false)
      }
    }

    verifyToken()
  }, [token])

  const validatePassword = (pass: string): string | null => {
    if (pass.length < 8) {
      return "Password must be at least 8 characters"
    }
    if (!/[A-Z]/.test(pass)) {
      return "Password must contain at least one uppercase letter"
    }
    if (!/[a-z]/.test(pass)) {
      return "Password must contain at least one lowercase letter"
    }
    if (!/[0-9]/.test(pass)) {
      return "Password must contain at least one number"
    }
    return null
  }

  const handlePasswordChange = (value: string) => {
    setPassword(value)
    setPasswordValidation({
      minLength: value.length >= 8,
      hasLowerCase: /[a-z]/.test(value),
      hasUpperCase: /[A-Z]/.test(value),
      hasNumber: /[0-9]/.test(value),
    })
  }

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setAcceptError("")

    // Validate password
    const passwordError = validatePassword(password)
    if (passwordError) {
      setAcceptError(passwordError)
      return
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setAcceptError("Passwords do not match")
      return
    }

    if (!token) {
      setAcceptError("No invitation token found")
      return
    }

    setIsAccepting(true)
    try {
      const response = await acceptInvitation({ token, password })
      
      // Backend returns: { success, message, token, user }
      // Extract token (backend uses 'token' field)
      const authToken = response.data.token || response.data.access_token
      
      if (!authToken) {
        throw new Error("No authentication token received from server")
      }
      
      // Map to format expected by storeAuthData: { access_token, user }
      storeAuthData({
        access_token: authToken,
        user: response.data.user,
        organization: response.data.organization,
        plan: response.data.plan,
      })
      
      // Show success message
      toast.success("Welcome to the team! Redirecting to dashboard...")
      
      // Redirect to dashboard - use window.location.href to force full reload
      setTimeout(() => {
        window.location.href = "/dashboard"
      }, 1000)
    } catch (error) {
      setAcceptError(error instanceof Error ? error.message : "Failed to accept invitation")
    } finally {
      setIsAccepting(false)
    }
  }

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-brand-primary mx-auto" />
          <p className="text-lg font-medium text-foreground">Verifying invitation...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (!isValid || verifyError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
        <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg border border-border">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircle className="w-12 h-12 text-red-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Invalid Invitation</h1>
            <p className="text-muted-foreground">
              {verifyError || "This invitation link is invalid or has expired."}
            </p>
            <Button
              onClick={() => router.push("/")}
              className="w-full"
            >
              Go to Homepage
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Accept form
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
      {/* LEFT SIDE - Accept Form */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-110 bg-white rounded-2xl shadow-lg p-8 lg:p-10">
          {/* Heading */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You&apos;re Invited!
            </h1>
            <p className="text-sm text-gray-500">
              Join <span className="font-semibold">{organizationName}</span> on CertGen
            </p>
          </div>

          {/* Accept Form */}
          <form onSubmit={handleAcceptInvite} className="space-y-5">
            {acceptError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600">{acceptError}</p>
              </div>
            )}

            {/* Email (read-only) */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                disabled
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  disabled={isAccepting}
                  className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>

              {/* Password Validation */}
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-[9px] sm:text-[10px] md:text-xs mt-2">
                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.minLength ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>8 chars</span>
                </div>
                
                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.hasLowerCase ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Lowercase</span>
                </div>
                
                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.hasUpperCase ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Uppercase</span>
                </div>
                
                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.hasNumber ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Number</span>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isAccepting}
                  className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                    </svg>
                  ) : (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isAccepting}
              className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAccepting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Accepting Invitation...</span>
                </>
              ) : (
                "Accept Invitation"
              )}
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT SIDE - Illustration (Hidden on mobile) */}
      <div className="hidden lg:flex flex-1 items-center justify-center p-12">
        <Image
          src="/auth_image.webp"
          alt="Authentication illustration"
          width={800}
          height={600}
          className="w-full max-w-200 h-auto mt-8"
          draggable={false}
          onDragStart={(e) => e.preventDefault()}
          style={{ userSelect: 'none' }}
        />
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
        <Loader2 className="w-12 h-12 animate-spin text-brand-primary" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  )
}
