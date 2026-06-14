"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import Image from "next/image"
import React from "react"
import dynamic from "next/dynamic"
import { signupUser } from "@/lib/api/auth"
import Loader from "@/components/loader"
import { toast } from "sonner"

// Dynamically import GoogleAuthButton with no SSR
const GoogleAuthButton = dynamic(
  () => import("@/components/auth/GoogleAuthButton"),
  { ssr: false }
)

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    organization_name: "",
    email: "",
    password: "",
  })
  const [emailError, setEmailError] = React.useState("")
  const [emailValid, setEmailValid] = React.useState(false)

  // Email validation
  const validateEmail = (email: string) => {
    if (!email) {
      setEmailError("")
      setEmailValid(false)
      return
    }

    if (!email.includes("@")) {
      setEmailError("Email must contain @")
      setEmailValid(false)
      return
    }

    if (!email.includes(".")) {
      setEmailError("Email must contain a domain (e.g., .com)")
      setEmailValid(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setEmailError("Please enter a valid email address")
      setEmailValid(false)
      return
    }

    setEmailError("")
    setEmailValid(true)
  }

  // Password validation state
  const [passwordValidation, setPasswordValidation] = React.useState({
    minLength: false,
    hasLowerCase: false,
    hasUpperCase: false,
    hasSpecial: false,
    hasNumber: false,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.organization_name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }

    if (formData.password.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }

    // Check all password requirements
    if (!passwordValidation.minLength || !passwordValidation.hasLowerCase ||
      !passwordValidation.hasUpperCase || !passwordValidation.hasSpecial ||
      !passwordValidation.hasNumber) {
      toast.error("Password must meet all requirements")
      return
    }

    setIsLoading(true)

    try {
      const response = await signupUser(formData)

      // Show success message from API
      toast.success(response.message)

      // Redirect to login page after successful signup
      setTimeout(() => {
        router.push("/login")
      }, 1000)

    } catch (error: unknown) {
      // Show error message from API
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Validate email in real-time
    if (name === "email") {
      validateEmail(value)
    }

    // Validate password in real-time
    if (name === "password") {
      setPasswordValidation({
        minLength: value.length >= 8,
        hasLowerCase: /[a-z]/.test(value),
        hasUpperCase: /[A-Z]/.test(value),
        hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(value),
        hasNumber: /[0-9]/.test(value),
      })
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col lg:flex-row bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
      {/* Logo and Brand */}
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8 flex items-center gap-2.5 z-10">
        <img
          src="/logo.png"
          alt="CertifyGen Logo"
          className="h-10 w-10 md:h-12 md:w-12 rounded-xl object-cover shrink-0"
        />
        <span className="text-xl md:text-2xl font-bold text-gray-900 font-heading">
          Certify<span className="text-[#2596be]">Gen</span>
        </span>
      </div>

      {/* LEFT SIDE - Auth Card */}
      <div className="flex-1 flex items-center justify-center px-4 pt-28 pb-12 lg:py-0">
        <div className="w-full max-w-110 bg-white rounded-2xl shadow-lg p-8 lg:p-10">
          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Create your account
            </h1>
            <p className="text-sm text-gray-500">
              Enter your details to sign up
            </p>
          </div>

          {/* Google Sign Up Button */}
          <GoogleAuthButton mode="signup" />

          {/* Divider - Only show if Google is configured */}
          {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-1 h-px bg-gray-300"></div>
              <span className="text-sm text-gray-500">or</span>
              <div className="flex-1 h-px bg-gray-300"></div>
            </div>
          )}

          {/* Signup Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Organization Name Input */}
            <div>
              <label
                htmlFor="organization_name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Organization name
              </label>
              <input
                type="text"
                id="organization_name"
                name="organization_name"
                value={formData.organization_name}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                required
              />
            </div>

            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full h-12 px-4 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
              />
              {/* Live Email Validation Feedback */}
              {formData.email && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {emailValid ? (
                    <>
                      <svg className="w-4 h-4 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-green-600">Valid email address</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 text-red-600" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs text-red-600">{emailError}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Password Input */}
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
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full h-12 px-4 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent"
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

                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.hasSpecial ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Special</span>
                </div>

                <div className={`flex items-center gap-0.5 sm:gap-1 whitespace-nowrap ${passwordValidation.hasNumber ? 'text-brand-primary' : 'text-gray-400'}`}>
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Number</span>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader size="small" color="white" />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* Already have account */}
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{" "}
              </span>
              <Link
                href="/login"
                className="text-sm text-brand-primary hover:underline font-medium"
              >
                Log in
              </Link>
            </div>
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
