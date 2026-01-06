"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CertificatePreview } from "./certificate-preview"
import { CertificateActionTooltip } from "./certificate-action-tooltip"
import { generateCertificate, type CertificateType } from "@/lib/api/certificates"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth"

// Loading Dots Animation Component
const LoadingDots = () => (
  <span className="inline-flex gap-1 ml-2">
    <span 
      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" 
      style={{ animationDelay: "0ms", animationDuration: "0.6s" }}
    />
    <span 
      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" 
      style={{ animationDelay: "150ms", animationDuration: "0.6s" }}
    />
    <span 
      className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" 
      style={{ animationDelay: "300ms", animationDuration: "0.6s" }}
    />
  </span>
)

// Lock Icon Component
const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
)

interface StyleObject {
  fontFamily: string
  fontSize: number
  color: string
  fontWeight?: number
}

interface TextBlock {
  text: string
  x: number
  y: number
  style: StyleObject
}

interface AttributeBlock {
  x: number
  y: number
  style: StyleObject
}

interface CertificateMapping {
  heading: TextBlock
  heading2?: TextBlock
  descriptionTop: TextBlock
  descriptionBody: TextBlock
  attributes: Record<string, AttributeBlock>
  attributesInDescription: string[]
}

interface GenerateCertificateProps {
  attributes: string[]
  mapping: CertificateMapping
  templateUrl: string
  certificateType: CertificateType
}

// Format date to "Month Day, Year" format
const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return dateString
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    const options: Intl.DateTimeFormatOptions = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    return date.toLocaleDateString('en-US', options)
  } catch {
    return dateString
  }
}

