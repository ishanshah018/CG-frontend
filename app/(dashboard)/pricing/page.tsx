"use client"

import { useState, useEffect, useRef } from "react"
import { Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"

// Smooth number animation hook
function useAnimatedNumber(target: number, duration: number = 300) {
const [current, setCurrent] = useState(target)
const rafRef = useRef<number | null>(null)
const startTimeRef = useRef<number | null>(null)
const startValueRef = useRef<number>(target)
const prevTargetRef = useRef(target)

useEffect(() => {
// Only animate if target changed
if (prevTargetRef.current === target) return
prevTargetRef.current = target

startValueRef.current = current
startTimeRef.current = performance.now()

const animate = (time: number) => {
    if (!startTimeRef.current) return
    
    const elapsed = time - startTimeRef.current
    const progress = Math.min(elapsed / duration, 1)
    
    // easeOut cubic
    const easeProgress = 1 - Math.pow(1 - progress, 3)
    
    const value = startValueRef.current + (target - startValueRef.current) * easeProgress
    setCurrent(Math.round(value))

    if (progress < 1) {
    rafRef.current = requestAnimationFrame(animate)
    }
}

rafRef.current = requestAnimationFrame(animate)

return () => {
    if (rafRef.current) {
    cancelAnimationFrame(rafRef.current)
    }
}
// eslint-disable-next-line react-hooks/exhaustive-deps
}, [target, duration])

return current
}

// Animated Price Component
function AnimatedPrice({ value }: { value: number }) {
const animatedValue = useAnimatedNumber(value, 350)
return <>{animatedValue}</>
}

export default function PricingPage() {
const [billingCycle, setBillingCycle] = useState<"monthly" | "annually">("monthly")
const [isVisible, setIsVisible] = useState(false)

// Page entry animation
useEffect(() => {
const timer = setTimeout(() => setIsVisible(true), 10)
return () => clearTimeout(timer)
}, [])

// Calculate discounted prices for annual billing (15% off)
const calculatePrice = (monthlyPrice: number) => {
if (billingCycle === "monthly") {
    return { 
    display: monthlyPrice, 
    period: "/month",
    originalPrice: null,
    yearlyTotal: null
    }
}
const discountedMonthly = Math.round(monthlyPrice * 0.85)
const yearlyPrice = discountedMonthly * 12
return { 
    display: discountedMonthly, 
    period: "/month",
    originalPrice: monthlyPrice,
    yearlyTotal: yearlyPrice
}
}

const plans = [
{
name: "Starter",
badge: "Free forever",
badgeColor: "bg-gray-100 text-gray-700",
price: 0,
description: "Perfect for getting started",
features: [
{ text: "100 certificates / month", included: true },
{ text: "Certificate generation", included: true },
{ text: "Download & store certificates", included: true },
{ text: "Custom mapping", included: true },
],
restrictions: [
{ text: "Email sending", included: false },
{ text: "Team members", included: false },
],
cta: "Current Plan",
ctaDisabled: true,
ctaVariant: "outline" as const,
},
{
name: "Growth",
badge: "Most Popular",
badgeColor: "bg-blue-100 text-blue-700",
popular: true,
price: 29,
description: "For growing teams",
features: [
{ text: "500 certificates / month", included: true },
{ text: "Generate & send certificates via email", included: true },
{ text: "Custom mapping", included: true },
{ text: "Add up to 2 team members", included: true },
{ text: "Priority support", included: true },
],
restrictions: [],
cta: "Upgrade to Growth",
ctaDisabled: false,
ctaVariant: "default" as const,
},
{
name: "Scale",
badge: "Enterprise",
badgeColor: "bg-purple-100 text-purple-700",
price: 59,
description: "For large-scale operations",
features: [
{ text: "2000 certificates / month", included: true },
{ text: "Generate & send certificates via email", included: true },
{ text: "Resend email support", included: true },
{ text: "Custom mapping", included: true },
{ text: "Custom email sender (domain, reply-to, branding)", included: true },
{ text: "Add up to 4 team members", included: true },
{ text: "Advanced support (24/7)", included: true },
],
restrictions: [],
cta: "Upgrade to Scale",
ctaDisabled: false,
ctaVariant: "outline" as const,
},
]

return (
<div className="min-h-screen bg-white">
<div 
className="max-w-7xl mx-auto p-6 py-12 space-y-12 transition-all duration-500 ease-out"
style={{
opacity: isVisible ? 1 : 0,
transform: isVisible ? 'translateY(0)' : 'translateY(16px)'
}}
>
{/* Page Header */}
<div className="text-center space-y-3">
    <h1 className="text-4xl font-bold text-foreground">
    Choose A Plan To{" "}
    <span
    className="bg-clip-text text-transparent"
    style={{
        backgroundImage:
        "linear-gradient(90deg, #dc2626, #ef4444, #f97316)",
    }}
    >
    Fuel Up
</span>{" "}
    Your{" "}
    <span style={{ color: "var(--color-brand-primary)" }}>
        Certificate Generation
    </span>
    </h1>
    
<p className="text-lg text-muted-foreground">
    Simple pricing. &nbsp;&nbsp;&nbsp;&nbsp;Upgrade anytime. &nbsp;&nbsp;&nbsp;&nbsp;No hidden charges.
</p>
</div>

{/* Billing Toggle */}
<div className="flex flex-col items-center gap-3">
<div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
    <button
    onClick={() => setBillingCycle("monthly")}
    className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        billingCycle === "monthly"
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    }`}
    >
    Monthly
    </button>
    <button
    onClick={() => setBillingCycle("annually")}
    className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
        billingCycle === "annually"
        ? "bg-white text-gray-900 shadow-sm"
        : "text-gray-600 hover:text-gray-900"
    }`}
    >
    Annually
    <span className="ml-1.5 text-xs font-semibold text-green-600">Save 15%</span>
    </button>
</div>
{billingCycle === "annually" && (
    <p className="text-sm text-green-600 font-medium">
    💰 Save 15% with annual billing
    </p>
)}
</div>

{/* Pricing Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
{plans.map((plan) => {
    const pricing = plan.price === 0 
        ? { display: 0, period: "/month", originalPrice: null, yearlyTotal: null } 
        : calculatePrice(plan.price)
    
    return (
    <div
        key={plan.name}
        className={`relative flex flex-col bg-card border rounded-2xl p-6 transition-all duration-300 ${
        plan.popular
            ? "shadow-lg scale-105 lg:scale-110 hover:shadow-2xl"
            : "border-border hover:border-gray-300 hover:shadow-lg"
        }`}
        style={
        plan.popular
            ? {
                borderColor: 'var(--color-brand-primary)',
                boxShadow: '0 10px 40px -10px rgba(37, 150, 190, 0.3), 0 0 0 1px var(--color-brand-primary)',
            }
            : undefined
        }
        onMouseEnter={(e) => {
        if (plan.popular) {
            e.currentTarget.style.boxShadow = '0 20px 60px -15px rgba(37, 150, 190, 0.5), 0 0 0 1px var(--color-brand-primary), 0 0 40px -10px rgba(37, 150, 190, 0.4)'
        }
        }}
        onMouseLeave={(e) => {
        if (plan.popular) {
            e.currentTarget.style.boxShadow = '0 10px 40px -10px rgba(37, 150, 190, 0.3), 0 0 0 1px var(--color-brand-primary)'
        }
        }}
    >
        {/* Badge */}
        {plan.badge && (
        <div className="mb-4">
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${plan.badgeColor}`}>
            {plan.badge}
            </span>
        </div>
        )}

        {/* Plan Name */}
        <h3 className="text-2xl font-bold text-foreground mb-2">{plan.name}</h3>
        
        {/* Description */}
        <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>

        {/* Price Block - Fixed height for consistency */}
        <div className="mb-6">
        <div className="flex flex-col" style={{ minHeight: '100px' }}>
            {/* Strikethrough original price (or spacer) */}
            <div className="mb-1" style={{ minHeight: '24px' }}>
            {pricing.originalPrice && (
                <span className="text-base text-gray-400 line-through">
                ${pricing.originalPrice} / month
                </span>
            )}
            </div>
            
            {/* Main price display with animation */}
            <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold text-foreground tabular-nums">
                $<AnimatedPrice value={pricing.display} />
            </span>
            <span className="text-lg text-muted-foreground">{pricing.period}</span>
            </div>
            
            {/* Yearly total helper text (or spacer) */}
            <div className="mt-2" style={{ minHeight: '20px' }}>
            {pricing.yearlyTotal && (
                <p className="text-sm text-muted-foreground">
                ${pricing.yearlyTotal} billed annually
                </p>
            )}
            </div>
        </div>
        </div>

        {/* CTA Button */}
        <Button
        onClick={() => !plan.ctaDisabled && (window.location.href = "/billing")}
        disabled={plan.ctaDisabled}
        variant={plan.ctaVariant}
        className="w-full mb-6 h-11 font-semibold"
        style={
            !plan.ctaDisabled && plan.popular
            ? {
                backgroundColor: "var(--color-brand-primary)",
                color: "white",
                border: "none",
                }
            : !plan.ctaDisabled && plan.name === "Scale"
            ? {
                borderColor: "var(--color-brand-primary)",
                color: "var(--color-brand-primary)",
                backgroundColor: "white",
                }
            : undefined
        }
        onMouseEnter={(e) => {
            if (!plan.ctaDisabled && plan.popular) {
            e.currentTarget.style.backgroundColor = "var(--color-brand-primary-hover)"
            } else if (!plan.ctaDisabled && plan.name === "Scale") {
            e.currentTarget.style.backgroundColor = "var(--color-brand-primary)"
            e.currentTarget.style.color = "white"
            }
        }}
        onMouseLeave={(e) => {
            if (!plan.ctaDisabled && plan.popular) {
            e.currentTarget.style.backgroundColor = "var(--color-brand-primary)"
            } else if (!plan.ctaDisabled && plan.name === "Scale") {
            e.currentTarget.style.backgroundColor = "white"
            e.currentTarget.style.color = "var(--color-brand-primary)"
            }
        }}
        >
        {plan.cta}
        </Button>

        {/* Features */}
        <div className="space-y-3 flex-1">
        {plan.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-3">
            <div className="shrink-0 mt-0.5">
                <Check className="w-5 h-5 text-green-600" strokeWidth={2.5} />
            </div>
            <span className="text-sm text-foreground">{feature.text}</span>
            </div>
        ))}
        
        {/* Restrictions */}
        {plan.restrictions.length > 0 && (
            <div className="pt-3 mt-3 border-t border-border">
            {plan.restrictions.map((restriction, idx) => (
                <div key={idx} className="flex items-start gap-3 opacity-50">
                <div className="shrink-0 mt-0.5">
                    <X className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
                </div>
                <span className="text-sm text-muted-foreground">{restriction.text}</span>
                </div>
            ))}
            </div>
        )}
        </div>
    </div>
    )
})}
</div>

{/* Footer Note */}
<div className="text-center">
<p className="text-sm text-muted-foreground max-w-2xl mx-auto">
    All plans include secure storage, certificate verification, and future feature updates.
</p>
</div>
</div>
</div>
)
}
