"use client"

import { useAuth } from "@/lib/auth"
import { useState, useEffect, useRef } from "react"
import { getBaseCertificateTemplate, fetchCertificateAttributes } from "@/lib/api/certificates"
import { Monitor, ChevronRight, User, BookOpen, Calendar, Video, UserCircle, Briefcase } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Loader from "@/components/loader"

// Types
type CertificateType = "course" | "webinar" | "workshop"
type MainTab = "default" | "custom"

interface Position {
  x: number
  y: number
}

interface TextBlock {
  text: string
  x: number
  y: number
}

interface CertificateMapping {
  heading: TextBlock
  descriptionTop: TextBlock
  descriptionBody: TextBlock
  attributes: Record<string, Position>
  attributesInDescription: string[] // Tracks which attributes are included in description
}

type MappingData = Record<CertificateType, CertificateMapping>

interface TextStyle {
  fontFamily: string
  fontSize: number
  color: string
}

interface TextStyles {
  heading: TextStyle
  heading2: { fontFamily: string; fontSize: number }
  descriptionTop: TextStyle
  studentName: TextStyle
  descriptionBody: TextStyle
  dateFields: { fontSize: number }
  courseName: TextStyle
  webinarName: TextStyle
  workshopName: TextStyle
}

type AllTextStyles = Record<CertificateType, TextStyles>

// Constants
const DEFAULT_HEADINGS = {
  course: "Certificate of Completion",
  webinar: "Certificate of Participation",
  workshop: "Certificate of Workshop Completion",
}

const DEFAULT_DESCRIPTION_TOP = "This certificate is awarded to"

const DESCRIPTION_BODY_TEMPLATES = {
  course: "Has successfully completed the {course_name}",
  webinar: "In recognition of participation in {webinar_name} hosted by {host_name}",
  workshop: "For completing a {workshop_name} on {workshop_date}",
}

