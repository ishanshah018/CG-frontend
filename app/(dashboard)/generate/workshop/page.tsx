"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { fetchCertificateAttributes, getCertificateMapping, getBaseCertificateTemplate, type CertificateAttributes } from "@/lib/api/certificates"
import Loader from "@/components/loader"
import { GenerateCertificate } from "@/components/certificate/generate-certificate"

// Default mapping structure for free plan
const DEFAULT_MAPPING = {
  workshop: {
    student_name: { x: 100, y: 200, fontSize: 24, fontFamily: "Arial", color: "#000000" },
    workshop_name: { x: 100, y: 250, fontSize: 20, fontFamily: "Arial", color: "#000000" },
    workshop_date: { x: 100, y: 300, fontSize: 18, fontFamily: "Arial", color: "#000000" },
  },
}

export default function WorkshopPage() {
  const router = useRouter()
  const [attributes, setAttributes] = useState<string[] | null>(null)
  const [mapping, setMapping] = useState<any>(null)
  const [templateUrl, setTemplateUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Step 1: Check if base certificate exists (already fetched)
        const baseCertResponse = await getBaseCertificateTemplate()
        
        if (!baseCertResponse.success || !baseCertResponse.data) {
          setRedirectMessage('Template Not Found')
          setIsLoading(false)
          
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: 'You have to upload base certificate first',
              type: 'error'
            }
          })
          window.dispatchEvent(toastEvent)
          
          setTimeout(() => {
            router.push('/templates')
          }, 1500)
          return
        }

        // Store template URL
        setTemplateUrl(baseCertResponse.data.template_url)
        
        // Step 2: Check if certificate mapping exists (already called on page entry)
        const mappingResponse = await getCertificateMapping()
        
        if (!mappingResponse.success) {
          // Check if user is on free plan
          const planData = sessionStorage.getItem("plan")
          const plan = planData ? JSON.parse(planData) : null
          
          if (plan && plan.name === "free") {
            // Use default mapping for free plan
            setMapping(DEFAULT_MAPPING.workshop)
          } else {
            // Show message and redirect for non-free plans
            setRedirectMessage('Mapping Not Found')
            setIsLoading(false)
            
            const toastEvent = new CustomEvent('showToast', {
              detail: {
                message: 'Custom certificate mapping not found. Please configure mapping first.',
                type: 'error'
              }
            })
            window.dispatchEvent(toastEvent)
            
            setTimeout(() => {
              router.push('/certificate-mapping')
            }, 1500)
            return
          }
        } else {
          // Use custom mapping from API - extract workshop mapping
          setMapping(mappingResponse.data?.workshop || mappingResponse.data)
        }
        
        // Fetch attributes from sessionStorage or API
        const data = await fetchCertificateAttributes()
        if (data && data.workshop) {
          setAttributes(data.workshop)
        }
      } catch (err) {
        console.error("Failed to load data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    )
  }

  if (redirectMessage) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-foreground">{redirectMessage}</h2>
          <p className="text-sm text-muted-foreground mt-2">Redirecting...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">Failed to load data</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  if (!attributes || attributes.length === 0 || !mapping || !templateUrl) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">No certificate configuration found</h2>
          <p className="text-sm text-muted-foreground">Please configure your certificate settings first</p>
        </div>
      </div>
    )
  }

  return (
    <GenerateCertificate
      attributes={attributes}
      mapping={mapping}
      templateUrl={templateUrl}
    />
  )
}
