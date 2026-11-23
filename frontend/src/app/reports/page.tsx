"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Report, ReportType } from "@/types";
import ReportCard from "@/components/report-card";
import { Search, Filter, RotateCcw } from "lucide-react";

function ReportsCatalogContent() {
  const searchParams = useSearchParams();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [selectedType, setSelectedType] = useState<string>(searchParams.get("type") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [color, setColor] = useState("");
  const [location, setLocation] = useState("");

  const categories = [
    "Electronics",
    "Wallets & Cards",
    "Keys",
    "Books & Bags",
    "Clothing",
    "Accessories",
    "Bottles & Mugs",
    "Sporting Equipment",
    "Other"
  ];

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedType) params.type = selectedType;
      if (category) params.category = category;
      if (color) params.color = color;
      if (location) params.location = location;
      if (query) params.q = query;

      const res = await api.get("/reports", { params });
      setReports(res.data);
    } catch {
      // Graceful error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedType, category]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchReports();
  };

  const resetFilters = () => {
    setQuery("");
    setSelectedType("");
    setCategory("");
    setColor("");
    setLocation("");
    setTimeout(fetchReports, 50);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Campus Property Catalog
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse and filter approved lost and found reports across campus facilities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword, brand, item name (e.g. 'AirPods', 'HydroFlask', 'Black Backpack')..."
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
          {/* Type Filter */}
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Report Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types (Lost & Found)</option>
              <option value="lost">Lost Items Only</option>
              <option value="found">Found Items Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black, Blue, Silver"
              className="w-full py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block font-semibold text-gray-600 mb-1">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Library, Gym, Science Hall"
              className="w-full py-2 px-3 bg-gray-50 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-gray-500 font-medium">
            Showing {reports.length} {reports.length === 1 ? "result" : "results"}
          </span>
          <button
            onClick={resetFilters}
            className="text-xs text-gray-500 hover:text-gray-800 flex items-center gap-1 font-medium"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <Filter className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-base">No Matching Reports Found</h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search terms or clearing specific category and location filters.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {reports.map((report) => (
            <ReportCard key={report._id} report={report} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="h-64 bg-gray-50 rounded-2xl animate-pulse" />}>
      <ReportsCatalogContent />
    </Suspense>
  );
}