// Default positions for "Our Default Mapping" preview
const getDefaultPositions = (type: CertificateType, attributes: string[]) => {
  const positions: Record<string, Position> = {
    heading: { x: 50, y: 20 },
    heading2: { x: 50, y: 26 },
    descriptionTop: { x: 50, y: 30 },
    student_name: { x: 50, y: 40 },
    descriptionBody: { x: 50, y: 70 },
  }
  
  // Add remaining attributes
  let yPos = 50
  attributes.forEach((attr) => {
    if (attr !== "student_name") {
      positions[attr] = { x: 50, y: yPos }
      yPos += 8
    }
  })
  
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
const ATTRIBUTE_ICONS: Record<string, any> = {
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
const TEXT_STYLES_STORAGE_KEY = "certificate_text_styles"

// Font options for each text block
const FONT_OPTIONS = {
  heading: [
    "Playfair Display",
    "Libre Baskerville",
    "Cormorant Garamond",
    "Merriweather",
  ],
  heading2: [
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
  courseName: [
    "Playfair Display",
    "Libre Baskerville",
    "Cormorant Garamond",
    "Merriweather",
  ],
  webinarName: [
    "Playfair Display",
    "Libre Baskerville",
    "Cormorant Garamond",
    "Merriweather",
  ],
  workshopName: [
    "Playfair Display",
    "Libre Baskerville",
    "Cormorant Garamond",
    "Merriweather",
  ],
}

// Default text styles
const DEFAULT_TEXT_STYLES: TextStyles = {
  heading: {
    fontFamily: "Playfair Display",
    fontSize: 32,
    color: "#1a1a1a",
  },
  heading2: {
    fontFamily: "Playfair Display",
    fontSize: 24,
  },
  descriptionTop: {
    fontFamily: "Inter",
    fontSize: 14,
    color: "#4a5568",
  },
  studentName: {
    fontFamily: "Great Vibes",
    fontSize: 28,
    color: "#1a1a1a",
  },
  descriptionBody: {
    fontFamily: "Roboto",
    fontSize: 14,
    color: "#4a5568",
  },
  dateFields: {
    fontSize: 16,
  },
  courseName: {
    fontFamily: "Playfair Display",
    fontSize: 18,
    color: "#1a1a1a",
  },
  webinarName: {
    fontFamily: "Playfair Display",
    fontSize: 18,
    color: "#1a1a1a",
  },
  workshopName: {
    fontFamily: "Playfair Display",
    fontSize: 18,
    color: "#1a1a1a",
  },
}

export default function CertificateMappingPage() {
  const { user, organization, plan } = useAuth()
  const [isDesktop, setIsDesktop] = useState(true)
  const [mainTab, setMainTab] = useState<MainTab>("default")
  const [certificateType, setCertificateType] = useState<CertificateType>("course")
  const [templateUrl, setTemplateUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mappingData, setMappingData] = useState<MappingData | null>(null)
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const canvasRef = useRef<HTMLDivElement>(null)
  const [certificateAttributes, setCertificateAttributes] = useState<Record<CertificateType, string[]>>({
    course: [],
    webinar: [],
    workshop: [],
  })
  const [textStyles, setTextStyles] = useState<AllTextStyles | null>(null)
  const [showVerticalGuide, setShowVerticalGuide] = useState(false)
  const [showHorizontalGuide, setShowHorizontalGuide] = useState(false)

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

  // Load text styles from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem(TEXT_STYLES_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        // Migrate old data: ensure all fields exist, deeply merge each type
        const migrated: AllTextStyles = {
          course: {
            ...DEFAULT_TEXT_STYLES,
            ...(parsed.course || {}),
            heading2: { ...DEFAULT_TEXT_STYLES.heading2, ...(parsed.course?.heading2 || {}) },
            dateFields: { ...DEFAULT_TEXT_STYLES.dateFields, ...(parsed.course?.dateFields || {}) },
            courseName: { ...DEFAULT_TEXT_STYLES.courseName, ...(parsed.course?.courseName || {}) },
            webinarName: { ...DEFAULT_TEXT_STYLES.webinarName, ...(parsed.course?.webinarName || {}) },
            workshopName: { ...DEFAULT_TEXT_STYLES.workshopName, ...(parsed.course?.workshopName || {}) },
          },
          webinar: {
            ...DEFAULT_TEXT_STYLES,
            ...(parsed.webinar || {}),
            heading2: { ...DEFAULT_TEXT_STYLES.heading2, ...(parsed.webinar?.heading2 || {}) },
            dateFields: { ...DEFAULT_TEXT_STYLES.dateFields, ...(parsed.webinar?.dateFields || {}) },
            courseName: { ...DEFAULT_TEXT_STYLES.courseName, ...(parsed.webinar?.courseName || {}) },
            webinarName: { ...DEFAULT_TEXT_STYLES.webinarName, ...(parsed.webinar?.webinarName || {}) },
            workshopName: { ...DEFAULT_TEXT_STYLES.workshopName, ...(parsed.webinar?.workshopName || {}) },
          },
          workshop: {
            ...DEFAULT_TEXT_STYLES,
            ...(parsed.workshop || {}),
            heading2: { ...DEFAULT_TEXT_STYLES.heading2, ...(parsed.workshop?.heading2 || {}) },
            dateFields: { ...DEFAULT_TEXT_STYLES.dateFields, ...(parsed.workshop?.dateFields || {}) },
            courseName: { ...DEFAULT_TEXT_STYLES.courseName, ...(parsed.workshop?.courseName || {}) },
            webinarName: { ...DEFAULT_TEXT_STYLES.webinarName, ...(parsed.workshop?.webinarName || {}) },
            workshopName: { ...DEFAULT_TEXT_STYLES.workshopName, ...(parsed.workshop?.workshopName || {}) },
          },
        }
        setTextStyles(migrated)
        sessionStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(migrated))
      } catch (error) {
        console.error("Failed to parse text styles:", error)
        initializeTextStyles()
      }
    } else {
      initializeTextStyles()
    }
  }, [])

  const initializeTextStyles = () => {
    const initialStyles: AllTextStyles = {
      course: { ...DEFAULT_TEXT_STYLES },
      webinar: { ...DEFAULT_TEXT_STYLES },
      workshop: { ...DEFAULT_TEXT_STYLES },
    }
    setTextStyles(initialStyles)
    sessionStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(initialStyles))
  }

  // Update text style
  const updateTextStyle = (
    block: keyof TextStyles,
    property: string,
    value: string | number
  ) => {
    if (!textStyles) return
    const newStyles = JSON.parse(JSON.stringify(textStyles)) as AllTextStyles
    
    if (block === "dateFields") {
      newStyles[certificateType].dateFields.fontSize = value as number
    } else if (block === "heading2") {
      // heading2 only has fontFamily and fontSize
      if (property === "fontFamily") {
        newStyles[certificateType].heading2.fontFamily = value as string
      } else if (property === "fontSize") {
        newStyles[certificateType].heading2.fontSize = value as number
      }
    } else {
      // Other blocks have full TextStyle (fontFamily, fontSize, color)
      const styleBlock = newStyles[certificateType][block] as TextStyle
      if (property === "fontFamily") {
        styleBlock.fontFamily = value as string
      } else if (property === "fontSize") {
        styleBlock.fontSize = value as number
      } else if (property === "color") {
        styleBlock.color = value as string
      }
    }
    
    setTextStyles(newStyles)
    sessionStorage.setItem(TEXT_STYLES_STORAGE_KEY, JSON.stringify(newStyles))
  }

  // Load base certificate template
  useEffect(() => {
    const loadTemplate = async () => {
      try {
        const response = await getBaseCertificateTemplate()
        if (response.success && response.data?.template_url) {
          setTemplateUrl(response.data.template_url)
        }
      } catch (error) {
        console.error("Failed to load base certificate:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTemplate()
  }, [])

  // Load mapping data from sessionStorage
  useEffect(() => {
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
            if (type === 'webinar') autoInclude.push('host_name')
            if (type === 'workshop') autoInclude.push('workshop_name')

            migratedData[type] = {
              heading: typeData.heading || { text: DEFAULT_HEADINGS[type], x: 50, y: 20 },
              descriptionTop: { text: DEFAULT_DESCRIPTION_TOP, x: 50, y: 30 },
              descriptionBody: { text: DESCRIPTION_BODY_TEMPLATES[type], x: 50, y: 70 },
              attributes: typeData.attributes || {},
              attributesInDescription: typeData.attributesInDescription || autoInclude,
            }
          } else if (typeData && typeData.descriptionTop && typeData.descriptionBody) {
            // New structure, use as is but ensure attributesInDescription exists and includes required attrs
            let attrInDesc = typeData.attributesInDescription || []
            if (type === 'webinar' && !attrInDesc.includes('host_name')) {
              attrInDesc = [...attrInDesc, 'host_name']
            }
            if (type === 'workshop' && !attrInDesc.includes('workshop_name')) {
              attrInDesc = [...attrInDesc, 'workshop_name']
            }

            migratedData[type] = {
              ...typeData,
              attributesInDescription: attrInDesc,
            }
            
            // Ensure heading2 position exists in attributes
            if (!migratedData[type].attributes.heading2) {
              migratedData[type].attributes.heading2 = { x: 50, y: 26 }
            }
          } else {
            // Missing or incomplete data, create fresh
            const attrs = certificateAttributes[type]
            const attrPositions: Record<string, Position> = {}
            
            let yPos = 50
            attrs.forEach((attr) => {
              if (attr === "student_name") {
                attrPositions[attr] = { x: 50, y: 40 }
              } else {
                attrPositions[attr] = { x: 50, y: yPos }
                yPos += 8
              }
            })

            const autoInclude = []
            if (type === 'course') autoInclude.push('course_name')
            if (type === 'webinar') autoInclude.push('host_name')
            if (type === 'webinar') autoInclude.push('webinar_name')
            if (type === 'workshop') autoInclude.push('workshop_name')

            migratedData[type] = {
              heading: { text: DEFAULT_HEADINGS[type], x: 50, y: 20 },
              descriptionTop: { text: DEFAULT_DESCRIPTION_TOP, x: 50, y: 30 },
              descriptionBody: { text: DESCRIPTION_BODY_TEMPLATES[type], x: 50, y: 70 },
              attributes: { ...attrPositions, heading2: { x: 50, y: 26 } },
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
  }, [certificateAttributes])

  const initializeFreshData = () => {
    const initialData: MappingData = {} as MappingData

    ;(["course", "webinar", "workshop"] as CertificateType[]).forEach((type) => {
      const attrs = certificateAttributes[type]
      const attrPositions: Record<string, Position> = {}
      
      // Initialize positions for all attributes
      let yPos = 50
      attrs.forEach((attr) => {
        if (attr === "student_name") {
          attrPositions[attr] = { x: 50, y: 40 }
        } else {
          attrPositions[attr] = { x: 50, y: yPos }
          yPos += 8
        }
      })

      // Initialize heading2 position (for when <br> is added)
      attrPositions.heading2 = { x: 50, y: 26 }

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
        heading: { text: DEFAULT_HEADINGS[type], x: 50, y: 20 },
        descriptionTop: { text: DEFAULT_DESCRIPTION_TOP, x: 50, y: 30 },
        descriptionBody: { text: DESCRIPTION_BODY_TEMPLATES[type], x: 50, y: 70 },
        attributes: attrPositions,
        attributesInDescription: autoIncludeInDescription,
      }
    })
    
    setMappingData(initialData)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(initialData))
  }

  // Toggle attribute inclusion in description
  const toggleAttributeInDescription = (attr: string, include: boolean) => {
    if (!mappingData) return
    const newData = { ...mappingData }
    const current = newData[certificateType].attributesInDescription || []
    
    if (include && !current.includes(attr)) {
      newData[certificateType].attributesInDescription = [...current, attr]
    } else if (!include && current.includes(attr)) {
      newData[certificateType].attributesInDescription = current.filter(a => a !== attr)
      
      // When moving attribute to draggable, ensure it has a position
      if (!newData[certificateType].attributes[attr]) {
        newData[certificateType].attributes[attr] = { x: 50, y: 55 }
      }
    }
    
    saveMappingData(newData)
  }

  // Save mapping data to sessionStorage
  const saveMappingData = (data: MappingData) => {
    setMappingData(data)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
        newData[certificateType].attributes[draggingElement] = {
          x: clampedX,
          y: clampedY,
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
    return <Loader />
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
          <button
            onClick={() => setMainTab("custom")}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
              mainTab === "custom"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Custom Mapping
          </button>
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
          mappingData={mappingData}
          attributes={certificateAttributes[certificateType]}
          updateText={updateText}
          handleDragStart={handleDragStart}
          draggingElement={draggingElement}
          canvasRef={canvasRef}
          toggleAttributeInDescription={toggleAttributeInDescription}
          textStyles={textStyles?.[certificateType] || DEFAULT_TEXT_STYLES}
          updateTextStyle={updateTextStyle}
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

  return (
    <div className="bg-card border border-border rounded-lg p-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Preview</h3>
        <Badge variant="outline" className="text-xs">
          System Defined Layout
        </Badge>
      </div>

      <div className="relative w-full max-w-4xl mx-auto aspect-[1.414/1] bg-muted rounded-lg overflow-hidden">
        <img
          src={templateUrl}
          alt="Base Certificate"
          className="w-full h-full object-contain"
        />

        {/* Heading */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${positions.heading.x}%`, top: `${positions.heading.y}%` }}
        >
          <div className="text-center font-bold text-2xl text-gray-800 whitespace-nowrap">
            {DEFAULT_HEADINGS[certificateType]}
          </div>
        </div>

        {/* Description Top */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${positions.descriptionTop.x}%`, top: `${positions.descriptionTop.y}%` }}
        >
          <div className="text-center text-sm text-gray-600">
            {DEFAULT_DESCRIPTION_TOP}
          </div>
        </div>

        {/* All Attributes */}
        {attributes.map((attr) => {
          const pos = positions[attr]
          if (!pos) return null
          return (
            <div
              key={attr}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
            >
              <div className="text-center font-semibold text-lg text-gray-900">
                {MOCK_DATA[attr]}
              </div>
            </div>
          )
        })}

        {/* Description Body - supports <br> tags */}
        <div
          className="absolute transform -translate-x-1/2 -translate-y-1/2 max-w-[80%]"
          style={{ left: `${positions.descriptionBody.x}%`, top: `${positions.descriptionBody.y}%` }}
        >
          <div 
            className="text-center text-sm text-gray-600"
            dangerouslySetInnerHTML={{ 
              __html: DESCRIPTION_BODY_TEMPLATES[certificateType].replace(/<br>/gi, '<br/>') 
            }}
          />
        </div>
      </div>
    </div>
  )
}

// Custom Mapping View Component
function CustomMappingView({
  templateUrl,
  certificateType,
  mappingData,
  attributes,
  updateText,
  handleDragStart,
  draggingElement,
  canvasRef,
  toggleAttributeInDescription,
  textStyles,
  updateTextStyle,
  showVerticalGuide,
  showHorizontalGuide,
}: {
  templateUrl: string
  certificateType: CertificateType
  mappingData: MappingData | null
  attributes: string[]
  updateText: (field: "heading" | "descriptionTop" | "descriptionBody", text: string) => void
  handleDragStart: (e: React.MouseEvent, elementType: string) => void
  draggingElement: string | null
  canvasRef: React.RefObject<HTMLDivElement | null>
  toggleAttributeInDescription: (attr: string, include: boolean) => void
  textStyles: TextStyles
  updateTextStyle: (block: keyof TextStyles, property: keyof TextStyle, value: string | number) => void
  showVerticalGuide: boolean
  showHorizontalGuide: boolean
}) {
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
  
  // Check if there are any draggable date fields
  const dateFields = ["completion_date", "webinar_date", "workshop_date"]
  const hasDraggableDates = draggableAttributes.some(attr => dateFields.includes(attr))

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
              const showCheckbox = attr !== 'student_name' && attr !== 'host_name' && attr !== 'workshop_name'
              const isReady = isAttributeReady(attr)
              const IconComponent = ATTRIBUTE_ICONS[attr] || User
              
              return (
                <div key={attr} className="space-y-2">
                  <div
                    className={`flex items-center gap-2 px-3 py-2 bg-muted rounded-md text-sm font-medium transition-colors ${
                      isReady ? "text-green-600" : "text-orange-600"
                    }`}
                  >
                    <IconComponent className="w-4 h-4 flex-shrink-0" />
                    {ATTRIBUTE_LABELS[attr] || attr}
                  </div>
                  
                  {showCheckbox && (
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
              If you check "Include in description", write the attribute in the Description - Body field using this format:<br/>
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
                  value={textStyles.heading.fontFamily}
                  onChange={(e) => updateTextStyle("heading", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: textStyles.heading.fontFamily }}
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
                      onClick={() => updateTextStyle("heading", "fontSize", Math.max(20, textStyles.heading.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="20"
                      max="60"
                      value={textStyles.heading.fontSize}
                      onChange={(e) => updateTextStyle("heading", "fontSize", Math.max(20, Math.min(60, parseInt(e.target.value) || 20)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateTextStyle("heading", "fontSize", Math.min(60, textStyles.heading.fontSize + 1))}
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
                    value={textStyles.heading.color}
                    onChange={(e) => updateTextStyle("heading", "color", e.target.value)}
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
                        onClick={() => updateTextStyle("heading2", "fontSize", Math.max(16, textStyles.heading2.fontSize - 1))}
                        className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="16"
                        max="48"
                        value={textStyles.heading2.fontSize}
                        onChange={(e) => updateTextStyle("heading2", "fontSize", Math.max(16, Math.min(48, parseInt(e.target.value) || 16)))}
                        className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => updateTextStyle("heading2", "fontSize", Math.min(48, textStyles.heading2.fontSize + 1))}
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
                  value={textStyles.descriptionTop.fontFamily}
                  onChange={(e) => updateTextStyle("descriptionTop", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: textStyles.descriptionTop.fontFamily }}
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
                      onClick={() => updateTextStyle("descriptionTop", "fontSize", Math.max(10, textStyles.descriptionTop.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={textStyles.descriptionTop.fontSize}
                      onChange={(e) => updateTextStyle("descriptionTop", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateTextStyle("descriptionTop", "fontSize", Math.min(24, textStyles.descriptionTop.fontSize + 1))}
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
                    value={textStyles.descriptionTop.color}
                    onChange={(e) => updateTextStyle("descriptionTop", "color", e.target.value)}
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
                  value={textStyles.studentName.fontFamily}
                  onChange={(e) => updateTextStyle("studentName", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: textStyles.studentName.fontFamily }}
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
                      onClick={() => updateTextStyle("studentName", "fontSize", Math.max(18, textStyles.studentName.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="18"
                      max="48"
                      value={textStyles.studentName.fontSize}
                      onChange={(e) => updateTextStyle("studentName", "fontSize", Math.max(18, Math.min(48, parseInt(e.target.value) || 18)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateTextStyle("studentName", "fontSize", Math.min(48, textStyles.studentName.fontSize + 1))}
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
                    value={textStyles.studentName.color}
                    onChange={(e) => updateTextStyle("studentName", "color", e.target.value)}
                    className="w-12 h-7 border border-border rounded cursor-pointer"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-border"></div>

            {/* Date Fields Font Size (only if there are draggable dates) */}
            {hasDraggableDates && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Date Fields</h4>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-muted-foreground mb-1.5 block">Font Size</label>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateTextStyle("dateFields", "fontSize", Math.max(10, textStyles.dateFields.fontSize - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="10"
                          max="32"
                          value={textStyles.dateFields.fontSize}
                          onChange={(e) => updateTextStyle("dateFields", "fontSize", Math.max(10, Math.min(32, parseInt(e.target.value) || 10)))}
                          className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => updateTextStyle("dateFields", "fontSize", Math.min(32, textStyles.dateFields.fontSize + 1))}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                          +
                        </button>
                        <span className="text-xs text-muted-foreground ml-1">px</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground italic">
                    Applies to draggable date fields only
                  </p>
                </div>
                
                <div className="border-t border-border"></div>
              </>
            )}

            {/* Course/Webinar/Workshop Name Styles (only if draggable) */}
            {certificateType === "course" && !attributesInDescription.includes("course_name") && attributes.includes("course_name") && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Course Name</h4>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                    <select
                      value={textStyles.courseName.fontFamily}
                      onChange={(e) => updateTextStyle("courseName", "fontFamily", e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ fontFamily: textStyles.courseName.fontFamily }}
                    >
                      {FONT_OPTIONS.courseName.map((font) => (
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
                          onClick={() => updateTextStyle("courseName", "fontSize", Math.max(12, textStyles.courseName.fontSize - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="12"
                          max="36"
                          value={textStyles.courseName.fontSize}
                          onChange={(e) => updateTextStyle("courseName", "fontSize", Math.max(12, Math.min(36, parseInt(e.target.value) || 12)))}
                          className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => updateTextStyle("courseName", "fontSize", Math.min(36, textStyles.courseName.fontSize + 1))}
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
                        value={textStyles.courseName.color}
                        onChange={(e) => updateTextStyle("courseName", "color", e.target.value)}
                        className="w-12 h-7 border border-border rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border"></div>
              </>
            )}

            {certificateType === "webinar" && !attributesInDescription.includes("webinar_name") && attributes.includes("webinar_name") && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Webinar Name</h4>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                    <select
                      value={textStyles.webinarName.fontFamily}
                      onChange={(e) => updateTextStyle("webinarName", "fontFamily", e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ fontFamily: textStyles.webinarName.fontFamily }}
                    >
                      {FONT_OPTIONS.webinarName.map((font) => (
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
                          onClick={() => updateTextStyle("webinarName", "fontSize", Math.max(12, textStyles.webinarName.fontSize - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="12"
                          max="36"
                          value={textStyles.webinarName.fontSize}
                          onChange={(e) => updateTextStyle("webinarName", "fontSize", Math.max(12, Math.min(36, parseInt(e.target.value) || 12)))}
                          className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => updateTextStyle("webinarName", "fontSize", Math.min(36, textStyles.webinarName.fontSize + 1))}
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
                        value={textStyles.webinarName.color}
                        onChange={(e) => updateTextStyle("webinarName", "color", e.target.value)}
                        className="w-12 h-7 border border-border rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border"></div>
              </>
            )}

            {certificateType === "workshop" && !attributesInDescription.includes("workshop_name") && attributes.includes("workshop_name") && (
              <>
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold text-foreground">Workshop Name</h4>
                  
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                    <select
                      value={textStyles.workshopName.fontFamily}
                      onChange={(e) => updateTextStyle("workshopName", "fontFamily", e.target.value)}
                      className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                      style={{ fontFamily: textStyles.workshopName.fontFamily }}
                    >
                      {FONT_OPTIONS.workshopName.map((font) => (
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
                          onClick={() => updateTextStyle("workshopName", "fontSize", Math.max(12, textStyles.workshopName.fontSize - 1))}
                          className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          min="12"
                          max="36"
                          value={textStyles.workshopName.fontSize}
                          onChange={(e) => updateTextStyle("workshopName", "fontSize", Math.max(12, Math.min(36, parseInt(e.target.value) || 12)))}
                          className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <button
                          onClick={() => updateTextStyle("workshopName", "fontSize", Math.min(36, textStyles.workshopName.fontSize + 1))}
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
                        value={textStyles.workshopName.color}
                        onChange={(e) => updateTextStyle("workshopName", "color", e.target.value)}
                        className="w-12 h-7 border border-border rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border"></div>
              </>
            )}

            {/* Description Body Styles */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-foreground">Description Body</h4>
              
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Font Family</label>
                <select
                  value={textStyles.descriptionBody.fontFamily}
                  onChange={(e) => updateTextStyle("descriptionBody", "fontFamily", e.target.value)}
                  className="w-full px-2 py-1.5 border border-border rounded-md text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                  style={{ fontFamily: textStyles.descriptionBody.fontFamily }}
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
                      onClick={() => updateTextStyle("descriptionBody", "fontSize", Math.max(10, textStyles.descriptionBody.fontSize - 1))}
                      className="w-7 h-7 flex items-center justify-center border border-border rounded bg-background hover:bg-muted transition-colors text-sm font-medium"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="10"
                      max="24"
                      value={textStyles.descriptionBody.fontSize}
                      onChange={(e) => updateTextStyle("descriptionBody", "fontSize", Math.max(10, Math.min(24, parseInt(e.target.value) || 10)))}
                      className="w-14 px-2 py-1 text-center border border-border rounded text-xs focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <button
                      onClick={() => updateTextStyle("descriptionBody", "fontSize", Math.min(24, textStyles.descriptionBody.fontSize + 1))}
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
                    value={textStyles.descriptionBody.color}
                    onChange={(e) => updateTextStyle("descriptionBody", "color", e.target.value)}
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
                className="absolute top-0 bottom-0 w-[1px] bg-blue-500 pointer-events-none"
                style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
              />
            )}
            {showHorizontalGuide && (
              <div
                className="absolute left-0 right-0 h-[1px] bg-blue-500 pointer-events-none"
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
                  fontFamily: textStyles.heading.fontFamily,
                  fontSize: `${textStyles.heading.fontSize}px`,
                  color: textStyles.heading.color,
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
                    fontFamily: textStyles.heading.fontFamily,
                    fontSize: `${textStyles.heading2.fontSize}px`,
                    color: textStyles.heading.color,
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
                  fontFamily: textStyles.descriptionTop.fontFamily,
                  fontSize: `${textStyles.descriptionTop.fontSize}px`,
                  color: textStyles.descriptionTop.color,
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
              
              // Student name uses special styling
              const isStudentName = attr === 'student_name'
              
              // Date fields use date styling
              const isDateField = ["completion_date", "webinar_date", "workshop_date"].includes(attr)
              
              // Course/Webinar/Workshop name styling
              const isCourseName = attr === 'course_name'
              const isWebinarName = attr === 'webinar_name'
              const isWorkshopName = attr === 'workshop_name'
              
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
                    style={isStudentName ? {
                      fontFamily: textStyles.studentName.fontFamily,
                      fontSize: `${textStyles.studentName.fontSize}px`,
                      color: textStyles.studentName.color,
                      userSelect: "none",
                    } : isCourseName ? {
                      fontFamily: textStyles.courseName.fontFamily,
                      fontSize: `${textStyles.courseName.fontSize}px`,
                      color: textStyles.courseName.color,
                      userSelect: "none",
                    } : isWebinarName ? {
                      fontFamily: textStyles.webinarName.fontFamily,
                      fontSize: `${textStyles.webinarName.fontSize}px`,
                      color: textStyles.webinarName.color,
                      userSelect: "none",
                    } : isWorkshopName ? {
                      fontFamily: textStyles.workshopName.fontFamily,
                      fontSize: `${textStyles.workshopName.fontSize}px`,
                      color: textStyles.workshopName.color,
                      userSelect: "none",
                    } : isDateField ? {
                      fontSize: `${textStyles.dateFields.fontSize}px`,
                      userSelect: "none",
                    } : { userSelect: "none" }}
                  >
                    {MOCK_DATA[attr]}
                  </div>
                </div>
              )
            })}

            {/* Description Body - supports <br> tags */}
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
                  fontFamily: textStyles.descriptionBody.fontFamily,
                  fontSize: `${textStyles.descriptionBody.fontSize}px`,
                  color: textStyles.descriptionBody.color,
                  userSelect: "none",
                }}
                dangerouslySetInnerHTML={{ 
                  __html: currentMapping.descriptionBody.text.replace(/<br>/gi, '<br/>') 
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
