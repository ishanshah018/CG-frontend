"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { fetchCertificateAttributes, getCertificateMapping, type CertificateAttributes } from "@/lib/api/certificates"
import Loader from "@/components/loader"

export default function WebinarPage() {
  const router = useRouter()
  const [attributes, setAttributes] = useState<CertificateAttributes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)

  useEffect(() => {
    if (hasLoadedRef.current) return
    hasLoadedRef.current = true
    
    const loadData = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Fetch certificate mapping first
        const mappingResponse = await getCertificateMapping()
        
        if (!mappingResponse.success) {
          // Show toaster with the error message
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: mappingResponse.message || 'Custom certificate mapping not found. Please configure mapping first.',
              type: 'error'
            }
          })
          window.dispatchEvent(toastEvent)
          
          // Redirect to certificate-mapping after a short delay
          setTimeout(() => {
            router.push('/certificate-mapping')
          }, 700)
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
          You are in Webinar page
        </h1>
        {attributes?.webinar && (
          <div className="mt-4 text-left inline-block">
            <p className="text-sm text-muted-foreground mb-2">Available fields:</p>
            <ul className="list-disc list-inside">
              {attributes.webinar.map((field) => (
                <li key={field} className="text-sm">{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
