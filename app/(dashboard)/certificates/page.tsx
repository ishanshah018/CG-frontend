"use client";

import { useEffect, useState } from "react";
import { CertificateFilters, type FilterState } from "@/components/certificate/certificate-filters";
import { CertificateTable } from "@/components/certificate/certificate-table";
import Loader from "@/components/loader";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  getIssuedCertificates,
  type IssuedCertificate,
  type GetIssuedCertificatesParams,
} from "@/lib/api/certificates";
import { toast } from "@/hooks/use-toast";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<IssuedCertificate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    certificateType: "all",
    status: "all",
    emailStatus: "all",
    dateFilter: "all",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 50,
  });

  const fetchCertificates = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Build params with explicit defaults - NEVER allow undefined
      const params: GetIssuedCertificatesParams = {
        page: pagination.currentPage || 1,
        limit: pagination.limit || 50,
      };

      // Only add filters if they have actual values
      if (filters.search?.trim()) params.search = filters.search.trim();
      if (filters.certificateType && filters.certificateType !== "all") {
        params.certificateType = filters.certificateType;
      }
      if (filters.status && filters.status !== "all") {
        params.status = filters.status;
      }
      if (filters.emailStatus && filters.emailStatus !== "all") {
        params.emailStatus = filters.emailStatus;
      }
      if (filters.dateFilter && filters.dateFilter !== "all") {
        params.dateFilter = filters.dateFilter;
      }

      const response = await getIssuedCertificates(params);

      // Defensive: Ensure response data exists and is valid
      const certificates = response?.data?.certificates ?? [];
      const paginationData = response?.data?.pagination ?? {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 50,
      };

      // Extra safety: Filter out any null/undefined certificates
      setCertificates(certificates.filter(Boolean));
      setPagination(paginationData);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch certificates",
        variant: "destructive",
      });
      setCertificates([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Single source of truth for API calls with stable dependencies
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCertificates();
    }, filters.search ? 300 : 0); // Debounce only for search

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    pagination.currentPage,
    pagination.limit,
    filters.search,
    filters.certificateType,
    filters.status,
    filters.emailStatus,
    filters.dateFilter,
  ]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
  };

  const handleRefresh = () => {
    fetchCertificates(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Issued Certificates</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            All certificates generated for your organization
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <CertificateFilters onFilterChange={handleFilterChange} />

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader size="large" text="Loading certificates..." />
        </div>
      ) : (
        <>
          <CertificateTable certificates={certificates} onRefresh={handleRefresh} />

          {/* Pagination Info */}
          {certificates.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Showing {certificates.length} of {pagination.totalCount} certificates
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: Math.max(1, prev.currentPage - 1),
                      }))
                    }
                    disabled={pagination.currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPagination((prev) => ({
                        ...prev,
                        currentPage: Math.min(prev.totalPages, prev.currentPage + 1),
                      }))
                    }
                    disabled={pagination.currentPage === pagination.totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
