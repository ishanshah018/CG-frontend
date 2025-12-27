"use client"

import { useState, useEffect, useMemo } from "react"
import { normalizeCertificateMappings } from "@/lib/certificate-utils"

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

interface CertificatePreviewProps {
templateUrl: string
mapping: CertificateMapping
formData: Record<string, string>
isDraggable?: boolean
onDragStart?: (e: React.MouseEvent, element: string) => void
draggingElement?: string | null
showGuides?: boolean
}

export function CertificatePreview({
templateUrl,
mapping,
formData,
isDraggable = false,
onDragStart,
draggingElement = null,
showGuides = false,
}: CertificatePreviewProps) {
const [imageError, setImageError] = useState(false)
const [imageLoaded, setImageLoaded] = useState(false)
const [minimumSkeletonTimePassed, setMinimumSkeletonTimePassed] = useState(false)

// Normalize mapping for rendering ONLY (applies backend font weight rules)
// IMPORTANT: Does NOT mutate original mapping prop
const normalizedMapping = useMemo(() => normalizeCertificateMappings(mapping), [mapping])

// Intentional 1.3-second minimum delay for premium UX
useEffect(() => {
const timer = setTimeout(() => {
    setMinimumSkeletonTimePassed(true)
}, 500)

return () => clearTimeout(timer)
}, [])

const handleImageLoad = () => {
setImageLoaded(true)
setImageError(false)
}

const handleImageError = () => {
console.error("Failed to load certificate template image:", templateUrl)
setImageError(true)
setImageLoaded(false)
}

// Check if preview is ready to render - requires ALL conditions including minimum delay
const isPreviewReady = !!templateUrl && !!mapping && imageLoaded === true && minimumSkeletonTimePassed === true

if (!mapping || !templateUrl) {
return (
    <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
    <p className="text-sm text-muted-foreground">No preview available</p>
    </div>
)
}

// Get draggable attributes (those NOT in attributesInDescription)
// Exclude heading2 as it's a static text block, not a dynamic attribute
const draggableAttributes = Object.keys(normalizedMapping.attributes || {}).filter(
(attr) => 
    attr !== "heading2" && 
    !normalizedMapping.attributesInDescription?.includes(attr)
)

return (
<div className="w-full">
    {imageError && (
    <div className="flex items-center justify-center h-96 bg-muted rounded-lg">
        <div className="text-center space-y-2">
        <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
        >
            <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
        </svg>
        <p className="text-sm text-muted-foreground">Failed to load certificate template</p>
        </div>
    </div>
    )}

    {/* Professional Skeleton Loader - shown while loading */}
    {!imageError && !isPreviewReady && (
    <div className="relative w-full aspect-[1.414/1] bg-muted rounded-lg overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 space-y-8">
        {/* Heading skeleton */}
        <div className="w-2/3 h-8 bg-gray-300 rounded-md animate-pulse" />
        
        {/* Subheading skeleton */}
        <div className="w-1/2 h-6 bg-gray-300 rounded-md animate-pulse" style={{ animationDelay: '150ms' }} />
        
        {/* Name placeholder skeleton */}
        <div className="w-3/5 h-10 bg-gray-300 rounded-md animate-pulse" style={{ animationDelay: '300ms' }} />
        
        {/* Description skeleton */}
        <div className="w-4/5 space-y-3 mt-8">
            <div className="h-4 bg-gray-300 rounded animate-pulse" style={{ animationDelay: '450ms' }} />
            <div className="h-4 bg-gray-300 rounded w-5/6 animate-pulse" style={{ animationDelay: '600ms' }} />
        </div>
        
        {/* Date skeleton */}
        <div className="w-1/3 h-5 bg-gray-300 rounded-md animate-pulse mt-8" style={{ animationDelay: '750ms' }} />
        </div>
        
        {/* Subtle shimmer effect overlay */}
        <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/10 to-transparent animate-shimmer" 
            style={{ 
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s infinite'
            }} 
        />
    </div>
    )}

    {!imageError && (
    <div
        className="relative w-full aspect-[1.414/1] rounded-lg overflow-visible select-none"
        style={{ 
        cursor: draggingElement ? "grabbing" : "default", 
        userSelect: "none",
        display: isPreviewReady ? 'block' : 'none',
        backgroundColor: '#ffffff'
        }}
    >
        {/* Base Template Image - Hidden until loaded */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
        src={templateUrl}
        alt="Base Certificate"
        className="w-full h-full object-contain pointer-events-none"
        style={{ WebkitFontSmoothing: 'antialiased', MozOsxFontSmoothing: 'grayscale' }}
        onLoad={handleImageLoad}
        onError={handleImageError}
        />

        {/* Render overlays ONLY when preview is ready */}
        {isPreviewReady && (
        <>
            {/* Center Guide Lines */}
            {showGuides && (
            <>
                <div
                className="absolute top-0 bottom-0 w-px bg-blue-500 pointer-events-none"
                style={{ left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}
                />
                <div
                className="absolute left-0 right-0 h-px bg-blue-500 pointer-events-none"
                style={{ top: '50%', transform: 'translateY(-50%)', zIndex: 10 }}
                />
            </>
            )}

        {/* Heading */}
        <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
            isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        } ${draggingElement === "heading" ? "opacity-70" : ""}`}
        style={{
            left: `${normalizedMapping.heading.x}%`,
            top: `${normalizedMapping.heading.y}%`,
            userSelect: "none",
        }}
        onMouseDown={isDraggable && onDragStart ? (e) => onDragStart(e, "heading") : undefined}
        >
        <div
            className={`whitespace-nowrap select-none ${
            isDraggable ? "hover:bg-primary/10 px-2 py-1 rounded" : ""
            }`}
            style={{
            fontFamily: normalizedMapping.heading.style.fontFamily,
            fontSize: `${normalizedMapping.heading.style.fontSize}px`,
            color: normalizedMapping.heading.style.color,
            fontWeight: normalizedMapping.heading.style.fontWeight || 700,
            textAlign: "center",
            userSelect: "none",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            }}
        >
            {normalizedMapping.heading.text.includes("<br>")
            ? normalizedMapping.heading.text.split("<br>")[0]
            : normalizedMapping.heading.text}
        </div>
        </div>

        {/* Heading 2 (derived from heading text split, if exists) */}
        {normalizedMapping.heading.text.includes("<br>") && normalizedMapping.attributes.heading2 && (
        <div
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
            isDraggable ? "cursor-grab active:cursor-grabbing" : ""
            } ${draggingElement === "heading2" ? "opacity-70" : ""}`}
            style={{
            left: `${normalizedMapping.attributes.heading2.x}%`,
            top: `${normalizedMapping.attributes.heading2.y}%`,
            userSelect: "none",
            }}
            onMouseDown={isDraggable && onDragStart ? (e) => onDragStart(e, "heading2") : undefined}
        >
            <div
            className={`whitespace-nowrap select-none ${
                isDraggable ? "hover:bg-primary/10 px-2 py-1 rounded" : ""
            }`}
            style={{
                fontFamily: normalizedMapping.heading.style.fontFamily,
                fontSize: `${normalizedMapping.attributes.heading2.style.fontSize}px`,
                color: normalizedMapping.heading.style.color,
                fontWeight: normalizedMapping.attributes.heading2.style.fontWeight || 600,
                textAlign: "center",
                userSelect: "none",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
            }}
            >
            {normalizedMapping.heading.text.split("<br>")[1] || ""}
            </div>
        </div>
        )}

        {/* Description Top */}
        <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
            isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        } ${draggingElement === "descriptionTop" ? "opacity-70" : ""}`}
        style={{
            left: `${normalizedMapping.descriptionTop.x}%`,
            top: `${normalizedMapping.descriptionTop.y}%`,
            userSelect: "none",
        }}
        onMouseDown={isDraggable && onDragStart ? (e) => onDragStart(e, "descriptionTop") : undefined}
        >
        <div
            className={`select-none ${
            isDraggable ? "hover:bg-primary/10 px-2 py-1 rounded" : ""
            }`}
            style={{
            fontFamily: normalizedMapping.descriptionTop.style.fontFamily,
            fontSize: `${normalizedMapping.descriptionTop.style.fontSize}px`,
            color: normalizedMapping.descriptionTop.style.color,
            fontWeight: normalizedMapping.descriptionTop.style.fontWeight || 400,
            textAlign: "center",
            userSelect: "none",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            }}
        >
            {normalizedMapping.descriptionTop.text}
        </div>
        </div>

        {/* All Draggable Attributes (excluding those in description) */}
        {draggableAttributes.map((attr) => {
        const pos = normalizedMapping.attributes[attr]
        if (!pos) return null

        const value = formData[attr] || `{${attr}}`

        return (
            <div
            key={attr}
            className={`absolute transform -translate-x-1/2 -translate-y-1/2 select-none ${
                isDraggable ? "cursor-grab active:cursor-grabbing" : ""
            } ${draggingElement === attr ? "opacity-70" : ""}`}
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, userSelect: "none" }}
            onMouseDown={isDraggable && onDragStart ? (e) => onDragStart(e, attr) : undefined}
            >
            <div
                className={`whitespace-nowrap select-none ${
                isDraggable ? "hover:bg-primary/10 px-3 py-1 rounded" : ""
                }`}
                style={{
                fontFamily: pos.style.fontFamily,
                fontSize: `${pos.style.fontSize}px`,
                color: pos.style.color,
                fontWeight: pos.style.fontWeight || 500,
                textAlign: "center",
                userSelect: "none",
                WebkitFontSmoothing: "antialiased",
                MozOsxFontSmoothing: "grayscale",
                }}
            >
                {value}
            </div>
            </div>
        )
        })}

        {/* Description Body - supports <br> tags and replaces {attribute} placeholders */}
        <div
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 max-w-[80%] select-none ${
            isDraggable ? "cursor-grab active:cursor-grabbing" : ""
        } ${draggingElement === "descriptionBody" ? "opacity-70" : ""}`}
        style={{
            left: `${normalizedMapping.descriptionBody.x}%`,
            top: `${normalizedMapping.descriptionBody.y}%`,
            userSelect: "none",
        }}
        onMouseDown={isDraggable && onDragStart ? (e) => onDragStart(e, "descriptionBody") : undefined}
        >
        <div
            className={`select-none ${
            isDraggable ? "hover:bg-primary/10 px-2 py-1 rounded" : ""
            }`}
            style={{
            fontFamily: normalizedMapping.descriptionBody.style.fontFamily,
            fontSize: `${normalizedMapping.descriptionBody.style.fontSize}px`,
            color: normalizedMapping.descriptionBody.style.color,
            fontWeight: normalizedMapping.descriptionBody.style.fontWeight || 400,
            textAlign: "center",
            userSelect: "none",
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            }}
            dangerouslySetInnerHTML={{
            __html: normalizedMapping.descriptionBody.text
                .replace(/<br>/gi, '<br/>')
                .replace(/\{([^}]+)\}/g, (match, attrName) => {
                const attributeStyle = normalizedMapping.attributes[attrName]?.style
                const attributeFontWeight = attributeStyle?.fontWeight || 500
                const value = formData[attrName] || match
                // Apply bold fontWeight (600) for better visibility in description
                return `<span style="font-weight: 600 !important; display: inline;">${value}</span>`
                })
            }}
        />
        </div>
        </>
        )}
    </div>
    )}
</div>
)
}
