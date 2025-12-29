"use client"

import Link from "next/link"
import Image from "next/image"
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
<div className="min-h-screen flex flex-col lg:flex-row bg-linear-to-r from-white from-45% via-brand-primary/10 via-65% to-brand-primary/25">
    {/* LEFT SIDE - Auth Card */}
    <div className="flex-1 flex items-center justify-center px-4 py-12 lg:py-0">
      <div className="w-full max-w-110 bg-white rounded-2xl shadow-lg p-8 lg:p-10">
        {/* Heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sign in to your account
          </h1>
          <p className="text-sm text-gray-500">
            Enter your details to sign in
          </p>
        </div>

        {/* Google Sign In Button (Visual only) */}
        <button
          type="button"
          className="w-full h-12 flex items-center justify-center gap-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span className="text-sm font-medium text-gray-700">Sign in with Google</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-500">or</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Email Input */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Email
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="vision@gmail.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                disabled={isLoading}
                className="w-full h-12 pl-10 pr-4 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
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
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                placeholder="••••••••••"
                disabled={isLoading}
                className="w-full h-12 pl-10 pr-12 border border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
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
              className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
            >
              Forgot Password?
            </Link>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader size="small" color="white" />
                <span>Signing in...</span>
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* New User Link */}
          <div className="text-center">
            <span className="text-sm text-gray-600">
              Don&apos;t have an account?{" "}
            </span>
            <Link
              href="/signup"
              className="text-sm text-brand-primary hover:underline font-medium"
            >
              Sign Up
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
      />
    </div>
  </div>
)
}