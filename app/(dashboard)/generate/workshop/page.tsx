"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { fetchCertificateAttributes, getCertificateMapping, getBaseCertificateTemplate, type CertificateAttributes } from "@/lib/api/certificates"
import Loader from "@/components/loader"

export default function WorkshopPage() {
  const router = useRouter()
  const [attributes, setAttributes] = useState<CertificateAttributes | null>(null)
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
        
        // Step 1: Check if base certificate exists
        const baseCertResponse = await getBaseCertificateTemplate()
        
        if (!baseCertResponse.success || !baseCertResponse.data) {
          // Show message in page content
          setRedirectMessage('Template Not Found')
          setIsLoading(false)
          
          // Show toaster for missing base certificate
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: 'You have to upload base certificate first',
              type: 'error'
            }
          })
          window.dispatchEvent(toastEvent)
          
          // Redirect to templates page after a short delay
          setTimeout(() => {
            router.push('/templates')
          }, 1500)
          return
        }
        
        // Step 2: Check if certificate mapping exists
        const mappingResponse = await getCertificateMapping()
        
        if (!mappingResponse.success) {
          // Show message in page content
          setRedirectMessage('Mapping Not Found')
          setIsLoading(false)
          
          // Show toaster for missing mapping
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: 'No mappings found. Please configure certificate mapping first.',
              type: 'error'
            }
          })
          window.dispatchEvent(toastEvent)
          
          // Redirect to certificate-mapping after a short delay
          setTimeout(() => {
            router.push('/certificate-mapping')
          }, 1500)
          return
        }
        
        // Fetch attributes
        const data = await fetchCertificateAttributes()
        setAttributes(data)
      } catch (err) {
        console.error("Failed to load data:", err)
        setError(err instanceof Error ? err.message : "Failed to load data")
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

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
          <h2 className="text-lg font-medium text-foreground mb-2">Failed to load attributes</h2>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-4">
          You are in Workshop page
        </h1>
        {attributes?.workshop && (
          <div className="mt-4 text-left inline-block">
            <p className="text-sm text-muted-foreground mb-2">Available fields:</p>
            <ul className="list-disc list-inside">
              {attributes.workshop.map((field) => (
                <li key={field} className="text-sm">{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
