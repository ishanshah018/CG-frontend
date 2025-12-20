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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.organization_name || !formData.email || !formData.password) {
      toast.error("Please fill in all fields")
      return
    }
    
    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters")
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
            className="w-full h-14 px-4 pr-12 border border-[#66666659] rounded-xl bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            required
            />
            <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
            >
            {showPassword ? (
                <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                />
                </svg>
            ) : (
                <svg
                className="size-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
                </svg>
            )}
            </button>
        </div>
        </div>

        {/* Submit Button */}
        <button
        type="submit"
        disabled={isLoading}
        className="w-full h-14 bg-brand-primary hover:bg-brand-primary-hover text-white font-semibold text-lg rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
