/**
 * Certificate Mapping Normalization Utilities
 * 
 * CRITICAL: These functions apply the EXACT same normalization logic as the backend.
 * Font weight rules MUST match backend-generated certificates to ensure
 * the live preview looks identical to the final generated certificate.
 * 
 * DO NOT modify these rules without updating the backend accordingly.
 */

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

/**
 * Normalizes certificate mappings by applying backend font weight rules.
 * 
 * Font Weight Rules (MUST MATCH BACKEND):
 * - heading → 700
 * - heading2 → 600
 * - descriptionTop → 400
 * - descriptionBody → 400
 * - student_name attribute → 600
 * - All other attributes → 500
 * 
 * IMPORTANT:
 * - This function creates a DEEP COPY and does NOT mutate the original mapping
 * - Apply this ONLY for rendering the preview
 * - DO NOT save normalized data to sessionStorage or backend
 * - DO NOT mutate the original mappingDraft
 * 
 * @param mapping - The original certificate mapping
 * @returns A new normalized mapping with font weights applied
 */
export function normalizeCertificateMappings(mapping: CertificateMapping): CertificateMapping {
// Deep clone to avoid mutating original
const normalized: CertificateMapping = {
heading: {
    ...mapping.heading,
    style: { ...mapping.heading.style, fontWeight: 700 }
},
heading2: mapping.heading2 ? {
    ...mapping.heading2,
    style: { ...mapping.heading2.style, fontWeight: 600 }
} : undefined,
descriptionTop: {
    ...mapping.descriptionTop,
    style: { ...mapping.descriptionTop.style, fontWeight: 400 }
},
descriptionBody: {
    ...mapping.descriptionBody,
    style: { ...mapping.descriptionBody.style, fontWeight: 400 }
},
attributes: {},
attributesInDescription: [...mapping.attributesInDescription]
}

// Apply font weight rules to attributes
Object.entries(mapping.attributes).forEach(([key, value]) => {
const fontWeight = key === 'student_name' ? 600 : 500
normalized.attributes[key] = {
    ...value,
    style: { ...value.style, fontWeight }
}
})

return normalized
}

/**
 * =================================================================
 * ISSUED CERTIFICATES DEFENSIVE HELPERS
 * Production-grade safety functions for certificate data handling
 * =================================================================
 */

import type { IssuedCertificate, CertificateType, CertificateStatus } from "@/lib/api/certificates";

/**
 * SAFE Certificate Title Getter
 * 
 * CRITICAL: Always use this helper instead of direct attribute access
 * Handles undefined, null, and missing attributes gracefully
 */
export function getIssuedCertificateTitle(
  certificate_type: CertificateType,
  attributes?: Record<string, any> | null
): string {
  if (!attributes || typeof attributes !== "object") {
    return "Certificate";
  }

  if (certificate_type === "course") {
    return attributes.course_name ?? "Course Certificate";
  }

  if (certificate_type === "webinar") {
    return attributes.webinar_name ?? attributes.course_name ?? "Webinar Certificate";
  }

  if (certificate_type === "workshop") {
    return attributes.workshop_name ?? attributes.course_name ?? "Workshop Certificate";
  }

  return "Certificate";
}

/**
 * Format Date Safely
 */
export function formatCertificateDate(dateString: string | null | undefined): string {
  try {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

/**
 * Get Status Display Config
 */
export function getStatusConfig(status: CertificateStatus | string) {
  const configs: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; text: string }> = {
    pending: { variant: "secondary", text: "Generating" },
    generated: { variant: "default", text: "Generated" },
    failed: { variant: "destructive", text: "Failed" },
    archived: { variant: "outline", text: "Archived" },
  };
  return configs[status] ?? { variant: "outline" as const, text: "Unknown" };
}

/**
 * Get Type Color Classes
 */
export function getTypeColorClass(type: CertificateType | string): string {
  const colors: Record<string, string> = {
    course: "bg-blue-100 text-blue-700 hover:bg-blue-100",
    webinar: "bg-purple-100 text-purple-700 hover:bg-purple-100",
    workshop: "bg-green-100 text-green-700 hover:bg-green-100",
  };
  return colors[type] ?? "bg-gray-100 text-gray-700 hover:bg-gray-100";
}

/**
 * Safe Student Getters
 */
export function getStudentName(student: any): string {
  return student?.name ?? "Unknown";
}

export function getStudentEmail(student: any): string {
  return student?.email ?? "No email";
}

/**
 * Permission Checkers
 */
export function canViewCertificate(status: CertificateStatus | string): boolean {
  return status === "generated";
}

export function canRegenerateCertificate(status: CertificateStatus | string): boolean {
  return status === "failed";
}

export function canResendEmail(status: CertificateStatus | string, is_emailed: boolean): boolean {
  return status === "generated" && !is_emailed;
}
