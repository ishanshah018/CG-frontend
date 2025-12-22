"use client"

import { useEffect, useState } from "react"
import { fetchCertificateAttributes, type CertificateAttributes } from "@/lib/api/certificates"
import Loader from "@/components/loader"

export default function CoursePage() {
  const [attributes, setAttributes] = useState<CertificateAttributes | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await fetchCertificateAttributes()
        setAttributes(data)
      } catch (err) {
        console.error("Failed to load certificate attributes:", err)
        setError(err instanceof Error ? err.message : "Failed to load attributes")
      } finally {
        setIsLoading(false)
      }
    }

    loadAttributes()
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
          You are in Course page
        </h1>
        {attributes?.course && (
          <div className="mt-4 text-left inline-block">
            <p className="text-sm text-muted-foreground mb-2">Available fields:</p>
            <ul className="list-disc list-inside">
              {attributes.course.map((field) => (
                <li key={field} className="text-sm">{field}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
