"use client"

/**
 * Base Certificate Template Management Page
 * 
 * Features:
 * - GET API integration to check for existing templates
 * - MODE 1: 3-step onboarding flow when no template exists
 *   - Step 1: Upload base certificate (mock functionality)
 *   - Step 2: Select certificate type and attributes
 *   - Step 3: Redirect to appropriate generation page
 * - MODE 2: Template management when template exists
 *   - Display template details and metadata
 *   - View template in new tab
 *   - Update template (switches to onboarding mode)
 *   - Delete template with confirmation modal
 * - SessionStorage integration for certificate attributes
 * - Responsive design with proper mobile support
 * - Error handling and loading states
 */

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Upload,
  FileImage,
  Check,
  Eye,
  RefreshCw,
  Trash2,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  Settings,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import Loader from "@/components/loader"

import {
  getBaseCertificateTemplate,
  deleteBaseCertificateTemplate,
  uploadBaseCertificateTemplate,
  validateCertificateFile,
  storeCertificateAttributes,
  getCertificateAttributes,
  clearCertificateAttributes,
  postCertificateAttributes,
  CERTIFICATE_ATTRIBUTES,
  ALLOWED_FILE_TYPES,
  type BaseCertificateTemplate,
  type CertificateAttributes,
  formatFileSize,
  formatUploadDate,
} from "@/lib/api/certificates"

type StepperStep = 0 | 1 | 2
type CertificateType = "course" | "webinar" | "workshop"

