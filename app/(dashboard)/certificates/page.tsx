"use client";

import { useEffect, useState, useRef, useCallback } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationMeta, setPaginationMeta] = useState({
    totalPages: 1,
    totalCount: 0,
    limit: 50,
  });

  // Fetch guard to prevent duplicate calls within the same render cycle
  const lastFetchParamsRef = useRef<string>("");
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCertificates = useCallback(async (
    page: number,
    limit: number,
    filterState: FilterState,
    showRefreshIndicator = false
  ) => {
    // Build params string to detect duplicate calls
    const paramsKey = JSON.stringify({
      page,
      limit,
      search: filterState.search?.trim() || "",
      certificateType: filterState.certificateType,
      status: filterState.status,
      emailStatus: filterState.emailStatus,
      dateFilter: filterState.dateFilter,
    });

    // Skip if this exact call was just made (duplicate prevention)
    if (paramsKey === lastFetchParamsRef.current && !showRefreshIndicator) {
      return;
    }

    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    // Update the last fetch params
    lastFetchParamsRef.current = paramsKey;

    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      // Build params with explicit defaults - NEVER allow undefined
      const params: GetIssuedCertificatesParams = {
        page: page || 1,
        limit: limit || 50,
      };

      // Only add filters if they have actual values
      if (filterState.search?.trim()) params.search = filterState.search.trim();
      if (filterState.certificateType && filterState.certificateType !== "all") {
        params.certificateType = filterState.certificateType;
      }
      if (filterState.status && filterState.status !== "all") {
        params.status = filterState.status;
      }
      if (filterState.emailStatus && filterState.emailStatus !== "all") {
        params.emailStatus = filterState.emailStatus;
      }
      if (filterState.dateFilter && filterState.dateFilter !== "all") {
        params.dateFilter = filterState.dateFilter;
      }

      const response = await getIssuedCertificates(params);

      // Defensive: Ensure response data exists and is valid
      const certificatesData = response?.data?.certificates ?? [];
      const paginationData = response?.data?.pagination ?? {
        currentPage: 1,
        totalPages: 1,
        totalCount: 0,
        limit: 50,
      };

      // Extra safety: Filter out any null/undefined certificates
      setCertificates(certificatesData.filter(Boolean));
      setPaginationMeta({
        totalPages: paginationData.totalPages,
        totalCount: paginationData.totalCount,
        limit: paginationData.limit,
      });
    } catch (error) {
      // Ignore abort errors
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }
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
  }, []);

  // Single source of truth for API calls with stable primitive dependencies
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCertificates(
        currentPage,
        paginationMeta.limit,
        filters,
        false
      );
    }, filters.search ? 300 : 0); // Debounce only for search

    return () => clearTimeout(timeout);
  }, [
    currentPage,
    paginationMeta.limit,
    filters.search,
    filters.certificateType,
    filters.status,
    filters.emailStatus,
    filters.dateFilter,
    fetchCertificates,
  ]);

  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleFilterChange = (newFilters: FilterState) => {
    // Reset page to 1 and update filters in one logical update
    // React 18 batches these automatically within event handlers
    setCurrentPage(1);
    setFilters(newFilters);
    // Clear the last fetch params to allow the new fetch
    lastFetchParamsRef.current = "";
  };

  const handleRefresh = () => {
    // Clear the last fetch params to force a refresh
    lastFetchParamsRef.current = "";
    fetchCertificates(currentPage, paginationMeta.limit, filters, true);
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
                Showing {certificates.length} of {paginationMeta.totalCount || certificates.length} certificates
              </div>
              {paginationMeta.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      lastFetchParamsRef.current = "";
                      setCurrentPage((prev) => Math.max(1, prev - 1));
                    }}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span>
                    Page {currentPage} of {paginationMeta.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      lastFetchParamsRef.current = "";
                      setCurrentPage((prev) => Math.min(paginationMeta.totalPages, prev + 1));
                    }}
                    disabled={currentPage === paginationMeta.totalPages}
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
