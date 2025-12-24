"use client"

import { useAuth } from "@/lib/auth"
import React, { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { getBaseCertificateTemplate, fetchCertificateAttributes, saveCertificateMapping } from "@/lib/api/certificates"
import { Monitor, User, BookOpen, Calendar, Video, UserCircle, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Loader from "@/components/loader"

// Types
type CertificateType = "course" | "webinar" | "workshop"
type MainTab = "default" | "custom"

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

type MappingData = Record<CertificateType, CertificateMapping>

// Constants
const DEFAULT_HEADINGS = {
  course: "Certificate of Completion",
  webinar: "Certificate of Participation",
  workshop: "Certificate of<br>Workshop Completion",
}

const DEFAULT_DESCRIPTION_TOP = "This certificate is awarded to"

const DESCRIPTION_BODY_TEMPLATES = {
  course: "Has successfully completed the",
  webinar: "In recognition of participation in",
  workshop: "For completing a workshop",
}

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

// Default positions for "Our Default Mapping" preview
const getDefaultPositions = (type: CertificateType, attributes: string[]) => {
  const positions: Record<string, { x: number; y: number }> = {}
  
  if (type === 'course') {
    // Course: Heading, Description, Student Name, Description Body (with course_name), Date
    positions.heading = { x: 50, y: 15 }
    positions.descriptionTop = { x: 50, y: 28 }
    positions.student_name = { x: 50, y: 38 }
    positions.descriptionBody = { x: 50, y: 55 }
    // Add completion_date if it exists - shown separately
    if (attributes.includes('completion_date')) {
      positions.completion_date = { x: 50, y: 70 }
    }
  } else if (type === 'webinar') {
    // Webinar: Heading, Description, Student Name, Description Body (with webinar_name + host_name), Date
    positions.heading = { x: 50, y: 15 }
    positions.descriptionTop = { x: 50, y: 28 }
    positions.student_name = { x: 50, y: 38 }
    positions.descriptionBody = { x: 50, y: 55 }
    // Add webinar_date if it exists - shown separately
    if (attributes.includes('webinar_date')) {
      positions.webinar_date = { x: 50, y: 70 }
    }
  } else if (type === 'workshop') {
    // Workshop: Heading, Description, Student Name, Description Body (includes workshop_name + workshop_date)
    positions.heading = { x: 50, y: 20 }
    positions.descriptionTop = { x: 50, y: 33 }
    positions.student_name = { x: 50, y: 43 }
    positions.descriptionBody = { x: 50, y: 60 }
    // workshop_date is embedded in description body, not shown separately
  }
  
  return positions
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
  const [mainTab, setMainTab] = useState<MainTab>("default")
  const [certificateType, setCertificateType] = useState<CertificateType>("course")
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null)
  const [mappingData, setMappingData] = useState<MappingData | null>(null) // Only used for custom mapping
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
  const [isCustomMappingLocked, setIsCustomMappingLocked] = useState(false)

  // Load Google Fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Libre+Baskerville:wght@400;700&family=Cormorant+Garamond:wght@400;700&family=Merriweather:wght@400;700&family=Inter:wght@400;600&family=Source+Sans+3:wght@400;600&family=Open+Sans:wght@400;600&family=Lato:wght@400;700&family=Great+Vibes&family=Allura&family=Pinyon+Script&family=Roboto:wght@400;500&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  // Check if desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024) // lg breakpoint
    }
    checkDesktop()
    window.addEventListener("resize", checkDesktop)
    return () => window.removeEventListener("resize", checkDesktop)
  }, [])

  // Check plan and lock custom mapping for free users
  useEffect(() => {
    try {
      const planStr = sessionStorage.getItem('plan')
      if (planStr) {
        const plan = JSON.parse(planStr)
        setIsCustomMappingLocked(plan.name === 'free')
      }
    } catch (error) {
      console.error('Failed to check plan:', error)
    }
  }, [])

  // Load certificate attributes from API
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const attributes = await fetchCertificateAttributes()
        if (attributes) {
          setCertificateAttributes(attributes)
          sessionStorage.setItem(ATTRIBUTES_STORAGE_KEY, JSON.stringify(attributes))
        }
      } catch (error) {
        console.error("Failed to fetch certificate attributes:", error)
        // Fallback to sessionStorage if API fails
        const storedAttributes = sessionStorage.getItem(ATTRIBUTES_STORAGE_KEY)
        if (storedAttributes) {
          try {
            const parsed = JSON.parse(storedAttributes)
            setCertificateAttributes(parsed)
          } catch (parseError) {
            console.error("Failed to parse stored certificate attributes:", parseError)
          }
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
    if (!mappingData || mainTab !== 'custom') return // Only allow in custom mode
    const newData = JSON.parse(JSON.stringify(mappingData)) as MappingData
    
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
    
    saveMappingData(newData)
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
        setTemplateUrl(response.data.template_url)
      } catch (error) {
        console.error("Failed to load base certificate:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplate()
  }, [])

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

  // Load mapping data from sessionStorage ONLY for custom mapping
  useEffect(() => {
    if (mainTab !== 'custom') return // Skip if in default mode
    if (certificateAttributes.course.length === 0) return // Wait for attributes to load

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
                x: (typeData.descriptionBody as any)?.x ?? 50,
                y: (typeData.descriptionBody as any)?.y ?? 70,
                style: (typeData.descriptionBody as any)?.style || { fontFamily: "Roboto", fontSize: 14, color: "#4B5563" }
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
            if (type === 'webinar' && certificateAttributes[type].includes('host_name')) autoInclude.push('host_name')
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
        
        setMappingData(migratedData)
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
  }, [certificateAttributes.course.length, certificateAttributes.webinar.length, certificateAttributes.workshop.length, mainTab])

  const initializeFreshData = () => {
    const initialData: MappingData = {} as MappingData

    ;(["course", "webinar", "workshop"] as CertificateType[]).forEach((type) => {
      const attrs = certificateAttributes[type]
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
    
    setMappingData(initialData)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
  }

  // Toggle attribute inclusion in description
  const toggleAttributeInDescription = (attr: string, include: boolean) => {
    if (!mappingData || mainTab !== 'custom') return // Only allow in custom mode
    const newData = { ...mappingData }
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
    
    saveMappingData(newData)
  }

  // Save mapping data to sessionStorage (only for custom mapping)
  const saveMappingData = (data: MappingData) => {
    if (mainTab !== 'custom') return // Don't save in default mode
    if (isCustomMappingLocked) return // Don't save if feature is locked
    setMappingData(data)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  // Handle drag start
  const handleDragStart = (
    e: React.MouseEvent,
    elementType: "heading" | "heading2" | "descriptionTop" | "descriptionBody" | string
  ) => {
    if (mainTab !== 'custom') return // Only allow dragging in custom mode
    e.preventDefault() // Prevent text selection
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentPos =
      elementType === "heading" || elementType === "descriptionTop" || elementType === "descriptionBody"
        ? mappingData?.[certificateType]?.[elementType]
        : mappingData?.[certificateType]?.attributes[elementType]

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
    if (!draggingElement || !canvasRef.current || !mappingData) return

    const SNAP_THRESHOLD = 5 // pixels threshold for snapping

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvasRef.current!.getBoundingClientRect()
      
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

      const newData = { ...mappingData }
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
      setMappingData(newData)
    }

    const handleMouseUp = () => {
      // Hide guide lines
      setShowVerticalGuide(false)
      setShowHorizontalGuide(false)
      
      if (mappingData) {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(mappingData))
      }
      setDraggingElement(null)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [draggingElement, dragOffset, mappingData, certificateType])

  // Update text
  const updateText = (
    field: "heading" | "descriptionTop" | "descriptionBody",
    text: string
  ) => {
    if (!mappingData) return
    const newData = { ...mappingData }
    newData[certificateType][field].text = text
    saveMappingData(newData)
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
          Control how your certificate content is placed on the template
        </p>
      </div>

      {/* Main Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-8">
          <button
            onClick={() => setMainTab("default")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              mainTab === "default"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Our Default Mapping
          </button>
          <div className="relative group">
            <button
              onClick={() => !isCustomMappingLocked && setMainTab("custom")}
              disabled={isCustomMappingLocked}
              className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                mainTab === "custom"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              } ${isCustomMappingLocked ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              Custom Mapping
              {isCustomMappingLocked && (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
            {isCustomMappingLocked && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:block z-50">
                <div className="bg-popover text-popover-foreground text-xs rounded-md py-2 px-3 shadow-md border border-border whitespace-nowrap">
                  <p className="font-medium">🔒 Premium Feature</p>
                  <p className="text-muted-foreground mt-0.5">Upgrade to unlock</p>
                </div>
              </div>
            )}
          </div>
        </div>
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
      {mainTab === "default" ? (
        <DefaultMappingView
          templateUrl={templateUrl}
          certificateType={certificateType}
          attributes={certificateAttributes[certificateType]}
        />
      ) : (
        <CustomMappingView
          templateUrl={templateUrl}
          certificateType={certificateType}
          setCertificateType={setCertificateType}
          mappingData={mappingData}
          attributes={certificateAttributes[certificateType]}
          updateText={updateText}
          handleDragStart={handleDragStart}
          draggingElement={draggingElement}
          canvasRef={canvasRef}
          toggleAttributeInDescription={toggleAttributeInDescription}
          updateStyle={updateStyle}
          showVerticalGuide={showVerticalGuide}
          showHorizontalGuide={showHorizontalGuide}
        />
      )}
    </div>
  )
}

// Default Mapping View Component
function DefaultMappingView({
  templateUrl,
  certificateType,
  attributes,
}: {
  templateUrl: string
  certificateType: CertificateType
  attributes: string[]
}) {
  const positions = getDefaultPositions(certificateType, attributes)

  // Professional font styles for each element
  const styles = {
    heading: {
      fontFamily: 'Playfair Display',
      fontSize: '40px',
      fontWeight: '700',
      color: '#1a1a1a',
      letterSpacing: '1px'
    },
    descriptionTop: {
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: '400',
      color: '#4a5568',
      letterSpacing: '0.5px'
    },
    studentName: {
      fontFamily: 'Great Vibes',
      fontSize: '48px',
      fontWeight: '400',
      color: '#2d3748',
      letterSpacing: '1px'
    },
    descriptionBody: {
      fontFamily: 'Roboto',
      fontSize: '18px',
      fontWeight: '400',
      color: '#4a5568',
      lineHeight: '1.6'
    },
    date: {
      fontFamily: 'Inter',
      fontSize: '16px',
      fontWeight: '500',
      color: '#2d3748',
      letterSpacing: '0.5px'
    }
  }

  // Get the date attribute based on certificate type
  const getDateAttribute = () => {
    if (certificateType === 'course' && attributes.includes('completion_date')) {
      return 'completion_date'
    } else if (certificateType === 'webinar' && attributes.includes('webinar_date')) {
      return 'webinar_date'
    } else if (certificateType === 'workshop' && attributes.includes('workshop_date')) {
      return 'workshop_date'
    }
    return null
  }

  const dateAttribute = getDateAttribute()

  // Get complete description body with interpolated values (only for attributes that exist in session)
  const getDescriptionBodyText = () => {
    if (certificateType === 'course') {
      if (attributes.includes('course_name')) {
        return `Has successfully completed the ${MOCK_DATA.course_name}`
      }
      return 'Has successfully completed the'
    } else if (certificateType === 'webinar') {
      const hasWebinarName = attributes.includes('webinar_name')
      const hasHostName = attributes.includes('host_name')
      
      if (hasWebinarName && hasHostName) {
        return `In recognition of participation in ${MOCK_DATA.webinar_name} hosted by ${MOCK_DATA.host_name}`
      } else if (hasWebinarName) {
        return `In recognition of participation in ${MOCK_DATA.webinar_name}`
      }
      return 'In recognition of participation in'
    } else if (certificateType === 'workshop') {
      const hasWorkshopName = attributes.includes('workshop_name')
      const hasWorkshopDate = attributes.includes('workshop_date')
      
      if (hasWorkshopName && hasWorkshopDate) {
        return `For completing a ${MOCK_DATA.workshop_name} on ${MOCK_DATA.workshop_date}`
      } else if (hasWorkshopName) {
        return `For completing a ${MOCK_DATA.workshop_name}`
      }
      return 'For completing a workshop'
    }
    return ''
  }

  return (
    <div className="bg-card border border-border rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Preview - Our Default Mapping</h3>
        <Badge variant="outline" className="text-xs">
          System Defined Layout • Professional Fonts
        </Badge>
      </div>

      <div className="relative w-full max-w-4xl mx-auto aspect-[1.414/1] bg-muted rounded-lg overflow-hidden">
        <img
          src={templateUrl}
          alt="Base Certificate"
          className="w-full h-full object-contain"
        />

        {/* Heading */}
        {positions.heading && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${positions.heading.x}%`, top: `${positions.heading.y}%` }}
          >
            <div 
              className="text-center whitespace-nowrap" 
              style={styles.heading}
              dangerouslySetInnerHTML={{ 
                __html: DEFAULT_HEADINGS[certificateType].replace(/<br>/gi, '<br/>') 
              }}
            />
          </div>
        )}

        {/* Description Top */}
        {positions.descriptionTop && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${positions.descriptionTop.x}%`, top: `${positions.descriptionTop.y}%` }}
          >
            <div className="text-center" style={styles.descriptionTop}>
              {DEFAULT_DESCRIPTION_TOP}
            </div>
          </div>
        )}

        {/* Student Name */}
        {positions.student_name && attributes.includes('student_name') && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${positions.student_name.x}%`, top: `${positions.student_name.y}%` }}
          >
            <div className="text-center" style={styles.studentName}>
              {MOCK_DATA.student_name}
            </div>
          </div>
        )}

        {/* Description Body - with embedded attribute values */}
        {positions.descriptionBody && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2 max-w-[80%]"
            style={{ left: `${positions.descriptionBody.x}%`, top: `${positions.descriptionBody.y}%` }}
          >
            <div className="text-center" style={styles.descriptionBody}>
              {getDescriptionBodyText()}
            </div>
          </div>
        )}

        {/* Date - only show if NOT already in description body */}
        {dateAttribute && positions[dateAttribute] && certificateType !== 'workshop' && (
          <div
            className="absolute transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${positions[dateAttribute].x}%`, top: `${positions[dateAttribute].y}%` }}
          >
            <div className="text-center" style={styles.date}>
              {MOCK_DATA[dateAttribute]}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Custom Mapping View Component
