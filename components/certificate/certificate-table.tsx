"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Eye, Mail, RotateCw, CheckCircle2, Clock, XCircle } from "lucide-react";
import type {
  IssuedCertificate,
  GenerateCertificateRequest,
} from "@/lib/api/certificates";
import {
  viewCertificate,
  resendCertificateEmail,
  generateCertificate,
} from "@/lib/api/certificates";
import {
  getIssuedCertificateTitle,
  formatCertificateDate,
  getStatusConfig,
  getTypeColorClass,
  getStudentName,
  getStudentEmail,
  canViewCertificate,
  canRegenerateCertificate,
  canResendEmail,
} from "@/lib/certificate-utils";
import { toast } from "sonner";

interface CertificateTableProps {
  certificates: IssuedCertificate[];
  onRefresh: () => void;
}

export function CertificateTable({ certificates, onRefresh }: CertificateTableProps) {
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setLoading = (id: string, loading: boolean) => {
    setLoadingStates((prev) => ({ ...prev, [id]: loading }));
  };

  const handleView = async (certificate: IssuedCertificate) => {
    const certificateId = certificate.certificate_id;
    
    if (!certificateId) {
      toast.error("Invalid certificate ID");
      return;
    }

    setLoading(certificateId, true);
    try {
      const response = await viewCertificate(certificateId);
      const viewUrl = response?.view_url;

      if (!viewUrl) {
        throw new Error("No view URL returned from server");
      }

      // Open certificate in new tab with security flags
      window.open(viewUrl, "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error("Unable to open certificate. Please try again.");
    } finally {
      setLoading(certificateId, false);
    }
  };

  const handleResendEmail = async (certificate: IssuedCertificate) => {
    const certificateId = certificate.certificate_id;
    
    if (!certificateId) {
      toast.error("Invalid certificate ID");
      return;
    }

    setLoading(`email-${certificateId}`, true);
    try {
      await resendCertificateEmail(certificateId);
      toast.success("Email sent successfully");
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to resend email");
    } finally {
      setLoading(`email-${certificateId}`, false);
    }
  };

  const handleRegenerate = async (cert: IssuedCertificate) => {
    const certificateId = cert.certificate_id;
    
    setLoading(`regen-${certificateId}`, true);
    try {
      // Guard: Ensure we have minimum required data
      if (!cert.certificate_type || !cert.student) {
        throw new Error("Invalid certificate data");
      }

      const payload: GenerateCertificateRequest = {
        certificateType: cert.certificate_type,
        student: cert.student,
        attributes: cert.attributes ?? {}, // Safe fallback to empty object
      };

      await generateCertificate(payload);
      
      toast.success("Certificate regeneration started");
      
      onRefresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate certificate");
    } finally {
      setLoading(`regen-${certificateId}`, false);
    }
  };

  const renderStatusBadge = (status: IssuedCertificate["status"]) => {
    const config = getStatusConfig(status);
    return (
      <Badge variant={config.variant} className="capitalize">
        {config.text}
      </Badge>
    );
  };

  const renderTypeBadge = (cert: IssuedCertificate) => {
    const colorClass = getTypeColorClass(cert.certificate_type);
    return (
      <Badge variant="outline" className={`capitalize ${colorClass}`}>
        {cert.certificate_type ?? "certificate"}
      </Badge>
    );
  };

  if (certificates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 rounded-full bg-muted p-6">
          <XCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">No certificates found</h3>
        <p className="text-sm text-muted-foreground">
          No certificates match your current filters
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-sm font-medium">Student</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Type</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Title</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Issued On</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
              <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
              <th className="px-4 py-3 text-right text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map((cert, index) => (
              <tr
                key={cert.certificate_id || `cert-${index}`}
                className={`border-b transition-colors hover:bg-muted/50 ${
                  cert.status === "archived" ? "opacity-60" : ""
                }`}
              >
                {/* Student */}
                <td className="px-4 py-4">
                  <div className="flex flex-col">
                    <span className="font-medium">{getStudentName(cert.student)}</span>
                    <span className="text-sm text-muted-foreground">
                      {getStudentEmail(cert.student)}
                    </span>
                  </div>
                </td>

                {/* Type */}
                <td className="px-4 py-4">{renderTypeBadge(cert)}</td>

                {/* Title */}
                <td className="px-4 py-4">
                  <span className="text-sm">
                    {getIssuedCertificateTitle(cert.certificate_type, cert.attributes)}
                  </span>
                </td>

                {/* Issued On */}
                <td className="px-4 py-4">
                  <span className="text-sm text-muted-foreground">
                    {formatCertificateDate(cert.createdAt)}
                  </span>
                </td>

                {/* Status */}
                <td className="px-4 py-4">{renderStatusBadge(cert.status)}</td>

                {/* Email */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {cert.is_emailed ? (
                      <span className="flex items-center gap-1 text-sm text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Sent
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        Not Sent
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <TooltipProvider>
                      {/* CASE 1: Pending */}
                      {cert.status === "pending" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button size="sm" variant="ghost" disabled>
                              <Clock className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Certificate is being generated</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* CASE 2: Generated - View & Resend Email */}
                      {canViewCertificate(cert.status) && (
                        <>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleView(cert)}
                                disabled={loadingStates[cert.certificate_id]}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>View Certificate</p>
                            </TooltipContent>
                          </Tooltip>

                          {canResendEmail(cert.status, cert.is_emailed) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleResendEmail(cert)}
                                  disabled={loadingStates[`email-${cert.certificate_id}`]}
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Resend Email</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </>
                      )}

                      {/* CASE 3: Failed - Regenerate */}
                      {canRegenerateCertificate(cert.status) && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRegenerate(cert)}
                              disabled={loadingStates[`regen-${cert.certificate_id}`]}
                            >
                              <RotateCw className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Regenerate Certificate</p>
                          </TooltipContent>
                        </Tooltip>
                      )}

                      {/* CASE 4: Archived - no actions */}
                    </TooltipProvider>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