// Smart capitalize: respect all-caps, otherwise capitalize first letter of each word
const smartCapitalize = (str: string): string => {
  if (!str) return str
  
  // If entire string is uppercase, user wants ALL CAPS - keep as-is
  if (str === str.toUpperCase() && str !== str.toLowerCase()) {
    return str
  }
  
  // Otherwise, capitalize first letter of each word
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function GenerateCertificate({
  attributes,
  mapping,
  templateUrl,
  certificateType,
}: GenerateCertificateProps) {
  const { plan } = useAuth()
  
  // Initialize form data with empty strings for all attributes
  const initialFormData = useMemo(() => {
    const data: Record<string, string> = {}
    attributes.forEach((attr) => {
      data[attr] = ""
    })
    return data
  }, [attributes])

  const [formData, setFormData] = useState<Record<string, string>>(initialFormData)
  const [studentEmail, setStudentEmail] = useState<string>("")
  const [emailError, setEmailError] = useState<string>("")
  const [emailValid, setEmailValid] = useState<boolean>(false)
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isGeneratingAndSending, setIsGeneratingAndSending] = useState<boolean>(false)

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
    setStudentEmail(value)
    validateEmail(value)
  }

  // Check if all required fields are filled
  const allFieldsFilled = useMemo(() => {
    return attributes.every((attr) => formData[attr]?.trim() !== "")
  }, [attributes, formData])

  // Check if form is valid (requires all fields + email)
  const canGenerate = useMemo(() => {
    return allFieldsFilled && emailValid
  }, [allFieldsFilled, emailValid])

  // Check if form is valid for "Generate & Send" (requires email + paid plan)
  const canGenerateAndSend = useMemo(() => {
    return allFieldsFilled && emailValid && plan?.name !== "free"
  }, [allFieldsFilled, emailValid, plan])
  
  // Check if user is on free plan
  const isFreePlan = plan?.name === "free"

  // Format dates for display in preview
  const formattedFormData = useMemo(() => {
    const formatted = { ...formData }
    Object.keys(formatted).forEach((key) => {
      if (key.toLowerCase().includes('date') && formatted[key]) {
        formatted[key] = formatDateForDisplay(formatted[key])
      } else if (
        (key.toLowerCase().includes('name') || 
         key.toLowerCase().includes('host')) && 
        formatted[key]
      ) {
        // Smart capitalize: only fix all-lowercase, respect intentional casing
        formatted[key] = smartCapitalize(formatted[key])
      }
    })
    return formatted
  }, [formData])

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleGenerate = async () => {
    try {
      setIsGenerating(true)

      // Extract student name from form data
      const studentNameKey = attributes.find(attr => attr.toLowerCase().includes('student_name') || attr.toLowerCase().includes('name'))
      const studentName = studentNameKey ? formData[studentNameKey] : ""

      // Build attributes object dynamically from form data
      const certificateAttributes: Record<string, string> = {}
      attributes.forEach((attr) => {
        // Skip student_name as it goes in the student object
        if (!attr.toLowerCase().includes('student_name') && attr.toLowerCase() !== 'name') {
          certificateAttributes[attr] = formData[attr] || ""
        }
      })

      // Build the payload dynamically
      const payload = {
        certificateType,
        student: {
          name: studentName,
          email: studentEmail || "",
        },
        attributes: certificateAttributes,
      }

      // Call the API
      const response = await generateCertificate(payload)

      if (response.success) {
        // Show success toast with API response message
        toast.success(response.message || 'Certificate generated successfully')

        // Reset form
        setFormData(initialFormData)
        setStudentEmail("")
        setEmailValid(false)
      }
    } catch (error) {
      console.error("Failed to generate certificate:", error)
      
      // Show error toast with API error message
      toast.error(error instanceof Error ? error.message : 'Failed to generate certificate')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerateAndSend = async () => {
    try {
      setIsGeneratingAndSending(true)

      // Extract student name from form data
      const studentNameKey = attributes.find(attr => attr.toLowerCase().includes('student_name') || attr.toLowerCase().includes('name'))
      const studentName = studentNameKey ? formData[studentNameKey] : ""

      // Build attributes object dynamically from form data
      const certificateAttributes: Record<string, string> = {}
      attributes.forEach((attr) => {
        // Skip student_name as it goes in the student object
        if (!attr.toLowerCase().includes('student_name') && attr.toLowerCase() !== 'name') {
          certificateAttributes[attr] = formData[attr] || ""
        }
      })

      // Build the payload dynamically
      const payload = {
        certificateType,
        student: {
          name: studentName,
          email: studentEmail,
        },
        attributes: certificateAttributes,
      }

      // Call the API
      const response = await generateCertificate(payload)

      if (response.success) {
        // Show success toast with API response message
        toast.success(response.message || 'Certificate generated and sent successfully')

        // Reset form
        setFormData(initialFormData)
        setStudentEmail("")
        setEmailValid(false)
      }
    } catch (error) {
      console.error("Failed to generate and send certificate:", error)
      
      // Show error toast with API error message
      toast.error(error instanceof Error ? error.message : 'Failed to generate and send certificate')
    } finally {
      setIsGeneratingAndSending(false)
    }
  }

  // Format attribute key to readable label
  const formatLabel = (key: string) => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  }

  return (
    <>
      {/* Top Bar with Mass Generate Button */}
      <div className="flex justify-end items-center mb-6 pb-4 border-b border-border">
        <Button 
          variant="outline" 
          disabled 
          className="gap-2"
          style={{ 
            borderColor: 'var(--color-brand-primary)',
            color: '#000000',
            backgroundColor: 'white'
          }}
          onMouseEnter={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = '#2596be'
              e.currentTarget.style.color = 'white'
            }
          }}
          onMouseLeave={(e) => {
            if (!e.currentTarget.disabled) {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.color = '#000000'
            }
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
          Generate Mass Certificates
        </Button>
      </div>

      {/* EXACT SAME STRUCTURE AS CERTIFICATE MAPPING PAGE */}
      <div className="grid grid-cols-12 gap-6">
        {/* Left Panel - Editor (Scrollable) */}
        <div className="col-span-4 space-y-6 overflow-y-auto pr-2 pl-1" style={{ maxHeight: 'calc(100vh - 180px)' }}>
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-foreground">
              Certificate Details
            </h2>
            <p className="text-sm text-muted-foreground">
              Fill in the details to generate your certificate
            </p>
          </div>

          {/* Dynamic Form Fields */}
          <div className="space-y-4 pr-1">
            {attributes.map((attr) => (
              <div key={attr} className="space-y-2">
                <label
                  htmlFor={attr}
                  className="text-sm font-medium text-foreground"
                >
                  {formatLabel(attr)}
                  <span className="text-red-600 ml-1">*</span>
                </label>
                <Input
                  id={attr}
                  type={attr.includes("date") ? "date" : "text"}
                  value={formData[attr] || ""}
                  onChange={(e) => handleInputChange(attr, e.target.value)}
                  placeholder={`Enter ${formatLabel(attr).toLowerCase()}`}
                  className="w-full"
                  required
                />
              </div>
            ))}

            {/* Student Email Field */}
            <div className="space-y-2">
              <label
                htmlFor="student_email"
                className="text-sm font-medium text-foreground"
              >
                Student Email
              </label>
              <Input
                id="student_email"
                type="email"
                value={studentEmail}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="Enter student's email address"
                className="w-full"
              />
              {/* Live Email Validation Feedback */}
              {studentEmail && (
                <div className="flex items-center gap-1.5 mt-1.5">
                  {emailValid ? (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-green-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-medium text-green-600">
                        Valid email
                      </span>
                    </>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        className="w-4 h-4 text-red-600"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-medium text-red-600">
                        {emailError}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-border">
            <CertificateActionTooltip
              title="Generate Certificate"
              actions={[
                { label: "Generates and saves certificate securely", included: true },
                { label: "Does not send email to student", included: false },
              ]}
            >
              <div className="flex-1">
                <Button
                  onClick={handleGenerate}
                  disabled={!canGenerate || isGenerating}
                  className="w-full h-10 font-medium text-white whitespace-nowrap"
                  size="lg"
                  style={{ 
                    backgroundColor: (canGenerate && !isGenerating) ? 'var(--color-brand-primary)' : '#94a3b8',
                    borderRadius: '8px',
                    cursor: (canGenerate && !isGenerating) ? 'pointer' : 'not-allowed',
                    opacity: (canGenerate && !isGenerating) ? 1 : 0.6,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (canGenerate && !isGenerating) {
                      e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canGenerate && !isGenerating) {
                      e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)'
                    }
                  }}
                >
                  {isGenerating ? <LoadingDots /> : "Generate Certificate"}
                </Button>
              </div>
            </CertificateActionTooltip>
            
            <CertificateActionTooltip
              title="Generate & Send"
              actions={[
                { label: "Generates and saves certificate securely", included: true },
                { label: "Sends certificate to student's email", included: true },
              ]}
            >
              <div className="flex-1">
                <Button
                  onClick={isFreePlan ? () => window.location.href = '/pricing' : handleGenerateAndSend}
                  disabled={!canGenerateAndSend && !isFreePlan}
                  variant="outline"
                  className="w-full h-10 font-medium whitespace-nowrap flex items-center justify-center gap-2"
                  size="lg"
                  style={{ 
                    borderColor: isFreePlan ? '#cbd5e1' : (canGenerateAndSend ? 'var(--color-brand-primary)' : '#cbd5e1'),
                    color: isFreePlan ? '#94a3b8' : (canGenerateAndSend ? '#000000' : '#94a3b8'),
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    cursor: isFreePlan ? 'pointer' : (canGenerateAndSend ? 'pointer' : 'not-allowed'),
                    opacity: isFreePlan ? 0.7 : (canGenerateAndSend ? 1 : 0.6),
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (isFreePlan) {
                      e.currentTarget.style.backgroundColor = '#f8fafc'
                    } else if (canGenerateAndSend && !isGeneratingAndSending) {
                      e.currentTarget.style.backgroundColor = '#2596be'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white'
                    if (!isFreePlan && canGenerateAndSend) {
                      e.currentTarget.style.color = '#000000'
                    }
                  }}
                >
                  {isFreePlan && <LockIcon />}
                  {isGeneratingAndSending ? <LoadingDots /> : "Generate & Send"}
                </Button>
              </div>
            </CertificateActionTooltip>
          </div>
          
          {/* Upgrade Visual Callout - Free Plan Only */}
          {isFreePlan && (
            <div className="flex justify-end mt-3 ml-4">
              <div className="relative">
                {/* Triangular Pointer - Right Side */}
                <div 
                  className="absolute right-8 -top-2"
                  style={{
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: '8px solid #1f2937',
                  }}
                />
                
                {/* Premium Cloud Callout */}
                <div 
                  className="relative px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
                  style={{
                    backgroundColor: 'rgba(37, 150, 190, 0.04)',
                    border: '1.5px dashed rgba(37, 150, 190, 0.2)',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
                  }}
                  onClick={() => window.location.href = '/pricing'}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(37, 150, 190, 0.06)'
                    e.currentTarget.style.boxShadow = '0 6px 8px -2px rgba(0, 0, 0, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(37, 150, 190, 0.04)'
                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.06), 0 2px 4px -1px rgba(0, 0, 0, 0.04)'
                  }}
                >
                  <div className="flex flex-col gap-2">
                    {/* Top Row: Lock Icon + Text */}
                    <div className="flex items-center gap-2">
                      <div className="shrink-0" style={{ color: 'var(--color-brand-primary)' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                        </svg>
                      </div>
                      <p className="text-[11px] font-semibold text-gray-700 leading-snug">
                        Upgrade to send certificates directly to students via email
                      </p>
                    </div>
                    
                    {/* Bottom Row: Upgrade Link */}
                    <div className="flex justify-end">
                      <button 
                        className="text-[11px] font-semibold whitespace-nowrap transition-all"
                        style={{ color: 'var(--color-brand-primary)' }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.textDecoration = 'underline'
                          e.currentTarget.style.transform = 'translateX(2px)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.textDecoration = 'none'
                          e.currentTarget.style.transform = 'translateX(0)'
                        }}
                      >
                        Upgrade now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Live Preview (Sticky) */}
        <div className="col-span-8 sticky top-6 self-start">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm font-semibold mb-4 text-foreground">Live Preview</h3>
            <CertificatePreview
              templateUrl={templateUrl}
              mapping={mapping}
              formData={formattedFormData}
              isDraggable={false}
            />
          </div>
        </div>
      </div>
    </>
  )
}
