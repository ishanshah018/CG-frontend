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

// Backend returns false when no base template is uploaded
if (data.success && data.data && data.data !== false) {
// Store in sessionStorage
storeCertificateAttributes(data.data);
return data.data;
}

// Return null when data is false or not present (no base template)
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
export async function saveCertificateMapping(mappings: any): Promise<{ success: boolean; message: string }> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  if (!mappings) {
    throw new Error("No certificate mapping data provided");
  }

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
 * Issued Certificates Types and Interfaces
 */
export type CertificateStatus = "pending" | "generated" | "failed" | "archived";

export interface IssuedCertificate {
  certificate_id: string;
  org_id: string;
  certificate_type: CertificateType;
  student: {
    name: string;
    email: string;
    student_id?: string;
  };
  attributes: Record<string, string>;
  status: CertificateStatus;
  is_emailed: boolean;
  file?: {
    format: string;
    s3_key: string;
  };
  createdAt: string;
  updatedAt: string;
  error?: string;
}

export interface GetIssuedCertificatesParams {
  page?: number;
  limit?: number;
  search?: string;
  certificateType?: CertificateType | "all";
  status?: CertificateStatus | "all";
  emailStatus?: "sent" | "not_sent" | "all";
  dateFilter?: "today" | "last_7_days" | "last_30_days" | "this_year" | "custom";
  startDate?: string;
  endDate?: string;
}

export interface GetIssuedCertificatesResponse {
  success: boolean;
  message: string;
  data: {
    certificates: IssuedCertificate[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      limit: number;
    };
  };
}

/**
 * Get Issued Certificates
 * Fetches all issued certificates with filters
 */
export async function getIssuedCertificates(
  params: GetIssuedCertificatesParams = {}
): Promise<GetIssuedCertificatesResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  // Build query string with EXACT backend field names
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append("page", params.page.toString());
  if (params.limit) queryParams.append("limit", params.limit.toString());
  if (params.search) queryParams.append("search", params.search);
  
  // CRITICAL: Use backend field name "certificate_type" not "certificateType"
  if (params.certificateType && params.certificateType !== "all") {
    queryParams.append("certificate_type", params.certificateType);
  }
  
  if (params.status && params.status !== "all") {
    queryParams.append("status", params.status);
  }
  
  // CRITICAL: Use backend field name "is_emailed" not "emailStatus"
  if (params.emailStatus && params.emailStatus !== "all") {
    const isEmailedValue = params.emailStatus === "sent" ? "true" : "false";
    queryParams.append("is_emailed", isEmailedValue);
  }
  
  if (params.dateFilter) queryParams.append("dateFilter", params.dateFilter);
  if (params.startDate) queryParams.append("startDate", params.startDate);
  if (params.endDate) queryParams.append("endDate", params.endDate);

  const queryString = queryParams.toString();
  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.ISSUED}${
    queryString ? `?${queryString}` : ""
  }`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch issued certificates");
  }


  return data;
}

/**
 * View Certificate
 * Gets presigned URL to view a certificate
 */
export async function viewCertificate(certificateId: string): Promise<{ view_url: string; expires_in_seconds: number }> {
  // CRITICAL: Guard against undefined/null certificateId
  if (!certificateId || certificateId === "undefined") {
    throw new Error("Invalid certificate ID");
  }

  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.VIEW}/${certificateId}/view`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to get certificate view URL");
  }

  return data.data;
}

/**
 * Resend Certificate Email
 * Resends certificate email to student
 */
export async function resendCertificateEmail(
  certificateId: string
): Promise<{ success: boolean; message: string }> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.RESEND_EMAIL}/${certificateId}/resend-email`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to resend certificate email");
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

/**
 * Generate Certificate Types
 */
export type CertificateType = "course" | "webinar" | "workshop";

export interface GenerateCertificateRequest {
  certificateType: CertificateType;
  student: {
    name: string;
    email: string;
  };
  attributes: Record<string, string>;
}

export interface GenerateCertificateResponse {
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Generate Certificate
 * Generates a certificate based on the provided data
 */
export async function generateCertificate(
  payload: GenerateCertificateRequest
): Promise<GenerateCertificateResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    API_CONFIG.ENDPOINTS.CERTIFICATES.GENERATE,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to generate certificate");
  }

  return data;
}

// Dashboard Usage Types
export interface DashboardUsageData {
  monthly_certificate_limit: number;
  monthly_certificates_used: number;
  remaining: number;
  usage_percentage: number;
  billing_cycle: {
    started_at: string;
    resets_at: string;
  };
}

export interface DashboardUsageResponse {
  success: boolean;
  message?: string;
  data: DashboardUsageData;
}

/**
 * Get dashboard certificate usage
 * Retrieves current certificate usage stats and limits
 */
export async function getDashboardUsage(): Promise<DashboardUsageResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CERTIFICATES.DASHBOARD.USAGE}`,
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
    throw new Error(data.message || "Failed to get dashboard usage");
  }

  return data;
}

// Dashboard Insights Types
export interface DashboardInsightsData {
  total_issued: number;
  issued_this_month: number;
  by_type: {
    course: number;
    webinar: number;
    workshop: number;
  };
  most_issued_type: "course" | "webinar" | "workshop" | null;
}

export interface DashboardInsightsResponse {
  success: boolean;
  message?: string;
  data: DashboardInsightsData;
}

/**
 * Get dashboard insights
 * Retrieves certificate statistics and breakdown
 */
export async function getDashboardInsights(): Promise<DashboardInsightsResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/certificates/dashboard/insights`,
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
    throw new Error(data.message || "Failed to get dashboard insights");
  }

  return data;
}

// Dashboard Graph Types
export interface DashboardGraphPoint {
  month: string;
  count: number;
}

export interface DashboardGraphData {
  year: number;
  points: DashboardGraphPoint[];
}

export interface DashboardGraphResponse {
  success: boolean;
  message?: string;
  data: DashboardGraphData;
}

/**
 * Get dashboard graph data
 * Retrieves monthly certificate counts for a specific year
 */
export async function getDashboardGraph(year: number): Promise<DashboardGraphResponse> {
  const token = sessionStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  if (!token) {
    throw new Error("No authentication token found");
  }

  const response = await fetch(
    `${API_CONFIG.BASE_URL}/api/certificates/dashboard/graph?year=${year}`,
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
    throw new Error(data.message || "Failed to get dashboard graph");
  }

  return data;
}