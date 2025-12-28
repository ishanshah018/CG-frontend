"use client"

import { useAuth } from "@/lib/auth"
import React, { useState, useEffect, useRef, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getBaseCertificateTemplate, fetchCertificateAttributes, saveCertificateMapping, getCertificateMapping } from "@/lib/api/certificates"
import { Monitor, User, BookOpen, Calendar, Video, UserCircle, Briefcase } from "lucide-react"
import Loader from "@/components/loader"
import { normalizeCertificateMappings } from "@/lib/certificate-utils"
import { toast } from "sonner"

// Types
type CertificateType = "course" | "webinar" | "workshop"

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

type MappingData = Record<CertificateType, CertificateMapping>

// Constants
const DEFAULT_HEADINGS = {
  course: "Certificate of Completion",
  webinar: "Certificate of Participation",
  workshop: "Certificate of<br>Workshop Completion",
}

const DEFAULT_DESCRIPTION_TOP = "This certificate is awarded to"

// Helper function to generate description body template based on available attributes
const getDescriptionBodyTemplate = (type: CertificateType, attrs: string[]) => {
  if (type === 'course') {
    return attrs.includes('course_name') 
      ? "Has successfully completed the {course_name}"
      : "Has successfully completed the"
  } else if (type === 'webinar') {
    const hasWebinarName = attrs.includes('webinar_name')
    const hasHostName = attrs.includes('host_name')
    
    if (hasWebinarName && hasHostName) {
      return "In recognition of participation in {webinar_name} hosted by {host_name}"
    } else if (hasWebinarName) {
      return "In recognition of participation in {webinar_name}"
    }
    return "In recognition of participation in"
  } else if (type === 'workshop') {
    const hasWorkshopName = attrs.includes('workshop_name')
    const hasWorkshopDate = attrs.includes('workshop_date')
    
    if (hasWorkshopName && hasWorkshopDate) {
      return "For completing a {workshop_name} on {workshop_date}"
    } else if (hasWorkshopName) {
      return "For completing a {workshop_name}"
    }
    return "For completing a workshop"
  }
  return ""
}

// Mock data for preview
const MOCK_DATA: Record<string, string> = {
  student_name: "John Doe",
  course_name: "Advanced React Development",
  completion_date: "December 15, 2025",
  webinar_name: "Modern Web Technologies",
  webinar_date: "December 20, 2025",
  host_name: "Jane Smith",
  workshop_name: "UX Design Fundamentals",
  workshop_date: "December 22, 2025",
}

// Attribute label mapping
const ATTRIBUTE_LABELS: Record<string, string> = {
  student_name: "Student Name",
  course_name: "Course Name",
  completion_date: "Completion Date",
  webinar_name: "Webinar Name",
  webinar_date: "Webinar Date",
  host_name: "Host Name",
  workshop_name: "Workshop Name",
  workshop_date: "Workshop Date",
}

// Attribute icon mapping
const ATTRIBUTE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  student_name: User,
  course_name: BookOpen,
  completion_date: Calendar,
  webinar_name: Video,
  webinar_date: Calendar,
  host_name: UserCircle,
  workshop_name: Briefcase,
  workshop_date: Calendar,
}

const STORAGE_KEY = "certificate_mapping"
const ATTRIBUTES_STORAGE_KEY = "certificate_attributes"

// Font options (used in UI selects)
const FONT_OPTIONS = {
  heading: [
    "Playfair Display",
    "Libre Baskerville",
    "Cormorant Garamond",
    "Merriweather",
  ],
  descriptionTop: [
    "Inter",
    "Source Sans 3",
    "Open Sans",
    "Lato",
  ],
  studentName: [
    "Great Vibes",
    "Allura",
    "Playfair Display",
    "Pinyon Script",
  ],
  descriptionBody: [
    "Roboto",
    "Inter",
    "Open Sans",
    "Source Sans 3",
  ],
}