function CustomMappingView({
  templateUrl,
  certificateType,
  setCertificateType,
  mappingData,
  attributes,
  updateText,
  handleDragStart,
  draggingElement,
  canvasRef,
  toggleAttributeInDescription,
  updateStyle,
  showVerticalGuide,
  showHorizontalGuide,
}: {
  templateUrl: string
  certificateType: CertificateType
  setCertificateType: (type: CertificateType) => void
  mappingData: MappingData | null
  attributes: string[]
  updateText: (field: "heading" | "descriptionTop" | "descriptionBody", text: string) => void
  handleDragStart: (e: React.MouseEvent, elementType: string) => void
  draggingElement: string | null
  canvasRef: React.RefObject<HTMLDivElement | null>
  toggleAttributeInDescription: (attr: string, include: boolean) => void
  updateStyle: (blockType: "heading" | "descriptionTop" | "descriptionBody" | "attribute", blockName: string, property: "fontFamily" | "fontSize" | "color", value: string | number) => void
  showVerticalGuide: boolean
  showHorizontalGuide: boolean
}) {
  const [saveSuccess, setSaveSuccess] = React.useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false)

  // Reset save state when certificate type changes
  React.useEffect(() => {
    setSaveSuccess(false)
    setHasUnsavedChanges(false)
  }, [certificateType])

  // Mark as having unsaved changes whenever mappingData changes
  React.useEffect(() => {
    const handleChange = () => {
      setHasUnsavedChanges(true)
      setSaveSuccess(false)
    }
    
    // This runs when user makes any change to mappingData
    if (mappingData) {
      handleChange()
    }
  }, [mappingData])

  if (!mappingData || !mappingData[certificateType]) return null

  const currentMapping = mappingData[certificateType]

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
    
    // Validate description body - extract all {attribute} placeholders
    const descriptionText = currentMapping.descriptionBody.text
    const attributePlaceholders = descriptionText.match(/\{([^}]+)\}/g) || []
    const attributesInText = attributePlaceholders.map(placeholder => placeholder.replace(/[{}]/g, ''))
    
    // Check if any attribute in description doesn't exist in available attributes
    const invalidAttributes = attributesInText.filter(attr => !attributes.includes(attr))
    
    if (invalidAttributes.length > 0) {
      const toastEvent = new CustomEvent('showToast', {
        detail: {
          message: `Invalid attribute(s) in description: {${invalidAttributes.join('}, {')}}. These attributes are not available for ${certificateType}.`,
          type: 'error'
        }
      })
      window.dispatchEvent(toastEvent)
      return
    }
    
    // If this is workshop tab, call the API to save to backend
    if (certificateType === 'workshop') {
      try {
        const response = await saveCertificateMapping()
        if (response.success) {
          // Show success toaster
          const toastEvent = new CustomEvent('showToast', {
            detail: {
              message: response.message || 'Custom certificate mapping saved successfully',
              type: 'success'
            }
          })
          window.dispatchEvent(toastEvent)
        }
      } catch (error) {
        console.error('Failed to save certificate mapping:', error)
        const toastEvent = new CustomEvent('showToast', {
          detail: {
            message: error instanceof Error ? error.message : 'Failed to save certificate mapping',
            type: 'error'
          }
        })
        window.dispatchEvent(toastEvent)
        return
      }
    }
    
    // Save to sessionStorage (already done automatically, but we show confirmation)
    setHasUnsavedChanges(false)
    setSaveSuccess(true)
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
                onChange={(e) => updateText("heading", e.target.value)}
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
                onChange={(e) => updateText("descriptionTop", e.target.value)}
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
                onChange={(e) => updateText("descriptionBody", e.target.value)}
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
                        onChange={(e) => toggleAttributeInDescription(attr, e.target.checked)}
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
                  onChange={(e) => updateStyle("heading", "heading", "fontFamily", e.target.value)}
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
                      onClick={() => updateStyle("heading", "heading", "fontSize", Math.max(20, currentMapping.heading.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="20"
                      max="60"
                      value={currentMapping.heading.style.fontSize}
                      onChange={(e) => updateStyle("heading", "heading", "fontSize", Math.max(20, Math.min(60, parseInt(e.target.value) || 20)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateStyle("heading", "heading", "fontSize", Math.min(60, currentMapping.heading.style.fontSize + 1))}
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
                    onChange={(e) => updateStyle("heading", "heading", "color", e.target.value)}
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
                        onClick={() => updateStyle("attribute", "heading2", "fontSize", Math.max(16, (currentMapping.attributes.heading2?.style.fontSize || 24) - 1))}
                        className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="16"
                        max="48"
                        value={currentMapping.attributes.heading2?.style.fontSize || 24}
                        onChange={(e) => updateStyle("attribute", "heading2", "fontSize", Math.max(16, Math.min(48, parseInt(e.target.value) || 16)))}
                        className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => updateStyle("attribute", "heading2", "fontSize", Math.min(48, (currentMapping.attributes.heading2?.style.fontSize || 24) + 1))}
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
                  onChange={(e) => updateStyle("descriptionTop", "descriptionTop", "fontFamily", e.target.value)}
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
                      onClick={() => updateStyle("descriptionTop", "descriptionTop", "fontSize", Math.max(10, currentMapping.descriptionTop.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={currentMapping.descriptionTop.style.fontSize}
                      onChange={(e) => updateStyle("descriptionTop", "descriptionTop", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateStyle("descriptionTop", "descriptionTop", "fontSize", Math.min(24, currentMapping.descriptionTop.style.fontSize + 1))}
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
                    onChange={(e) => updateStyle("descriptionTop", "descriptionTop", "color", e.target.value)}
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
                  onChange={(e) => updateStyle("attribute", "student_name", "fontFamily", e.target.value)}
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
                      onClick={() => updateStyle("attribute", "student_name", "fontSize", Math.max(18, (currentMapping.attributes.student_name?.style.fontSize || 28) - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="18"
                      max="48"
                      value={currentMapping.attributes.student_name?.style.fontSize || 28}
                      onChange={(e) => updateStyle("attribute", "student_name", "fontSize", Math.max(18, Math.min(48, parseInt(e.target.value) || 18)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateStyle("attribute", "student_name", "fontSize", Math.min(48, (currentMapping.attributes.student_name?.style.fontSize || 28) + 1))}
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
                    onChange={(e) => updateStyle("attribute", "student_name", "color", e.target.value)}
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
                        onChange={(e) => updateStyle("attribute", attr, "fontFamily", e.target.value)}
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
                            onClick={() => updateStyle("attribute", attr, "fontSize", Math.max(10, attrStyle.fontSize - 1))}
                            className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="10"
                            max="32"
                            value={attrStyle.fontSize}
                            onChange={(e) => updateStyle("attribute", attr, "fontSize", Math.max(10, Math.min(32, parseInt(e.target.value) || 10)))}
                            className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <button
                            onClick={() => updateStyle("attribute", attr, "fontSize", Math.min(32, attrStyle.fontSize + 1))}
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
                          onChange={(e) => updateStyle("attribute", attr, "color", e.target.value)}
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
                  onChange={(e) => updateStyle("descriptionBody", "descriptionBody", "fontFamily", e.target.value)}
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
                      onClick={() => updateStyle("descriptionBody", "descriptionBody", "fontSize", Math.max(10, currentMapping.descriptionBody.style.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={currentMapping.descriptionBody.style.fontSize}
                      onChange={(e) => updateStyle("descriptionBody", "descriptionBody", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateStyle("descriptionBody", "descriptionBody", "fontSize", Math.min(24, currentMapping.descriptionBody.style.fontSize + 1))}
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
                    onChange={(e) => updateStyle("descriptionBody", "descriptionBody", "color", e.target.value)}
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

          <div
            ref={canvasRef}
            className="relative w-full aspect-[1.414/1] bg-muted rounded-lg overflow-hidden select-none"
            style={{ cursor: draggingElement ? "grabbing" : "default", userSelect: "none" }}
          >
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
                  fontFamily: currentMapping.heading.style.fontFamily,
                  fontSize: `${currentMapping.heading.style.fontSize}px`,
                  color: currentMapping.heading.style.color,
                  userSelect: "none",
                }}
              >
                {currentMapping.heading.text.includes("<br>") 
                  ? currentMapping.heading.text.split("<br>")[0]
                  : currentMapping.heading.text}
              </div>
            </div>

            {/* Heading 2 (if exists) */}
            {currentMapping.heading.text.includes("<br>") && (
              <div
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                  draggingElement === "heading2" ? "opacity-70" : ""
                }`}
                style={{
                  left: `${currentMapping.attributes.heading2?.x || 50}%`,
                  top: `${currentMapping.attributes.heading2?.y || 26}%`,
                  userSelect: "none",
                }}
                onMouseDown={(e) => handleDragStart(e, "heading2")}
              >
                <div 
                  className="text-center whitespace-nowrap px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                  style={{
                    fontFamily: currentMapping.heading.style.fontFamily,
                    fontSize: `${currentMapping.attributes.heading2?.style.fontSize || 24}px`,
                    color: currentMapping.heading.style.color,
                    userSelect: "none",
                  }}
                >
                  {currentMapping.heading.text.split("<br>")[1] || ""}
                </div>
              </div>
            )}

            {/* Description Top */}
            <div
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing select-none ${
                draggingElement === "descriptionTop" ? "opacity-70" : ""
              }`}
              style={{
                left: `${currentMapping.descriptionTop.x}%`,
                top: `${currentMapping.descriptionTop.y}%`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleDragStart(e, "descriptionTop")}
            >
              <div 
                className="text-center px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                style={{
                  fontFamily: currentMapping.descriptionTop.style.fontFamily,
                  fontSize: `${currentMapping.descriptionTop.style.fontSize}px`,
                  color: currentMapping.descriptionTop.style.color,
                  userSelect: "none",
                }}
              >
                {currentMapping.descriptionTop.text}
              </div>
            </div>

            {/* All Draggable Attributes (excluding those in description) */}
            {draggableAttributes.map((attr) => {
              const pos = currentMapping.attributes[attr]
              if (!pos) return null
              
              // Determine style based on attribute type
              let attrStyle = pos.style
              if (attr === 'student_name') {
                // Student name always uses its own style
                attrStyle = currentMapping.attributes.student_name?.style || {
                  fontFamily: "Great Vibes",
                  fontSize: 28,
                  color: "#111827"
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
                left: `${currentMapping.descriptionBody.x}%`,
                top: `${currentMapping.descriptionBody.y}%`,
                userSelect: "none",
              }}
              onMouseDown={(e) => handleDragStart(e, "descriptionBody")}
            >
              <div 
                className="text-center px-2 py-1 hover:bg-primary/10 rounded transition-colors select-none"
                style={{
                  fontFamily: currentMapping.descriptionBody.style.fontFamily,
                  fontSize: `${currentMapping.descriptionBody.style.fontSize}px`,
                  color: currentMapping.descriptionBody.style.color,
                  userSelect: "none",
                }}
                dangerouslySetInnerHTML={{ 
                  __html: currentMapping.descriptionBody.text
                    .replace(/<br>/gi, '<br/>')
                    .replace(/\{([^}]+)\}/g, (match, attrName) => {
                      // Replace {attribute_name} with actual mock data value
                      return MOCK_DATA[attrName] || match
                    })
                }}
              />
            </div>
          </div>
        </div>

        {/* Save Button - Outside preview, bottom right */}
        <div className="flex justify-end mt-4">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <button
                onClick={handleSaveMapping}
                disabled={!allAttributesReady || (!hasUnsavedChanges && saveSuccess)}
                className={`px-6 py-2.5 rounded-lg font-medium text-sm transition-all shadow-lg ${
                  saveSuccess && !hasUnsavedChanges
                    ? "bg-green-600 text-white cursor-default"
                    : allAttributesReady && hasUnsavedChanges
                    ? "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                }`}
              >
                {saveSuccess && !hasUnsavedChanges ? (
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
              {!allAttributesReady && (
                <p className="text-xs text-orange-600 mt-2">
                  Configure all attributes (green) to save
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