export default function TemplatesPage() {
  const router = useRouter()
  
  // Loading and template states
  const [isLoading, setIsLoading] = useState(true)
  const [template, setTemplate] = useState<BaseCertificateTemplate | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Onboarding flow states
  const [activeStep, setActiveStep] = useState<StepperStep>(0) // Mantine uses 0-indexed steps
  const [currentCard, setCurrentCard] = useState<CertificateType>("course") // Track which card is shown
  const [allSelections, setAllSelections] = useState<{
    course: string[];
    webinar: string[];
    workshop: string[];
  }>({
    course: ["student_name"],
    webinar: ["student_name"],
    workshop: ["student_name"]
  })
  const [isUploaded, setIsUploaded] = useState(false) // Mock upload state
  
  // Upload states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load template data
  useEffect(() => {
    loadTemplate()
  }, [])

  // Load saved attributes
  useEffect(() => {
    const saved = getCertificateAttributes()
    if (saved) {
      // Ensure student_name is always included
      setAllSelections({
        course: saved.course?.includes("student_name") ? saved.course : ["student_name", ...(saved.course || [])],
        webinar: saved.webinar?.includes("student_name") ? saved.webinar : ["student_name", ...(saved.webinar || [])],
        workshop: saved.workshop?.includes("student_name") ? saved.workshop : ["student_name", ...(saved.workshop || [])]
      })
    }

    // Check if upload was completed in this session
    const uploadCompleted = sessionStorage.getItem('uploadCompleted')
    if (uploadCompleted === 'true') {
      setIsUploaded(true)
      setActiveStep(1) // Move to step 2 (0-indexed)
    }
  }, [])

  const loadTemplate = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const response = await getBaseCertificateTemplate()
      
      if (response.success && response.data) {
        // Template exists - show management mode
        setTemplate(response.data)
      } else {
        // No template exists - show onboarding mode
        setTemplate(null)
      }
    } catch (err) {
      console.error("Template load error:", err)
      setError(err instanceof Error ? err.message : "Failed to load template")
      setTemplate(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteTemplate = async () => {
    try {
      setIsDeleting(true)
      await deleteBaseCertificateTemplate()
      setTemplate(null)
      setIsDeleteModalOpen(false)
      
      // Reset onboarding state
      setActiveStep(0)
      setCurrentCard("course")
      setAllSelections({ 
        course: ["student_name"], 
        webinar: ["student_name"], 
        workshop: ["student_name"] 
      })
      setIsUploaded(false)
      setSelectedFile(null)
      setUploadError(null)
      setIsUploading(false)
      clearCertificateAttributes()
      sessionStorage.removeItem('uploadCompleted')
    } catch (err) {
      console.error("Failed to delete template:", err)
      // In a real app, you'd show a toast notification here
      setError(err instanceof Error ? err.message : "Failed to delete template")
    } finally {
      setIsDeleting(false)
    }
  }



  const handleFileSelect = (file: File) => {
    const validation = validateCertificateFile(file)
    if (!validation.valid) {
      setUploadError(validation.error || "Invalid file")
      setSelectedFile(null)
      return
    }

    setSelectedFile(file)
    setUploadError(null)
    handleUpload(file)
  }

  const handleUpload = async (file: File) => {
    try {
      setIsUploading(true)
      setUploadError(null)

      await uploadBaseCertificateTemplate(file)
      
      // Success - mark step as completed and move to step 2
      setIsUploaded(true)
      setActiveStep(1) // Move to step 2 (0-indexed)
      
      // Store upload completion in sessionStorage
      sessionStorage.setItem('uploadCompleted', 'true')
      
    } catch (err) {
      console.error("Upload failed:", err)
      setUploadError(err instanceof Error ? err.message : "Upload failed")
      setSelectedFile(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleAttributeToggle = (type: CertificateType, attribute: string) => {
    // Prevent unchecking student_name
    if (attribute === "student_name") return;
    
    setAllSelections(prev => {
      const currentSelections = prev[type]
      const newSelections = currentSelections.includes(attribute)
        ? currentSelections.filter(attr => attr !== attribute)
        : [...currentSelections, attribute]
      
      const updated = {
        ...prev,
        [type]: newSelections
      }
      
      // Save to sessionStorage immediately
      storeCertificateAttributes(updated)
      
      return updated
    })
  }

  const handleMoveToNextCard = () => {
    if (currentCard === "course") {
      setCurrentCard("webinar")
    } else if (currentCard === "webinar") {
      setCurrentCard("workshop")
    }
  }

  const handleStep2Complete = async () => {
    try {
      // Post certificate attributes to API
      await postCertificateAttributes()
      
      // All cards completed, move to step 3
      setActiveStep(2) // Move to step 3 (0-indexed)
    } catch (error) {
      console.error("Failed to save certificate attributes:", error)
      // Still allow moving to step 3 since data is in sessionStorage
      setActiveStep(2)
    }
  }

  const handleGenerateRedirect = () => {
    // Complete step 3 (show checkmark)
    setActiveStep(2)
    
    // Redirect after a brief delay to show completion
    setTimeout(() => {
      const typeWithSelections = Object.entries(allSelections).find(([_, selections]) => selections.length > 0)
      const redirectType = typeWithSelections ? typeWithSelections[0] : "course"
      router.push(`/generate/${redirectType}`)
    }, 500)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size="large" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-medium text-foreground mb-2">Failed to load template</h2>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <Button onClick={loadTemplate} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // MODE 2: Template exists - Show management interface
  if (template) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">
              Base Certificate Template
            </h1>
            <p className="text-muted-foreground">
              Manage your organization's base certificate template
            </p>
          </div>

          <div className="bg-card border rounded-lg p-6">
            {/* Template Preview Section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-4">Current Template</h3>
              
              <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4 p-4 bg-muted/30 rounded-lg border">
                <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center flex-shrink-0 mx-auto sm:mx-0">
                  <FileImage className="w-8 h-8 text-muted-foreground" />
                </div>
                
                <div className="flex-1 min-w-0 text-center sm:text-left">
                  <h4 className="font-medium text-foreground mb-1 break-all">
                    {template.original_file_name}
                  </h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {formatFileSize(template.file_size)}
                  </p>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-xs text-muted-foreground">
                    <span className="break-words">Uploaded on {formatUploadDate(template.uploaded_at)}</span>
                    <Badge variant="success" className="flex items-center gap-1 w-fit mx-auto sm:mx-0">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </Badge>
                  </div>
                </div>

                <div className="flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(template.template_url, '_blank')}
                    className="w-full sm:w-auto"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Actions Section */}
            <div className="flex flex-col space-y-4">
              <div className="text-center sm:text-left">
                <h3 className="font-medium mb-1">Template Actions</h3>
              </div>
              
              <div className="flex flex-col space-y-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTemplate(null)
                    setActiveStep(0)
                    setCurrentCard("course")
                    setAllSelections({ course: [], webinar: [], workshop: [] })
                    setIsUploaded(false)
                    setSelectedFile(null)
                    setUploadError(null)
                    setIsUploading(false)
                    clearCertificateAttributes()
                    sessionStorage.removeItem('uploadCompleted')
                  }}
                  className="w-full h-12 text-base"
                >
                  <RefreshCw className="w-5 h-5 mr-3" />
                  Update Template
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="w-full h-12 text-base border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 hover:text-red-700"
                >
                  <Trash2 className="w-5 h-5 mr-3" />
                  Delete Template
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Certificate Template</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this certificate template? This action cannot be undone
                and will remove the template permanently from your organization.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={isDeleting}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteTemplate}
                disabled={isDeleting}
                className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 mr-2">
                      <Loader size="small" />
                    </div>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Template
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // MODE 1: No template - Show onboarding flow
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Set Up Your Certificate Template
          </h1>
          <p className="text-muted-foreground">
            Follow these steps to create your first base certificate template
          </p>
        </div>

        {/* Custom Stepper - Desktop */}
        <div className="mb-8 hidden md:flex items-start justify-center gap-4">
          {/* Step 1 */}
          <div className="flex items-start gap-3 flex-1 max-w-xs">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 ${
              activeStep >= 0 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
            }`}>
              <Upload className={`w-6 h-6 ${activeStep >= 0 ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className={`text-sm font-medium ${activeStep >= 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Upload Certificate
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Your base template</p>
            </div>
          </div>

          {/* Connector 1 */}
          <div className="flex items-center pt-6">
            <div className={`h-0.5 w-64 ${activeStep >= 1 ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 flex-1 max-w-xs">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 ${
              activeStep >= 1 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
            }`}>
              <Settings className={`w-6 h-6 ${activeStep >= 1 ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 pt-1">
              <h3 className={`text-sm font-medium ${activeStep >= 1 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Configure Attributes
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Select certificate fields</p>
            </div>
          </div>

          {/* Connector 2 */}
          <div className="flex items-center pt-6">
            <div className={`h-0.5 w-64 ${activeStep >= 2 ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 flex-1 max-w-xs">
            <div className={`flex items-center justify-center w-12 h-12 rounded-full border-2 flex-shrink-0 ${
              activeStep >= 2 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
            }`}>
              {activeStep >= 2 ? (
                <Check className="w-6 h-6 text-white" />
              ) : (
                <CheckCircle2 className="w-6 h-6 text-gray-400" />
              )}
            </div>
            <div className="flex-1 pt-1">
              <h3 className={`text-sm font-medium ${activeStep >= 2 ? 'text-foreground' : 'text-muted-foreground'}`}>
                Complete Setup
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Ready to generate</p>
            </div>
          </div>
        </div>

        {/* Custom Stepper - Mobile */}
        <div className="mb-8 flex md:hidden items-center justify-center gap-4">
          {/* Step 1 */}
          <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 ${
            activeStep >= 0 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
          }`}>
            <Upload className={`w-6 h-6 ${activeStep >= 0 ? 'text-white' : 'text-gray-400'}`} />
          </div>

          {/* Connector 1 */}
          <div className={`h-0.5 w-12 ${activeStep >= 1 ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>

          {/* Step 2 */}
          <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 ${
            activeStep >= 1 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
          }`}>
            <Settings className={`w-6 h-6 ${activeStep >= 1 ? 'text-white' : 'text-gray-400'}`} />
          </div>

          {/* Connector 2 */}
          <div className={`h-0.5 w-12 ${activeStep >= 2 ? 'bg-brand-primary' : 'bg-gray-300'}`}></div>

          {/* Step 3 */}
          <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 ${
            activeStep >= 2 ? 'bg-brand-primary border-brand-primary' : 'bg-gray-100 border-gray-300'
          }`}>
            {activeStep >= 2 ? (
              <Check className="w-6 h-6 text-white" />
            ) : (
              <CheckCircle2 className="w-6 h-6 text-gray-400" />
            )}
          </div>
        </div>

        {/* Step 1: Upload Certificate */}
        {activeStep === 0 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg p-8">
              <div className="text-center mb-8">
                <h2 className="text-xl font-medium mb-2">Upload Your Base Certificate</h2>
                <p className="text-muted-foreground mb-6">
                  Upload the template that will be used as the foundation for all your certificates
                </p>
              </div>

              {/* Drag & Drop Zone */}
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
                  ${isDragOver 
                    ? "border-primary bg-primary/5" 
                    : "border-border hover:border-primary/50 hover:bg-muted/30"
                  }
                  ${isUploading ? "pointer-events-none opacity-50" : ""}
                `}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !isUploading && document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={handleFileInputChange}
                  disabled={isUploading}
                />

                {isUploading ? (
                  <div className="space-y-4">
                    <Loader size="medium" />
                    <div>
                      <p className="font-medium text-foreground">Uploading certificate...</p>
                      <p className="text-sm text-muted-foreground mt-1">{selectedFile?.name}</p>
                    </div>
                  </div>
                ) : selectedFile && !uploadError ? (
                  <div className="space-y-4">
                    <FileImage className="w-12 h-12 text-primary mx-auto" />
                    <div>
                      <p className="font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center">
                      <Upload className="w-8 h-8 text-muted-foreground mr-2" />
                      <div>
                        <p className="font-medium text-foreground">
                          Browse Certificate or Drop here
                        </p>
                        
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Message */}
              {uploadError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{uploadError}</p>
                </div>
              )}

              {/* Success State */}
              {isUploaded && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-700">
                    ✓ Certificate uploaded successfully! You can now proceed to the next step.
                  </p>
                </div>
              )}

              {/* Supported Formats */}
              <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  <strong>Supported formats:</strong> PNG, JPG, PDF
                  <br />
                  <strong>Recommended:</strong> High resolution (300 DPI), A4 or Letter size
                  <br />
                  <strong>Maximum size:</strong> 10MB
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Select Attributes */}
        {activeStep === 1 && (
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border rounded-lg p-6">
              <div className="mb-6">
                <h2 className="text-xl font-medium mb-2">Certificate Inputs</h2>
                <p className="text-muted-foreground hidden md:block">
                  Choose the fields required during certificate generation.
                </p>
                
                {/* Progress indicator for cards */}
                <div className="flex items-center space-x-2 mt-4">
                  {(["course", "webinar", "workshop"] as CertificateType[]).map((type) => {
                    const isActive = currentCard === type;
                    const hasSelections = allSelections[type].length > 1; // More than just student_name
                    const isCompleted = hasSelections && !isActive;
                    
                    return (
                      <div
                        key={type}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isActive
                            ? "bg-background text-primary border-2 border-primary"
                            : isCompleted
                            ? "bg-green-100 text-green-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                        <span className="hidden md:inline">
                          {allSelections[type].length > 0 && ` (${allSelections[type].length})`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Current Certificate Type Card */}
              <div className="mb-8">
                <h3 className="font-medium mb-4 text-lg capitalize">{currentCard} Certificate</h3>
                <div className="bg-muted/30 rounded-lg p-6 border-2 border-primary">
                  <div className="mb-4">
                    <p className="text-sm font-medium">
                      Select Fields to Include:
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    {CERTIFICATE_ATTRIBUTES[currentCard].map((attr) => (
                      <div key={attr.key} className="flex items-center space-x-3">
                        <Checkbox
                          id={`${currentCard}-${attr.key}`}
                          checked={allSelections[currentCard].includes(attr.key)}
                          onCheckedChange={() => handleAttributeToggle(currentCard, attr.key)}
                          disabled={attr.key === "student_name"}
                        />
                        <label
                          htmlFor={`${currentCard}-${attr.key}`}
                          className={`text-sm font-medium leading-none ${
                            attr.key === "student_name" 
                              ? "cursor-not-allowed opacity-70" 
                              : "cursor-pointer"
                          }`}
                        >
                          {attr.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-row justify-between items-center md:justify-end gap-2">
                {currentCard !== "course" ? (
                  <>
                    {/* Mobile: Plain text link */}
                    <button
                      onClick={() => {
                        if (currentCard === "webinar") {
                          setCurrentCard("course")
                        } else if (currentCard === "workshop") {
                          setCurrentCard("webinar")
                        }
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground md:hidden"
                    >
                      Previous
                    </button>
                    {/* Desktop: Button */}
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (currentCard === "webinar") {
                          setCurrentCard("course")
                        } else if (currentCard === "workshop") {
                          setCurrentCard("webinar")
                        }
                      }}
                      className="hidden md:inline-flex"
                    >
                      Previous
                    </Button>
                  </>
                ) : (
                  <div className="md:hidden" />
                )}

                {currentCard === "workshop" ? (
                  <Button
                    onClick={handleStep2Complete}
                    disabled={allSelections.course.length === 0 && allSelections.webinar.length === 0 && allSelections.workshop.length === 0}
                    className="md:w-auto"
                  >
                    Continue to Next Step
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleMoveToNextCard}
                    disabled={allSelections[currentCard].length <= 1}
                    className="md:w-auto"
                  >
                    Move Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Generate */}
        {activeStep === 2 && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-card border rounded-lg p-4 md:p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              
              <h2 className="text-xl font-medium mb-2">Ready to Generate Certificates!</h2>
              <p className="text-muted-foreground mb-6">
                Your base template is set up and ready. You can now start generating certificates
                for your students.
              </p>

              <Button size="lg" onClick={handleGenerateRedirect} className="w-full md:w-auto">
                <span className="hidden sm:inline">Continue to Generate Certificates</span>
                <span className="sm:hidden">Generate Certificates</span>
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
