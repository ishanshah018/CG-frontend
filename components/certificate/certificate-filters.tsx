"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import type { CertificateType, CertificateStatus } from "@/lib/api/certificates";

interface CertificateFiltersProps {
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  search: string;
  certificateType: CertificateType | "all";
  status: CertificateStatus | "all";
  emailStatus: "sent" | "not_sent" | "all";
  dateFilter: "today" | "last_7_days" | "last_30_days" | "this_year" | "custom" | "all";
}

export function CertificateFilters({ onFilterChange }: CertificateFiltersProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    certificateType: "all",
    status: "all",
    emailStatus: "all",
    dateFilter: "all",
  });
  const [searchInput, setSearchInput] = useState<string>("");

  const updateFilter = <K extends keyof FilterState>(
    key: K,
    value: FilterState[K]
  ) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSearch = () => {
    updateFilter("search", searchInput);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearFilters = () => {
    const resetFilters: FilterState = {
      search: "",
      certificateType: "all",
      status: "all",
      emailStatus: "all",
      dateFilter: "all",
    };
    setFilters(resetFilters);
    setSearchInput("");
    onFilterChange(resetFilters);
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative max-w-sm flex-1">
          <Input
            type="text"
            placeholder="Search by name or email"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pr-10"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
            style={{ backgroundColor: 'var(--color-brand-primary)' }}
          >
            <Search className="h-4 w-4 text-white" />
          </Button>
        </div>
        {(filters.search ||
          filters.certificateType !== "all" ||
          filters.status !== "all" ||
          filters.emailStatus !== "all" ||
          filters.dateFilter !== "all") && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Date Filter */}
        <Select
          value={filters.dateFilter}
          onValueChange={(value) =>
            updateFilter(
              "dateFilter",
              value as FilterState["dateFilter"]
            )
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Date" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="last_7_days">Last 7 Days</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="this_year">This Year</SelectItem>
          </SelectContent>
        </Select>

        {/* Certificate Type Filter */}
        <Select
          value={filters.certificateType}
          onValueChange={(value) =>
            updateFilter("certificateType", value as FilterState["certificateType"])
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="course">Course</SelectItem>
            <SelectItem value="webinar">Webinar</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) =>
            updateFilter("status", value as FilterState["status"])
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="generated">Generated</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>

        {/* Email Status Filter */}
        <Select
          value={filters.emailStatus}
          onValueChange={(value) =>
            updateFilter("emailStatus", value as FilterState["emailStatus"])
          }
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Email" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emails</SelectItem>
            <SelectItem value="sent">Email Sent</SelectItem>
            <SelectItem value="not_sent">Not Sent</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
