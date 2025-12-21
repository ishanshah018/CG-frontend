"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import React from "react"
import { signupUser } from "@/lib/api/auth"
import Loader from "@/components/loader"
import { toast } from "sonner"

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    organization_name: "",
    email: "",
    password: "",
  })

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
      
    } catch (error: any) {
      // Show error message from API
      toast.error(error.message)
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
<div className="min-h-screen flex items-center justify-center bg-surface-canvas px-4">
    <div className="w-full max-w-130">
    {/* Heading */}
    <h1 className="text-[40px] font-bold text-text-primary text-center mb-10">
        Create Admin Account
    </h1>

    {/* Signup Form */}
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        {/* Organization Name Input */}
        <div>
        <label
            htmlFor="organization_name"
            className="block text-sm text-text-secondary mb-2"
        >
            Organization name
        </label>
        <input
            type="text"
            id="organization_name"
            name="organization_name"
            value={formData.organization_name}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
        />
        </div>

        {/* Email Input */}
        <div>
        <label
            htmlFor="email"
            className="block text-sm text-text-secondary mb-2"
        >
            Email address
        </label>
        <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="w-full h-14 px-4 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
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
            value={formData.password}
            onChange={handleInputChange}
            className="w-full h-14 px-4 pr-16 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
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
        <div className="flex flex-nowrap items-center gap-x-2 md:gap-x-4 gap-y-2 text-[10px] md:text-xs mt-2 overflow-x-auto">
          <div className={`flex items-center gap-1 md:gap-1.5 whitespace-nowrap ${passwordValidation.minLength ? 'text-brand-primary' : 'text-gray-400'}`}>
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>8 characters</span>
          </div>
          
          <div className={`flex items-center gap-1 md:gap-1.5 whitespace-nowrap ${passwordValidation.hasLowerCase ? 'text-brand-primary' : 'text-gray-400'}`}>
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Lower case</span>
          </div>
          
          <div className={`flex items-center gap-1 md:gap-1.5 whitespace-nowrap ${passwordValidation.hasUpperCase ? 'text-brand-primary' : 'text-gray-400'}`}>
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Upper case</span>
          </div>
          
          <div className={`flex items-center gap-1 md:gap-1.5 whitespace-nowrap ${passwordValidation.hasSpecial ? 'text-brand-primary' : 'text-gray-400'}`}>
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Special</span>
          </div>
          
          <div className={`flex items-center gap-1 md:gap-1.5 whitespace-nowrap ${passwordValidation.hasNumber ? 'text-brand-primary' : 'text-gray-400'}`}>
            <svg className="w-3 h-3 md:w-4 md:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        className="w-full h-10 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-lg rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        style={{ fontFamily: 'var(--font-heading)' }}
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
        <span className="text-sm text-text-secondary">
            Already have an account?{" "}
        </span>
        <Link
            href="/login"
            className="text-sm text-primary hover:underline font-medium"
        >
            Log in
        </Link>
        </div>
    </form>
    </div>
</div>
)
}
