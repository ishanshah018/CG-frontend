"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { toast } from "sonner"
import { loginUser, storeAuthData } from "@/lib/api/auth"
import Loader from "@/components/loader"

export default function LoginPage() {
const router = useRouter()
const [showPassword, setShowPassword] = React.useState(false)
const [isLoading, setIsLoading] = React.useState(false)
const [email, setEmail] = React.useState("")
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

  const handleEmailChange = (value: string) => {
    setEmail(value)
    validateEmail(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    // Basic validation
    if (!email?.trim()) {
      toast.error("Please enter your email address")
      return
    }
    
    if (!password) {
      toast.error("Please enter your password")
      return
    }

    setIsLoading(true)

    try {
      const response = await loginUser({ email, password })
      
      // Store authentication data
      storeAuthData(response.data)
      
      // Show success notification
      toast.success("Login successful")
      
      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error 
        ? error.message 
        : "An unexpected error occurred"
      
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

return (
<div className="min-h-screen flex items-center justify-center bg-surface-canvas px-4">
    <div className="w-full max-w-130">
    {/* Heading */}
    <h1 className="text-[40px] font-bold text-text-primary text-center mb-10">
        Log in to your account
    </h1>

    {/* Login Form */}
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
        {/* Email Input */}
        <div>
        <label
            htmlFor="email"
            className="block text-sm text-text-secondary mb-2"
        >
            Email
        </label>
        <input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => handleEmailChange(e.target.value)}
            disabled={isLoading}
            className="w-full h-14 px-4 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
        />
        {/* Live Email Validation Feedback */}
        {email && (
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
            className="block text-sm text-text-secondary mb-2"
        >
            Password
        </label>
        <div className="relative">
            <input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            disabled={isLoading}
            className="w-full h-14 px-4 pr-16 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
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
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
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
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
            )}
            </button>
        </div>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end">
        <Link
            href="#"
            className="text-sm text-brand-primary hover:underline"
        >
            Forgot Password ?
        </Link>
        </div>

        {/* Login Button */}
        <button
        type="submit"
        disabled={isLoading}
        className="w-full h-10 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: 'var(--font-heading)' }}
        >
        {isLoading ? (
          <>
            <Loader size="small" color="white" />
            <span>Logging in...</span>
          </>
        ) : (
          "Sign in"
        )}
        </button>

        {/* New User Link */}
        <div className="text-center">
        <span className="text-sm text-text-secondary">
            New User?{" "}
        </span>
        <Link
            href="/signup"
            className="text-sm text-primary hover:underline font-medium"
        >
            Create Account
        </Link>
        </div>
    </form>
    </div>
</div>
)
}