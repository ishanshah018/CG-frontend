"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { fetchCertificateAttributes, getCertificateMapping, getBaseCertificateTemplate, getDashboardUsage } from "@/lib/api/certificates"
import Loader from "@/components/loader"
import { GenerateCertificate } from "@/components/certificate/generate-certificate"
import { toast } from "sonner"
import { useUsage } from "@/app/(dashboard)/layout"

export default function WebinarPage() {
  const router = useRouter()
  const [attributes, setAttributes] = useState<string[] | null>(null)
  const [mapping, setMapping] = useState<any>(null)
  const [templateUrl, setTemplateUrl] = useState<string>("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const { usage, refetchUsage } = useUsage()
  const lastKnownUsageRef = useRef<number | null>(null)

  // Silent polling for usage updates
  useEffect(() => {
    // Only start polling if page is fully loaded
    if (isLoading || redirectMessage) return

    // Initialize last known usage
    if (usage && lastKnownUsageRef.current === null) {
      lastKnownUsageRef.current = usage.monthly_certificates_used
    }

    const pollUsage = async () => {
      try {
        const response = await getDashboardUsage()
        // Silent: ignore if API returns success: false
        if (!response.success || !response.data) return

        const newUsed = response.data.monthly_certificates_used
        const lastKnown = lastKnownUsageRef.current

        // Only update if usage has increased
        if (lastKnown !== null && newUsed > lastKnown) {
          lastKnownUsageRef.current = newUsed
          await refetchUsage()
        } else if (lastKnown === null) {
          lastKnownUsageRef.current = newUsed
        }
      } catch {
        // Silent: ignore errors, retry on next interval
      }
    }

    // Poll every 10 seconds
    const intervalId = setInterval(pollUsage, 10000)

    // Cleanup on unmount
    return () => clearInterval(intervalId)
  }, [isLoading, redirectMessage, usage, refetchUsage])

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
          
          toast.error('You have to upload base certificate first')
          
          setTimeout(() => {
            router.push('/templates')
          }, 1500)
          return
        }

        // Store template URL
        setTemplateUrl(baseCertResponse.data.template_url)
        
        // Step 2: Check if certificate mapping exists
        const mappingResponse = await getCertificateMapping()
        
        if (!mappingResponse.success) {
          setRedirectMessage('Mapping Not Found')
          setIsLoading(false)
          
          toast.error('Custom certificate mapping not found. Please configure mapping first.')
          
          setTimeout(() => {
            router.push('/certificate-mapping')
          }, 1500)
          return
        }
        
        // Store mapping in sessionStorage for later use
        sessionStorage.setItem('certificate_mapping', JSON.stringify(mappingResponse.data))
        
        // Extract webinar mapping
        setMapping(mappingResponse.data?.webinar || mappingResponse.data)
        
        // Fetch attributes from sessionStorage or API
        const data = await fetchCertificateAttributes()
        if (data && data.webinar) {
          setAttributes(data.webinar)
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
      certificateType="webinar"
    />
  )
}
