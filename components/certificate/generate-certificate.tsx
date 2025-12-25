"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CertificatePreview } from "./certificate-preview"
import { CertificateActionTooltip } from "./certificate-action-tooltip"

interface StyleObject {
  fontFamily: string
  fontSize: number
  color: string
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

// Capitalize first letter of each word
const capitalizeWords = (str: string): string => {
  if (!str) return str
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export function GenerateCertificate({
  attributes,
  mapping,
  templateUrl,
}: GenerateCertificateProps) {
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

  // Check if form is valid for "Generate & Send" (requires email)
  const canGenerateAndSend = useMemo(() => {
    return allFieldsFilled && emailValid
  }, [allFieldsFilled, emailValid])

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
        // Auto-capitalize name fields (student_name, course_name, webinar_name, workshop_name, host_name, etc.)
        formatted[key] = capitalizeWords(formatted[key])
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

  const handleGenerate = () => {
    // TODO: Will be implemented later with API
    console.log("Generate certificate with data:", formData)
  }

  const handleGenerateAndSend = () => {
    // TODO: Will be implemented later
    console.log("Generate and send certificate with data:", formData)
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
                  disabled={!allFieldsFilled}
                  className="w-full h-10 font-medium text-white whitespace-nowrap"
                  size="lg"
                  style={{ 
                    backgroundColor: allFieldsFilled ? 'var(--color-brand-primary)' : '#94a3b8',
                    borderRadius: '8px',
                    cursor: allFieldsFilled ? 'pointer' : 'not-allowed',
                    opacity: allFieldsFilled ? 1 : 0.6,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (allFieldsFilled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-brand-primary-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (allFieldsFilled) {
                      e.currentTarget.style.backgroundColor = 'var(--color-brand-primary)'
                    }
                  }}
                >
                  Generate Certificate
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
                  onClick={handleGenerateAndSend}
                  disabled={!canGenerateAndSend}
                  variant="outline"
                  className="w-full h-10 font-medium whitespace-nowrap"
                  size="lg"
                  style={{ 
                    borderColor: canGenerateAndSend ? 'var(--color-brand-primary)' : '#cbd5e1',
                    color: canGenerateAndSend ? '#000000' : '#94a3b8',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    cursor: canGenerateAndSend ? 'pointer' : 'not-allowed',
                    opacity: canGenerateAndSend ? 1 : 0.6,
                    pointerEvents: 'auto'
                  }}
                  onMouseEnter={(e) => {
                    if (canGenerateAndSend) {
                      e.currentTarget.style.backgroundColor = '#2596be'
                      e.currentTarget.style.color = 'white'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (canGenerateAndSend) {
                      e.currentTarget.style.backgroundColor = 'white'
                      e.currentTarget.style.color = '#000000'
                    }
                  }}
                >
                  Generate & Send
                </Button>
              </div>
            </CertificateActionTooltip>
          </div>
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