export default function CertificateMappingPage() {
  useAuth() // Required for authentication context
  const router = useRouter()
  const hasLoadedTemplateRef = useRef(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [certificateType, setCertificateType] = useState<CertificateType>("course")
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const [mappingDraft, setMappingDraft] = useState<MappingData | null>(null) // Live edits (drag, style, text)
  const mappingDraftRef = useRef<MappingData | null>(null) // Single source of truth for saving
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const [certificateAttributes, setCertificateAttributes] = useState<Record<CertificateType, string[]>>({
    course: [],
    webinar: [],
    workshop: [],
  })
  const [showVerticalGuide, setShowVerticalGuide] = useState(false)
  const [showHorizontalGuide, setShowHorizontalGuide] = useState(false)

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Load custom mapping from API on page load (API is source of truth)
  useEffect(() => {
    const loadCustomMapping = async () => {
      try {
        const mappingResponse = await getCertificateMapping()
        
        // API is source of truth: load into state first, then cache to sessionStorage
        if (mappingResponse.success && mappingResponse.data) {
          setMappingDraft(mappingResponse.data)
          mappingDraftRef.current = mappingResponse.data
          sessionStorage.setItem('certificate_mapping', JSON.stringify(mappingResponse.data))
        }
      } catch {
        // Silently ignore any errors
        console.log('Custom mapping fetch skipped or unavailable')
      }
    }
    
    loadCustomMapping()
  }, [])

  // Keep mappingDraftRef synced with mappingDraft state (CRITICAL for save consistency)
  useEffect(() => {
    mappingDraftRef.current = mappingDraft
  }, [mappingDraft])

  // Load certificate attributes from API
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const attributes = await fetchCertificateAttributes()
        if (attributes && typeof attributes === 'object') {
          // Ensure all certificate types have arrays
          const validatedAttributes = {
            course: Array.isArray(attributes.course) ? attributes.course : [],
            webinar: Array.isArray(attributes.webinar) ? attributes.webinar : [],
            workshop: Array.isArray(attributes.workshop) ? attributes.workshop : [],
          }
          setCertificateAttributes(validatedAttributes)
          sessionStorage.setItem(ATTRIBUTES_STORAGE_KEY, JSON.stringify(validatedAttributes))
        } else {
          // No attributes found (no base template), set empty arrays
          const emptyAttributes = {
            course: [],
            webinar: [],
            workshop: [],
          }
          setCertificateAttributes(emptyAttributes)
        }
      } catch (error) {
        console.error("Failed to fetch certificate attributes:", error)
        // Fallback to sessionStorage if API fails
        const storedAttributes = sessionStorage.getItem(ATTRIBUTES_STORAGE_KEY)
        if (storedAttributes) {
          try {
            const parsed = JSON.parse(storedAttributes)
            const validatedAttributes = {
              course: Array.isArray(parsed.course) ? parsed.course : [],
              webinar: Array.isArray(parsed.webinar) ? parsed.webinar : [],
              workshop: Array.isArray(parsed.workshop) ? parsed.workshop : [],
            }
            setCertificateAttributes(validatedAttributes)
          } catch (parseError) {
            console.error("Failed to parse stored certificate attributes:", parseError)
            // Set empty arrays on parse error
            setCertificateAttributes({
              course: [],
              webinar: [],
              workshop: [],
            })
          }
        } else {
          // No stored attributes, set empty arrays
          setCertificateAttributes({
            course: [],
            webinar: [],
            workshop: [],
          })
        }
      }
    }
    loadAttributes()
  }, [])

  // Update style directly in mappingData
  const updateStyle = (
    blockType: "heading" | "descriptionTop" | "descriptionBody" | "attribute",
    blockName: string,
    property: "fontFamily" | "fontSize" | "color",
    value: string | number
  ) => {
    if (!mappingDraft) return
    const newData = structuredClone(mappingDraft) as MappingData
    
    if (blockType === "attribute") {
      // Update attribute style
      if (newData[certificateType].attributes[blockName]) {
        if (property === "fontFamily") {
          newData[certificateType].attributes[blockName].style.fontFamily = value as string
        } else if (property === "fontSize") {
          newData[certificateType].attributes[blockName].style.fontSize = value as number
        } else if (property === "color") {
          newData[certificateType].attributes[blockName].style.color = value as string
        }
      }
    } else {
      // Update text block style
      if (newData[certificateType][blockType]) {
        if (property === "fontFamily") {
          newData[certificateType][blockType].style.fontFamily = value as string
        } else if (property === "fontSize") {
          newData[certificateType][blockType].style.fontSize = value as number
        } else if (property === "color") {
          newData[certificateType][blockType].style.color = value as string
        }
      }
    }
    
    updateMappingDraft(newData)
  }

  // Load base certificate template
  useEffect(() => {
    if (hasLoadedTemplateRef.current) return
    hasLoadedTemplateRef.current = true
    
    const loadTemplate = async () => {
      try {
        const response = await getBaseCertificateTemplate()
        if (!response.success || !response.data?.template_url) {
          // Show message in page content
          setRedirectMessage('No Base Template Found')
          setIsLoading(false)
          
          // Show toaster for missing base certificate
          toast.error('You have to upload base certificate first')
          
          // Redirect to templates page after a short delay
          setTimeout(() => {
            router.push('/templates')
          }, 1500)
          return
        }
        setTemplateUrl(response.data.template_url)
      } catch (error) {
        console.error("Failed to load base certificate:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplate()
  }, [router])

  // Helper to ensure text block has style
  const ensureTextBlockStyle = (block: unknown, defaultStyle: StyleObject): TextBlock => {
    if (!block || typeof block !== 'object') return { text: "", x: 50, y: 50, style: defaultStyle }
    const b = block as Record<string, unknown>
    return {
      text: (b.text as string) || "",
      x: (b.x as number) ?? 50,
      y: (b.y as number) ?? 50,
      style: (b.style as StyleObject) || defaultStyle
    }
  }

  // Helper to ensure attribute has style
  const ensureAttributeStyle = (attr: unknown, attrName: string): AttributeBlock => {
    const isStudentName = attrName === 'student_name'
    const defaultStyle = isStudentName
      ? { fontFamily: "Great Vibes", fontSize: 28, color: "#111827" }
      : { fontFamily: "Inter", fontSize: 14, color: "#111827" }
    
    if (!attr || typeof attr !== 'object') return { x: 50, y: 50, style: defaultStyle }
    const a = attr as Record<string, unknown>
    return {
      x: (a.x as number) ?? 50,
      y: (a.y as number) ?? 50,
      style: (a.style as StyleObject) || defaultStyle
    }
  }

  // Load mapping data - only used if API returned no data
  useEffect(() => {
    if (certificateAttributes.course.length === 0) return // Wait for attributes to load
    if (mappingDraft !== null) return // Already loaded from API

    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsedData = JSON.parse(stored)
        
        // Migrate old data structure to new one if needed
        const migratedData: MappingData = {} as MappingData
        
        ;(["course", "webinar", "workshop"] as CertificateType[]).forEach((type) => {
          const typeData = parsedData[type]
          
          // Check if old structure (has 'description' instead of 'descriptionTop' and 'descriptionBody')
          if (typeData && typeData.description && !typeData.descriptionTop) {
            const autoInclude = []
            if (type === 'webinar' && certificateAttributes[type].includes('host_name')) autoInclude.push('host_name')
            if (type === 'workshop') autoInclude.push('workshop_name')

            // Migrate old structure with inline styles
            const migratedAttributes: Record<string, AttributeBlock> = {}
            const oldAttrs = typeData.attributes || {}
            Object.keys(oldAttrs).forEach(attrName => {
              migratedAttributes[attrName] = ensureAttributeStyle(oldAttrs[attrName], attrName)
            })

            migratedData[type] = {
              heading: ensureTextBlockStyle(
                typeData.heading || { text: DEFAULT_HEADINGS[type], x: 50, y: 20 },
                { fontFamily: "Playfair Display", fontSize: 36, color: "#111827" }
              ),
              descriptionTop: {
                text: DEFAULT_DESCRIPTION_TOP,
                x: 50,
                y: 30,
                style: { fontFamily: "Inter", fontSize: 14, color: "#4B5563" }
              },
              descriptionBody: {
                text: getDescriptionBodyTemplate(type, certificateAttributes[type]),
                x: 50,
                y: 70,
                style: { fontFamily: "Roboto", fontSize: 14, color: "#4B5563" }
              },
              attributes: migratedAttributes,
              attributesInDescription: typeData.attributesInDescription || autoInclude,
            }
          } else if (typeData && typeData.descriptionTop && typeData.descriptionBody) {
            // New structure, ensure all blocks have inline styles
            let attrInDesc = typeData.attributesInDescription || []
            if (type === 'webinar' && !attrInDesc.includes('host_name') && certificateAttributes[type].includes('host_name')) {
              attrInDesc = [...attrInDesc, 'host_name']
            }
            if (type === 'workshop' && !attrInDesc.includes('workshop_name')) {
              attrInDesc = [...attrInDesc, 'workshop_name']
            }

            // Migrate all attributes with styles
            const migratedAttributes: Record<string, AttributeBlock> = {}
            const oldAttrs = typeData.attributes || {}
            Object.keys(oldAttrs).forEach(attrName => {
              migratedAttributes[attrName] = ensureAttributeStyle(oldAttrs[attrName], attrName)
            })

            // Ensure heading2 exists with style
            if (!migratedAttributes.heading2) {
              migratedAttributes.heading2 = {
                x: 50,
                y: 26,
                style: { fontFamily: "Playfair Display", fontSize: 24, color: "#111827" }
              }
            }

            migratedData[type] = {
              heading: ensureTextBlockStyle(
                typeData.heading,
                { fontFamily: "Playfair Display", fontSize: 36, color: "#111827" }
              ),
              descriptionTop: ensureTextBlockStyle(
                typeData.descriptionTop,
                { fontFamily: "Inter", fontSize: 14, color: "#4B5563" }
              ),
              descriptionBody: {
                text: getDescriptionBodyTemplate(type, certificateAttributes[type]),
                x: typeof typeData.descriptionBody === 'object' && typeData.descriptionBody !== null ? (typeData.descriptionBody.x as number) ?? 50 : 50,
                y: typeof typeData.descriptionBody === 'object' && typeData.descriptionBody !== null ? (typeData.descriptionBody.y as number) ?? 70 : 70,
                style: typeof typeData.descriptionBody === 'object' && typeData.descriptionBody !== null && typeof typeData.descriptionBody.style === 'object' ? typeData.descriptionBody.style as StyleObject : { fontFamily: "Roboto", fontSize: 14, color: "#4B5563" }
              },
              attributes: migratedAttributes,
              attributesInDescription: attrInDesc,
            }
          } else {
            // Missing or incomplete data, create fresh with inline styles
            const attrs = certificateAttributes[type]
            const attrBlocks: Record<string, AttributeBlock> = {}
            
            let yPos = 50
            attrs.forEach((attr) => {
              if (attr === "student_name") {
                attrBlocks[attr] = {
                  x: 50,
                  y: 40,
                  style: { fontFamily: "Great Vibes", fontSize: 28, color: "#111827" }
                }
              } else {
                attrBlocks[attr] = {
                  x: 50,
                  y: yPos,
                  style: { fontFamily: "Inter", fontSize: 14, color: "#111827" }
                }
                yPos += 8
              }
            })

            attrBlocks.heading2 = {
              x: 50,
              y: 26,
              style: { fontFamily: "Playfair Display", fontSize: 24, color: "#111827" }
            }

            const autoInclude = []
            if (type === 'course') autoInclude.push('course_name')
            if (type === 'webinar' && certificateAttributes?.[type]?.includes('host_name')) autoInclude.push('host_name')
            if (type === 'webinar') autoInclude.push('webinar_name')
            if (type === 'workshop') autoInclude.push('workshop_name')

            migratedData[type] = {
              heading: {
                text: DEFAULT_HEADINGS[type],
                x: 50,
                y: 20,
                style: { fontFamily: "Playfair Display", fontSize: 36, color: "#111827" }
              },
              descriptionTop: {
                text: DEFAULT_DESCRIPTION_TOP,
                x: 50,
                y: 30,
                style: { fontFamily: "Inter", fontSize: 14, color: "#4B5563" }
              },
              descriptionBody: {
                text: getDescriptionBodyTemplate(type, certificateAttributes[type]),
                x: 50,
                y: 70,
                style: { fontFamily: "Roboto", fontSize: 14, color: "#4B5563" }
              },
              attributes: attrBlocks,
              attributesInDescription: autoInclude,
            }
          }
        })
        
        setMappingDraft(migratedData) // Initialize draft with saved state
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(migratedData))
      } catch (error) {
        console.error("Failed to parse mapping data:", error)
        // Initialize fresh on error
        initializeFreshData()
      }
    } else {
      // No stored data, initialize fresh
      initializeFreshData()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [certificateAttributes?.course?.length, certificateAttributes?.webinar?.length, certificateAttributes?.workshop?.length])

  const initializeFreshData = () => {
    const initialData: MappingData = {} as MappingData

    ;(["course", "webinar", "workshop"] as CertificateType[]).forEach((type) => {
      const attrs = certificateAttributes?.[type] || []
      const attrBlocks: Record<string, AttributeBlock> = {}
      
      // Initialize positions and styles for all attributes
      let yPos = 50
      attrs.forEach((attr) => {
        if (attr === "student_name") {
          attrBlocks[attr] = {
            x: 50,
            y: 40,
            style: {
              fontFamily: "Great Vibes",
              fontSize: 28,
              color: "#111827"
            }
          }
        } else {
          attrBlocks[attr] = {
            x: 50,
            y: yPos,
            style: {
              fontFamily: "Inter",
              fontSize: 14,
              color: "#111827"
            }
          }
          yPos += 8
        }
      })

      // Initialize heading2 position (for when <br> is added)
      attrBlocks.heading2 = {
        x: 50,
        y: 26,
        style: {
          fontFamily: "Playfair Display",
          fontSize: 24,
          color: "#111827"
        }
      }

      // Automatically include certain attributes in description
      const autoIncludeInDescription = []
      if (type === 'course' && attrs.includes('course_name')) {
        autoIncludeInDescription.push('course_name')
      }
      if (type === 'webinar' && attrs.includes('host_name')) {
        autoIncludeInDescription.push('host_name')
      }
      if (type === 'webinar' && attrs.includes('webinar_name')) {
        autoIncludeInDescription.push('webinar_name')
      }
      if (type === 'workshop' && attrs.includes('workshop_name')) {
        autoIncludeInDescription.push('workshop_name')
      }

      initialData[type] = {
        heading: {
          text: DEFAULT_HEADINGS[type],
          x: 50,
          y: 20,
          style: {
            fontFamily: "Playfair Display",
            fontSize: 36,
            color: "#111827"
          }
        },
        descriptionTop: {
          text: DEFAULT_DESCRIPTION_TOP,
          x: 50,
          y: 30,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            color: "#4B5563"
          }
        },
        descriptionBody: {
          text: getDescriptionBodyTemplate(type, attrs),
          x: 50,
          y: 70,
          style: {
            fontFamily: "Roboto",
            fontSize: 14,
            color: "#4B5563"
          }
        },
        attributes: attrBlocks,
        attributesInDescription: autoIncludeInDescription,
      }
    })
    
    setMappingDraft(initialData) // Initialize draft with saved state
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
  }

  // Toggle attribute inclusion in description
  const toggleAttributeInDescription = (attr: string, include: boolean) => {
    if (!mappingDraft) return
    const newData = structuredClone(mappingDraft) as MappingData
    const current = newData[certificateType].attributesInDescription || []
    
    if (include && !current.includes(attr)) {
      newData[certificateType].attributesInDescription = [...current, attr]
    } else if (!include && current.includes(attr)) {
      newData[certificateType].attributesInDescription = current.filter(a => a !== attr)
      
      // When moving attribute to draggable, ensure it has a position and style
      if (!newData[certificateType].attributes[attr]) {
        newData[certificateType].attributes[attr] = {
          x: 50,
          y: 55,
          style: {
            fontFamily: "Inter",
            fontSize: 14,
            color: "#111827"
          }
        }
      }
    }
    
    updateMappingDraft(newData)
  }

  // Update mapping draft ONLY (parent's single responsibility)
  // Child component will detect intentional edits and set hasUnsavedChanges
  const updateMappingDraft = (data: MappingData) => {
    setMappingDraft(data)
  }

  // Handle drag start
  const handleDragStart = (
    e: React.MouseEvent,
    elementType: "heading" | "heading2" | "descriptionTop" | "descriptionBody" | string
  ) => {
    e.preventDefault() // Prevent text selection
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentPos =
      elementType === "heading" || elementType === "descriptionTop" || elementType === "descriptionBody"
        ? mappingDraft?.[certificateType]?.[elementType]
        : mappingDraft?.[certificateType]?.attributes[elementType]

    if (!currentPos) return

    const elementX = (currentPos.x / 100) * rect.width
    const elementY = (currentPos.y / 100) * rect.height

    setDragOffset({
      x: e.clientX - rect.left - elementX,
      y: e.clientY - rect.top - elementY,
    })
    setDraggingElement(elementType)
  }

  // Handle drag
  useEffect(() => {
    if (!draggingElement || !canvasRef.current) return

    const SNAP_THRESHOLD = 5 // pixels threshold for snapping

    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return // Guard ref access
      
      // CRITICAL: Read from ref to avoid stale closure
      const currentDraft = mappingDraftRef.current
      if (!currentDraft) return
      
      const rect = canvasRef.current.getBoundingClientRect()
      
      // Calculate raw position (before snapping)
      let x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100
      let y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100

      // Get canvas center
      const centerX = 50 // 50% is horizontal center
      const centerY = 50 // 50% is vertical center

      // Calculate pixel difference from center
      const pixelX = (x / 100) * rect.width
      const pixelY = (y / 100) * rect.height
      const centerPixelX = rect.width / 2
      const centerPixelY = rect.height / 2

      const distanceFromCenterX = Math.abs(pixelX - centerPixelX)
      const distanceFromCenterY = Math.abs(pixelY - centerPixelY)

      // Snap to vertical center (X = 50%)
      let snappedToVertical = false
      if (distanceFromCenterX <= SNAP_THRESHOLD) {
        x = centerX
        snappedToVertical = true
      }

      // Snap to horizontal center (Y = 50%)
      let snappedToHorizontal = false
      if (distanceFromCenterY <= SNAP_THRESHOLD) {
        y = centerY
        snappedToHorizontal = true
      }

      // Update guide line visibility
      setShowVerticalGuide(snappedToVertical)
      setShowHorizontalGuide(snappedToHorizontal)

      // Clamp values
      const clampedX = Math.max(0, Math.min(100, x))
      const clampedY = Math.max(0, Math.min(100, y))

      const newData = structuredClone(currentDraft) as MappingData
      if (draggingElement === "heading" || draggingElement === "descriptionTop" || draggingElement === "descriptionBody") {
        newData[certificateType][draggingElement] = {
          ...newData[certificateType][draggingElement],
          x: clampedX,
          y: clampedY,
        }
      } else {
        // Ensure attributes object exists for heading2 and other attributes
        if (!newData[certificateType].attributes) {
          newData[certificateType].attributes = {}
        }
        // Preserve existing style or use default
        const existingAttr = newData[certificateType].attributes[draggingElement]
        newData[certificateType].attributes[draggingElement] = {
          x: clampedX,
          y: clampedY,
          style: existingAttr?.style || {
            fontFamily: "Inter",
            fontSize: 14,
            color: "#111827"
          }
        }
      }
      setMappingDraft(newData) // Update draft only
    }

    const handleMouseUp = () => {
      // Hide guide lines
      setShowVerticalGuide(false)
      setShowHorizontalGuide(false)
      
      // DO NOT write to sessionStorage on mouseup - only on explicit save
      setDraggingElement(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingElement, dragOffset, certificateType])

  // Update text
  const updateText = (
    field: "heading" | "descriptionTop" | "descriptionBody",
    text: string
  ) => {
    if (!mappingDraft) return
    const newData = structuredClone(mappingDraft) as MappingData
    newData[certificateType][field].text = text
    updateMappingDraft(newData)
  }

  if (!isDesktop) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center">
        <div className="mb-6">
          <Monitor className="w-24 h-24 text-muted-foreground mx-auto mb-4" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">
          Desktop Required
        </h2>
        <p className="text-muted-foreground max-w-md text-lg">
          Certificate Mapping is available on desktop for precise positioning.
        </p>
      </div>
    )
  }

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

  if (!templateUrl) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground text-lg">
          No base certificate template found. Please upload one first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Certificate Mapping
        </h1>
        <p className="text-muted-foreground">
          Configure your custom certificate mapping
        </p>
      </div>

      {/* Certificate Type Sub-tabs */}
      <div className="flex gap-4 items-center">
        {(["course", "webinar", "workshop"] as CertificateType[]).map((type) => (
          <button
            key={type}
            onClick={() => setCertificateType(type)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              certificateType === type
                ? "bg-background text-primary border-2 border-primary"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

      {/* Content */}
      <CustomMappingView
        templateUrl={templateUrl}
        certificateType={certificateType}
        setCertificateType={setCertificateType}
        mappingDraft={mappingDraft}
        mappingDraftRef={mappingDraftRef}
        attributes={certificateAttributes[certificateType]}
        updateText={updateText}
        handleDragStart={handleDragStart}
        draggingElement={draggingElement}
        canvasRef={canvasRef}
        toggleAttributeInDescription={toggleAttributeInDescription}
        updateStyle={updateStyle}
        showVerticalGuide={showVerticalGuide}
        showHorizontalGuide={showHorizontalGuide}
        onSaveSuccess={(savedData) => {
          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(savedData))
        }}
      />
    </div>
  )
}

// Custom Mapping View Component
function CustomMappingView({
  templateUrl,
  certificateType,
  setCertificateType,
  mappingDraft,
  mappingDraftRef,
  attributes,
  updateText,
  handleDragStart,
  draggingElement,
  canvasRef,
  toggleAttributeInDescription,
  updateStyle,
  showVerticalGuide,
  showHorizontalGuide,
  onSaveSuccess,
}: {
  templateUrl: string
  certificateType: CertificateType
  setCertificateType: (type: CertificateType) => void
  mappingDraft: MappingData | null
  mappingDraftRef: React.RefObject<MappingData | null>
  attributes: string[]
  updateText: (field: "heading" | "descriptionTop" | "descriptionBody", text: string) => void
  handleDragStart: (e: React.MouseEvent, elementType: string) => void
  draggingElement: string | null
  canvasRef: React.RefObject<HTMLDivElement | null>
  toggleAttributeInDescription: (attr: string, include: boolean) => void
  updateStyle: (blockType: "heading" | "descriptionTop" | "descriptionBody" | "attribute", blockName: string, property: "fontFamily" | "fontSize" | "color", value: string | number) => void
  showVerticalGuide: boolean
  showHorizontalGuide: boolean
  onSaveSuccess: (savedData: MappingData) => void
}) {
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [dirtyMap, setDirtyMap] = React.useState<Record<CertificateType, boolean>>({
    course: false,
    webinar: false,
    workshop: false,
  })
  const hasUnsavedChanges = dirtyMap[certificateType]
  
  const [isSaving, setIsSaving] = React.useState(false)

  // Check if mapping has content on mount and enable save
  React.useEffect(() => {
    if (mappingDraft && mappingDraft[certificateType]) {
      // If there's existing mapping data, mark as saveable
      setDirtyMap(prev => ({
        ...prev,
        [certificateType]: true,
      }))
    }
  }, [mappingDraft, certificateType])

  // Helper to mark dirty state (intentional edits only)
  const markDirty = () => {
    setDirtyMap(prev => ({
      ...prev,
      [certificateType]: true,
    }))
    setSaveSuccess(false)
  }

  // Wrapper for updateText that marks dirty state
  const handleUpdateText = (field: "heading" | "descriptionTop" | "descriptionBody", text: string) => {
    updateText(field, text)
    markDirty()
  }

  // Wrapper for updateStyle that marks dirty state
  const handleUpdateStyle = (blockType: "heading" | "descriptionTop" | "descriptionBody" | "attribute", blockName: string, property: "fontFamily" | "fontSize" | "color", value: string | number) => {
    updateStyle(blockType, blockName, property, value)
    markDirty()
  }

  // Wrapper for toggleAttributeInDescription that marks dirty state
  const handleToggleAttributeInDescription = (attr: string, include: boolean) => {
    toggleAttributeInDescription(attr, include)
    markDirty()
  }

  // Normalize mapping for rendering ONLY (applies backend font weight rules)
  // IMPORTANT: Does NOT mutate currentMapping - only used for preview display
  // Note: Must be called before any conditional returns to follow Rules of Hooks
  const currentMapping = mappingDraft?.[certificateType]
  const normalizedMapping = useMemo(() => 
    currentMapping ? normalizeCertificateMappings(currentMapping) : null, 
    [currentMapping]
  )

  if (!mappingDraft || !mappingDraft[certificateType]) return null
  if (!currentMapping) return null

  // Safety check for data structure
  if (!currentMapping.descriptionTop || !currentMapping.descriptionBody) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Loading mapping data...</p>
      </div>
    )
  }

  // All attributes are standalone - none are embedded
  const attributesInDescription = currentMapping.attributesInDescription || []
  const draggableAttributes = attributes.filter(attr => !attributesInDescription.includes(attr))

  // Check if an attribute is properly configured (ready to use)
  const isAttributeReady = (attr: string) => {
    // student_name is always ready (always draggable)
    if (attr === 'student_name') return true
    
    // workshop_name is always ready (always in description, auto-configured)
    if (attr === 'workshop_name') return true
    
    // host_name must be in description with correct syntax
    if (attr === 'host_name') {
      const descriptionText = currentMapping.descriptionBody.text
      return descriptionText.includes(`{${attr}}`)
    }
    
    // Other attributes:
    const isInDescription = attributesInDescription.includes(attr)
    
    if (isInDescription) {
      // If checkbox is checked, it must be in the description with correct syntax
      const descriptionText = currentMapping.descriptionBody.text
      return descriptionText.includes(`{${attr}}`)
    } else {
      // If checkbox is unchecked, it's draggable and always ready
      return true
    }
  }

  // Check if all attributes are ready (green)
  const allAttributesReady = attributes.every(attr => isAttributeReady(attr))

  // Handle save mapping
  const handleSaveMapping = async () => {
    if (!allAttributesReady || !hasUnsavedChanges) return
    
    // CRITICAL: Use ref to get latest draft (prevents stale closure bug)
    const latestDraft = mappingDraftRef.current
    if (!latestDraft || !latestDraft[certificateType]) return
    
    const latestMapping = latestDraft[certificateType]
    
    // Validate description body - extract all {attribute} placeholders
    const descriptionText = latestMapping.descriptionBody.text
    const attributePlaceholders = descriptionText.match(/\{([^}]+)\}/g) || []
    const attributesInText = attributePlaceholders.map((placeholder: string) => placeholder.replace(/[{}]/g, ''))
    
    // Check if any attribute in description doesn't exist in available attributes
    const invalidAttributes = attributesInText.filter((attr: string) => !attributes.includes(attr))
    
    if (invalidAttributes.length > 0) {
      toast.error(`Invalid attribute(s) in description: {${invalidAttributes.join('}, {')}}. These attributes are not available for ${certificateType}.`)
      return
    }
    
    // Save entire mappingDraft to backend (all certificate types)
    setIsSaving(true)
    try {
      // CRITICAL: Pass the entire mappingDraft to the API
      const response = await saveCertificateMapping(latestDraft)
      if (response.success) {
        // Show success toaster
        toast.success(response.message || 'Custom certificate mapping saved successfully')
        
        // Update saved state and sessionStorage ONLY after successful save
        // Use latestDraft from ref (guaranteed to be current)
        onSaveSuccess(latestDraft)
        
        // Mark as saved
        setDirtyMap(prev => ({
          ...prev,
          [certificateType]: false,
        }))
        setSaveSuccess(true)
      }
    } catch (error) {
      console.error('Failed to save certificate mapping:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save certificate mapping')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Left Panel - Editor (Scrollable) */}
      <div className="col-span-4 space-y-6 overflow-y-auto pr-2" style={{ maxHeight: 'calc(100vh - 180px)' }}>
        {/* Text Blocks */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Text Blocks</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Heading
              </label>
              <input
                type="text"
                value={currentMapping.heading.text}
                onChange={(e) => handleUpdateText("heading", e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use <span className="font-mono bg-muted px-1 rounded">&lt;br&gt;</span> to split into two lines (Heading 2)
              </p>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Description - Top
              </label>
              <textarea
                value={currentMapping.descriptionTop.text}
                onChange={(e) => handleUpdateText("descriptionTop", e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="e.g., This certificate is awarded to"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">
                Description - Body (Template)
              </label>
              <textarea
                value={currentMapping.descriptionBody.text}
                onChange={(e) => handleUpdateText("descriptionBody", e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                placeholder="Enter description text"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use <span className="font-mono bg-muted px-1 rounded">&lt;br&gt;</span> to break line
              </p>
            </div>
          </div>
        </div>

        {/* Attribute Fields */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Attribute Fields</h3>
          
          <div className="space-y-3">
            {attributes.map((attr) => {
              const isInDescription = attributesInDescription.includes(attr)
              // Only show checkbox for: course_name, completion_date, webinar_name, webinar_date, workshop_date
              const allowCheckbox = [
                'course_name',
                'completion_date',
                'webinar_name', 
                'webinar_date',
                'workshop_date'
              ].includes(attr)
              const isReady = isAttributeReady(attr)
              const IconComponent = ATTRIBUTE_ICONS[attr] || User
              
              return (
                <div key={attr} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium transition-colors ${
                      isReady ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    {ATTRIBUTE_LABELS[attr] || attr}
                  </div>
                  
                  {allowCheckbox && (
                    <label className="flex items-center gap-2 px-3 text-xs cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isInDescription}
                        onChange={(e) => handleToggleAttributeInDescription(attr, e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border text-primary focus:ring-2 focus:ring-primary cursor-pointer"
                      />
                      <span className="text-muted-foreground">
                        Include in description (not draggable)
                      </span>
                    </label>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 font-medium mb-1">Note:</p>
            <p className="text-xs text-blue-700">
              <strong>Green text</strong> = Ready to use<br/>
              <strong>Orange text</strong> = Missing in description<br/>
              <br/>
              If you check &ldquo;Include in description&rdquo;, write the attribute in the Description - Body field using this format:<br/>
              <span className="font-mono bg-white px-1 py-0.5 rounded border border-blue-300">
                {"{attribute_name}"}
              </span>
              <br/><br/>
              Examples:<br/>
              • <span className="font-mono text-xs">{"{course_name}"}</span><br/>
              • <span className="font-mono text-xs">{"{webinar_date}"}</span><br/>
              • <span className="font-mono text-xs">{"{completion_date}"}</span>
            </p>
          </div>
        </div>

        {/* Text Styling */}
        <div className="bg-card border border-border rounded-lg p-5">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Text Styling</h3>
          
          <div className="space-y-5">
            {/* Heading Styles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Main Heading</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                <select
                  value={currentMapping.heading.style.fontFamily}
                  onChange={(e) => handleUpdateStyle("heading", "heading", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: currentMapping.heading.style.fontFamily }}
                >
                  {FONT_OPTIONS.heading.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStyle("heading", "heading", "fontSize", Math.max(20, currentMapping.heading.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="20"
                      max="60"
                      value={currentMapping.heading.style.fontSize}
                      onChange={(e) => handleUpdateStyle("heading", "heading", "fontSize", Math.max(20, Math.min(60, parseInt(e.target.value) || 20)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleUpdateStyle("heading", "heading", "fontSize", Math.min(60, currentMapping.heading.style.fontSize + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">px</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                  <input
                    type="color"
                    value={currentMapping.heading.style.color}
                    onChange={(e) => handleUpdateStyle("heading", "heading", "color", e.target.value)}
                    className="w-12 h-7 border border-border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Heading 2 Styles (conditional) */}
            {currentMapping.heading.text.includes("<br>") && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Heading 2 (After Line Break)</h4>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateStyle("attribute", "heading2", "fontSize", Math.max(16, (currentMapping.attributes.heading2?.style.fontSize || 24) - 1))}
                        className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="16"
                        max="48"
                        value={currentMapping.attributes.heading2?.style.fontSize || 24}
                        onChange={(e) => handleUpdateStyle("attribute", "heading2", "fontSize", Math.max(16, Math.min(48, parseInt(e.target.value) || 16)))}
                        className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleUpdateStyle("attribute", "heading2", "fontSize", Math.min(48, (currentMapping.attributes.heading2?.style.fontSize || 24) + 1))}
                        className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                      >
                        +
                      </button>
                      <span className="text-xs text-muted-foreground ml-1">px</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Font family & color: Same as main heading
                  </p>
                </div>

                <div className="border-t border-border"></div>
              </>
            )}

            {/* Description Top Styles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Top Description</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                <select
                  value={currentMapping.descriptionTop.style.fontFamily}
                  onChange={(e) => handleUpdateStyle("descriptionTop", "descriptionTop", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: currentMapping.descriptionTop.style.fontFamily }}
                >
                  {FONT_OPTIONS.descriptionTop.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStyle("descriptionTop", "descriptionTop", "fontSize", Math.max(10, currentMapping.descriptionTop.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={currentMapping.descriptionTop.style.fontSize}
                      onChange={(e) => handleUpdateStyle("descriptionTop", "descriptionTop", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleUpdateStyle("descriptionTop", "descriptionTop", "fontSize", Math.min(24, currentMapping.descriptionTop.style.fontSize + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">px</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                  <input
                    type="color"
                    value={currentMapping.descriptionTop.style.color}
                    onChange={(e) => handleUpdateStyle("descriptionTop", "descriptionTop", "color", e.target.value)}
                    className="w-12 h-7 border border-border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Student Name Styles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Student Name</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                <select
                  value={currentMapping.attributes.student_name?.style.fontFamily || "Great Vibes"}
                  onChange={(e) => handleUpdateStyle("attribute", "student_name", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: currentMapping.attributes.student_name?.style.fontFamily || "Great Vibes" }}
                >
                  {FONT_OPTIONS.studentName.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStyle("attribute", "student_name", "fontSize", Math.max(18, (currentMapping.attributes.student_name?.style.fontSize || 28) - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="18"
                      max="48"
                      value={currentMapping.attributes.student_name?.style.fontSize || 28}
                      onChange={(e) => handleUpdateStyle("attribute", "student_name", "fontSize", Math.max(18, Math.min(48, parseInt(e.target.value) || 18)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleUpdateStyle("attribute", "student_name", "fontSize", Math.min(48, (currentMapping.attributes.student_name?.style.fontSize || 28) + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">px</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                  <input
                    type="color"
                    value={currentMapping.attributes.student_name?.style.color || "#111827"}
                    onChange={(e) => handleUpdateStyle("attribute", "student_name", "color", e.target.value)}
                    className="w-12 h-7 border border-border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Draggable Attribute Styles (conditional) */}
            {[
              { attr: 'course_name', label: 'Course Name' },
              { attr: 'completion_date', label: 'Completion Date' },
              { attr: 'webinar_name', label: 'Webinar Name' },
              { attr: 'webinar_date', label: 'Webinar Date' },
              { attr: 'workshop_date', label: 'Workshop Date' },
            ].map(({ attr, label }) => {
              const isInDescription = attributesInDescription.includes(attr)
              const hasAttribute = attributes.includes(attr)
              
              // Only show styling controls if attribute exists AND is draggable (not in description)
              if (!hasAttribute || isInDescription) return null
              
              const attrStyle = currentMapping.attributes[attr]?.style || {
                fontFamily: "Inter",
                fontSize: 14,
                color: "#111827"
              }
              
              return (
                <React.Fragment key={attr}>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-foreground">{label}</h4>
                    
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                      <select
                        value={attrStyle.fontFamily}
                        onChange={(e) => handleUpdateStyle("attribute", attr, "fontFamily", e.target.value)}
                        className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        style={{ fontFamily: attrStyle.fontFamily }}
                      >
                        {FONT_OPTIONS.descriptionBody.map((font) => (
                          <option key={font} value={font} style={{ fontFamily: font }}>
                            {font}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleUpdateStyle("attribute", attr, "fontSize", Math.max(10, attrStyle.fontSize - 1))}
                            className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="10"
                            max="32"
                            value={attrStyle.fontSize}
                            onChange={(e) => handleUpdateStyle("attribute", attr, "fontSize", Math.max(10, Math.min(32, parseInt(e.target.value) || 10)))}
                            className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => handleUpdateStyle("attribute", attr, "fontSize", Math.min(32, attrStyle.fontSize + 1))}
                            className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                          >
                            +
                          </button>
                          <span className="text-xs text-muted-foreground ml-1">px</span>
                        </div>
                      </div>

                      <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                        <input
                          type="color"
                          value={attrStyle.color}
                          onChange={(e) => handleUpdateStyle("attribute", attr, "color", e.target.value)}
                          className="w-12 h-7 border border-border rounded cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-border"></div>
                </React.Fragment>
              )
            })}

            {/* Description Body Styles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Description Body</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                <select
                  value={currentMapping.descriptionBody.style.fontFamily}
                  onChange={(e) => handleUpdateStyle("descriptionBody", "descriptionBody", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: currentMapping.descriptionBody.style.fontFamily }}
                >
                  {FONT_OPTIONS.descriptionBody.map((font) => (
                    <option key={font} value={font} style={{ fontFamily: font }}>
                      {font}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleUpdateStyle("descriptionBody", "descriptionBody", "fontSize", Math.max(10, currentMapping.descriptionBody.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={currentMapping.descriptionBody.style.fontSize}
                      onChange={(e) => handleUpdateStyle("descriptionBody", "descriptionBody", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => handleUpdateStyle("descriptionBody", "descriptionBody", "fontSize", Math.min(24, currentMapping.descriptionBody.style.fontSize + 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      +
                    </button>
                    <span className="text-xs text-muted-foreground ml-1">px</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Color</label>
                  <input
                    type="color"
                    value={currentMapping.descriptionBody.style.color}
                    onChange={(e) => handleUpdateStyle("descriptionBody", "descriptionBody", "color", e.target.value)}
                    className="w-12 h-7 border border-border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Live Preview (Sticky) */}
      <div className="col-span-8 sticky top-6 self-start">
        <div className="bg-card border border-border rounded-lg p-6">
          <h3 className="text-sm font-semibold mb-4 text-foreground">Live Preview</h3>

          {/* Always-mounted preview with skeleton overlay */}
          <div className="relative w-full aspect-[1.414/1] bg-muted rounded-lg overflow-hidden">
            
            {/* Skeleton overlay (visible on mount and certificateType switch) */}
            {/* Preview content */}
            {!normalizedMapping ? (
              <div className="flex items-center justify-center h-full">
                <Loader size="large" />
              </div>
            ) : (
            <div
              ref={canvasRef}
              className="relative w-full h-full select-none"
              style={{ cursor: draggingElement ? "grabbing" : "default", userSelect: "none" }}
            >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={templateUrl}
              alt="Base Certificate"
              className="w-full h-full object-contain pointer-events-none"
            />

            {/* Center Guide Lines */}
            {showVerticalGuide && (
              <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none"
                style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
              />
            )}
            {showHorizontalGuide && (
              <div
                className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
              />
            )}

            {/* Heading */}
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                draggingElement === "heading" ? "opacity-70" : ""
              }`}
              style={{
                left: `${currentMapping.heading.x}%`,
                top: `${currentMapping.heading.y}%`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleDragStart(e, "heading")}
            >
              <div 
                className="text-center font-bold whitespace-nowrap px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                style={{
                  fontFamily: normalizedMapping.heading.style.fontFamily,
                  fontSize: `${normalizedMapping.heading.style.fontSize}px`,
                  color: normalizedMapping.heading.style.color,
                  fontWeight: normalizedMapping.heading.style.fontWeight || 700,
                  userSelect: "none",
                }}
              >
                {normalizedMapping.heading.text.includes("<br>") 
                  ? normalizedMapping.heading.text.split("<br>")[0]
                  : normalizedMapping.heading.text}
              </div>
            </div>

            {/* Heading 2 (if exists) */}
            {normalizedMapping.heading.text.includes("<br>") && (
              <div
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                  draggingElement === "heading2" ? "opacity-70" : ""
                }`}
                style={{
                  left: `${normalizedMapping.attributes.heading2?.x || 50}%`,
                  top: `${normalizedMapping.attributes.heading2?.y || 26}%`,
                  userSelect: "none",
                }}
                onMouseDown={(e) => handleDragStart(e, "heading2")}
              >
                <div 
                  className="text-center whitespace-nowrap px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                  style={{
                    fontFamily: normalizedMapping.heading.style.fontFamily,
                    fontSize: `${normalizedMapping.attributes.heading2?.style.fontSize || 24}px`,
                    color: normalizedMapping.heading.style.color,
                    fontWeight: normalizedMapping.attributes.heading2?.style.fontWeight || 600,
                    userSelect: "none",
                  }}
                >
                  {normalizedMapping.heading.text.split("<br>")[1] || ""}
                </div>
              </div>
            )}

            {/* Description Top */}
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                draggingElement === "descriptionTop" ? "opacity-70" : ""
              }`}
              style={{
                left: `${normalizedMapping.descriptionTop.x}%`,
                top: `${normalizedMapping.descriptionTop.y}%`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleDragStart(e, "descriptionTop")}
            >
              <div 
                className="text-center px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                style={{
                  fontFamily: normalizedMapping.descriptionTop.style.fontFamily,
                  fontSize: `${normalizedMapping.descriptionTop.style.fontSize}px`,
                  color: normalizedMapping.descriptionTop.style.color,
                  fontWeight: normalizedMapping.descriptionTop.style.fontWeight || 400,
                  userSelect: "none",
                }}
              >
                {normalizedMapping.descriptionTop.text}
              </div>
            </div>

            {/* All Draggable Attributes (excluding those in description) */}
            {draggableAttributes.map((attr) => {
              const pos = normalizedMapping.attributes[attr]
              if (!pos) return null
              
              // Determine style based on attribute type
              let attrStyle = pos.style
              if (attr === 'student_name') {
                // Student name always uses its own style
                attrStyle = normalizedMapping.attributes.student_name?.style || {
                  fontFamily: "Great Vibes",
                  fontSize: 28,
                  color: "#111827",
                  fontWeight: 600
                }
              }
              // Other draggable attributes use their stored style
              
              return (
                <div
                  key={attr}
                  className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                    draggingElement === attr ? "opacity-70" : ""
                  }`}
                  style={{ left: `${pos.x}%`, top: `${pos.y}%`, userSelect: "none" }}
                  onMouseDown={(e) => handleDragStart(e, attr)}
                >
                  <div 
                    className="text-center font-semibold px-3 py-1 hover:bg-primary/10 rounded transition-colors whitespace-nowrap select-none"
                    style={{
                      fontFamily: attrStyle.fontFamily,
                      fontSize: `${attrStyle.fontSize}px`,
                      color: attrStyle.color,
                      fontWeight: attrStyle.fontWeight || 500,
                      userSelect: "none",
                    }}
                  >
                    {MOCK_DATA[attr]}
                  </div>
                </div>
              )
            })}

            {/* Description Body - supports <br> tags and replaces {attribute} placeholders */}
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 max-w-[80%] cursor-grab active:cursor-grabbing select-none ${
                draggingElement === "descriptionBody" ? "opacity-70" : ""
              }`}
              style={{
                left: `${normalizedMapping.descriptionBody.x}%`,
                top: `${normalizedMapping.descriptionBody.y}%`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleDragStart(e, "descriptionBody")}
            >
              <div 
                className="text-center px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                style={{
                  fontFamily: normalizedMapping.descriptionBody.style.fontFamily,
                  fontSize: `${normalizedMapping.descriptionBody.style.fontSize}px`,
                  color: normalizedMapping.descriptionBody.style.color,
                  fontWeight: normalizedMapping.descriptionBody.style.fontWeight || 400,
                  userSelect: "none",
                }}
                dangerouslySetInnerHTML={{ 
                  __html: normalizedMapping.descriptionBody.text
                    .replace(/<br>/gi, '<br/>')
                    .replace(/\{([^}]+)\}/g, (match, attrName) => {
                      const value = MOCK_DATA[attrName] || match
                      // Apply bold fontWeight (600) for better visibility in description
                      return `<span style="font-weight: 600 !important; display: inline;">${value}</span>`
                    })
                }}
              />
            </div>
          </div>
            )}
          </div>

        </div>

        {/* Save Button - Outside preview, bottom right */}
        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button
                onClick={handleSaveMapping}
                disabled={!hasUnsavedChanges || isSaving}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg ${
                  saveSuccess && !hasUnsavedChanges
                    ? "bg-green-600 text-white cursor-default"
                    : hasUnsavedChanges && !isSaving
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                }`}
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : saveSuccess && !hasUnsavedChanges ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Saved!
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Save Mapping
                  </span>
                )}
              </button>
              {!allAttributesReady && hasUnsavedChanges && (
                <p className="text-xs text-orange-600 mt-2">
                  Some attributes in description are missing placeholders
                </p>
              )}
            </div>
            
            {/* Next Step Button - Only show when saved and not on workshop */}
            {saveSuccess && !hasUnsavedChanges && certificateType !== 'workshop' && (
              <button
                onClick={() => {
                  const nextType = certificateType === 'course' ? 'webinar' : 'workshop'
                  setCertificateType(nextType)
                }}
                className="px-6 py-2.5 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
              >
                <span>Next: {certificateType === 'course' ? 'Webinar' : 'Workshop'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* Generate Certificates Button - Only show after workshop mapping is saved */}
            {saveSuccess && !hasUnsavedChanges && certificateType === 'workshop' && (
              <button
                onClick={() => window.location.href = '/generate/course'}
                className="px-6 py-2.5 rounded-lg font-medium text-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-lg flex items-center gap-2"
              >
                <span>Generate Certificates</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
