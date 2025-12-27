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
