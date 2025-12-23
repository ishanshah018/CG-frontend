/**
 * Certificate API handlers
 * Handles all certificate-related API calls
 */

import { API_CONFIG, STORAGE_KEYS } from "./config";

// Types
export interface BaseCertificateTemplate {
template_id: string;
organization_id: string;
template_url: string;
original_file_name: string;
file_size: number;
is_active: boolean;
uploaded_at: string;
}

export interface GetBaseCertificateResponse {
success: boolean;
message: string;
data?: BaseCertificateTemplate;
}

export interface DeleteBaseCertificateResponse {
success: boolean;
message: string;
}
export interface UploadCertificateResponse {
success: boolean;
message: string;
data?: {
template_id: string;
organization_id: string;
template_url: string;
original_file_name: string;
file_size: number;
};
}
export interface CertificateAttributes {
course: string[];
webinar: string[];
workshop: string[];
}

// Certificate attribute options
export const CERTIFICATE_ATTRIBUTES = {
course: [
{ key: "student_name", label: "Student Name" },
{ key: "course_name", label: "Course Name" },
{ key: "completion_date", label: "Completion Date" },
],
webinar: [
{ key: "student_name", label: "Student Name" },
{ key: "webinar_name", label: "Webinar Name" },
{ key: "host_name", label: "Host Name" },
{ key: "webinar_date", label: "Webinar Date" },
],
workshop: [
{ key: "student_name", label: "Student Name" },
{ key: "workshop_name", label: "Workshop Name" },
{ key: "workshop_date", label: "Workshop Date" },
],
} as const;

// File upload constants
export const ALLOWED_FILE_TYPES = {
'image/jpeg': ['.jpg', '.jpeg'],
'image/png': ['.png'],
'application/pdf': ['.pdf']
};

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Get base certificate template
 * Retrieves the current base certificate template for the organization
 */
export async function getBaseCertificateTemplate(): Promise<GetBaseCertificateResponse> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

const response = await fetch(
`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.TEMPLATES.BASE}`,
{
method: "GET",
headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    },
}
);

const data = await response.json();

// Only throw error for actual HTTP errors or auth issues
if (!response.ok && response.status !== 404) {
throw new Error(data.message || "Failed to get base certificate template");
}

return data;
}

/**
 * Delete base certificate template
 * Removes the current base certificate template for the organization
 */
export async function deleteBaseCertificateTemplate(): Promise<DeleteBaseCertificateResponse> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

const response = await fetch(
`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.TEMPLATES.BASE}`,
{
    method: "DELETE",
    headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json",
    },
}
);

const data = await response.json();

if (!response.ok) {
throw new Error(data.message || "Failed to delete base certificate template");
}

return data;
}

/**
 * Upload base certificate template
 * Uploads a new base certificate template for the organization
 */
export async function uploadBaseCertificateTemplate(file: File): Promise<UploadCertificateResponse> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

const formData = new FormData();
formData.append('file', file);

const response = await fetch(
`${API_CONFIG.BASE_URL}/api/certificates/templates/upload`,
{
    method: "POST",
    headers: {
    "Authorization": `Bearer ${token}`,
    },
    body: formData,
}
);

const data = await response.json();

if (!response.ok) {
throw new Error(data.message || "Failed to upload certificate template");
}

return data;
}

/**
 * Validate file for certificate upload
 */
export function validateCertificateFile(file: File): { valid: boolean; error?: string } {
// Check file type
if (!Object.keys(ALLOWED_FILE_TYPES).includes(file.type)) {
return {
    valid: false,
    error: "Invalid file type. Please select a PNG, JPG, or PDF file."
};
}

// Check file size
if (file.size > MAX_FILE_SIZE) {
return {
    valid: false,
    error: `File size too large. Maximum size is ${Math.round(MAX_FILE_SIZE / (1024 * 1024))}MB.`
};
}

return { valid: true };
}

/**
 * Store certificate attributes in sessionStorage
 */
export function storeCertificateAttributes(attributes: CertificateAttributes): void {
if (typeof window === "undefined") return;

try {
sessionStorage.setItem(STORAGE_KEYS.CERTIFICATE_ATTRIBUTES, JSON.stringify(attributes));
} catch (error) {
console.error("Failed to store certificate attributes:", error);
throw new Error("Failed to save certificate attributes");
}
}

/**
 * Retrieve certificate attributes from sessionStorage
 */
export function getCertificateAttributes(): CertificateAttributes | null {
if (typeof window === "undefined") return null;

try {
const attributesStr = sessionStorage.getItem(STORAGE_KEYS.CERTIFICATE_ATTRIBUTES);
if (!attributesStr) return null;

return JSON.parse(attributesStr) as CertificateAttributes;
} catch (error) {
console.error("Failed to retrieve certificate attributes:", error);
return null;
}
}

/**
 * Clear certificate attributes from sessionStorage
 */
export function clearCertificateAttributes(): void {
if (typeof window === "undefined") return;

try {
sessionStorage.removeItem(STORAGE_KEYS.CERTIFICATE_ATTRIBUTES);
} catch (error) {
console.error("Failed to clear certificate attributes:", error);
}
}

/**
 * Format file size to human readable format
 */
export function formatFileSize(bytes: number): string {
if (bytes === 0) return '0 Bytes';

const k = 1024;
const sizes = ['Bytes', 'KB', 'MB', 'GB'];
const i = Math.floor(Math.log(bytes) / Math.log(k));

return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date to human readable format
 */
export function formatUploadDate(dateString: string): string {
const date = new Date(dateString);
return date.toLocaleDateString('en-US', {
year: 'numeric',
month: 'long',
day: 'numeric',
hour: '2-digit',
minute: '2-digit',
});
}

/**
 * POST certificate attributes
 * Sends selected certificate attributes to the server
 */
export async function postCertificateAttributes(): Promise<{ success: boolean; message?: string }> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

// Get attributes from sessionStorage
const attributes = getCertificateAttributes();
if (!attributes) {
throw new Error("No certificate attributes found in session");
}

const response = await fetch(
`${API_CONFIG.BASE_URL}/api/certificates/attributes`,
{
method: "POST",
headers: {
"Authorization": `Bearer ${token}`,
"Content-Type": "application/json",
},
body: JSON.stringify({ certificate_attributes: attributes }),
}
);

const data = await response.json();

if (!response.ok) {
throw new Error(data.message || "Failed to save certificate attributes");
}

return data;
}

/**
 * GET certificate attributes
 * Fetches certificate attributes from server or sessionStorage
 */
export async function fetchCertificateAttributes(): Promise<CertificateAttributes | null> {
// First check if attributes exist in sessionStorage
const cachedAttributes = getCertificateAttributes();
if (cachedAttributes) {
return cachedAttributes;
}

const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

try {
const response = await fetch(
`${API_CONFIG.BASE_URL}/api/certificates/attributes`,
{
method: "GET",
headers: {
"Authorization": `Bearer ${token}`,
"Content-Type": "application/json",
},
}
);

const data = await response.json();

if (!response.ok) {
throw new Error(data.message || "Failed to fetch certificate attributes");
}

if (data.success && data.data) {
// Store in sessionStorage
storeCertificateAttributes(data.data);
return data.data;
}

return null;
} catch (error) {
console.error("Failed to fetch certificate attributes:", error);
throw error;
}
}

/**
 * Save certificate mapping
 * Sends certificate mapping configuration to the server
 */
export async function saveCertificateMapping(): Promise<{ success: boolean; message: string }> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

// Get mapping data from sessionStorage
const mappingData = sessionStorage.getItem("certificate_mapping");
if (!mappingData) {
throw new Error("No certificate mapping found in session");
}

const mappings = JSON.parse(mappingData);

const response = await fetch(
`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.MAPPING.SAVE}`,
{
method: "POST",
headers: {
"Authorization": `Bearer ${token}`,
"Content-Type": "application/json",
},
body: JSON.stringify({ mappings }),
}
);

const data = await response.json();

if (!response.ok) {
throw new Error(data.message || "Failed to save certificate mapping");
}

return data;
}

/**
 * Get certificate mapping
 * Fetches certificate mapping configuration from server
 */
export async function getCertificateMapping(): Promise<{ success: boolean; message?: string; data?: any }> {
const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

if (!token) {
throw new Error("No authentication token found");
}

const response = await fetch(
`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.MAPPING.GET}`,
{
method: "GET",
headers: {
"Authorization": `Bearer ${token}`,
"Content-Type": "application/json",
},
}
);

const data = await response.json();

// If mapping found, store in sessionStorage
if (data.success && data.data) {
sessionStorage.setItem("certificate_mapping", JSON.stringify(data.data));
}

return data;
}