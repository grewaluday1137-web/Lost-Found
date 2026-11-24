"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import { Report, ReportType } from "@/types";
import ReportCard from "@/components/report-card";
import { Search, Filter, RotateCcw, Sparkles } from "lucide-react";

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
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          Live Campus Directory
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Campus Property Catalog
        </h1>
        <p className="text-sm text-slate-400">
          Browse, search, and filter verified lost and found listings across campus facilities.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-slate-900/75 backdrop-blur-xl p-6 rounded-3xl border border-slate-800/80 shadow-2xl space-y-5">
        {/* Search input */}
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by keyword, brand, item name (e.g. 'AirPods', 'HydroFlask', 'Backpack')..."
              className="w-full pl-11 pr-4 py-3 bg-slate-950/70 rounded-2xl border border-slate-700/80 text-sm text-white placeholder-slate-400 focus:bg-slate-950 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all hover:scale-102 shrink-0"
          >
            Search
          </button>
        </form>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 pt-3 border-t border-slate-800/80 text-xs">
          {/* Type Filter */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Report Type</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950/70 text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500"
            >
              <option value="" className="bg-slate-900">All Types (Lost & Found)</option>
              <option value="lost" className="bg-slate-900">Lost Items Only</option>
              <option value="found" className="bg-slate-900">Found Items Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-950/70 text-slate-200 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500"
            >
              <option value="" className="bg-slate-900">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-slate-900">{c}</option>
              ))}
            </select>
          </div>

          {/* Color Filter */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Color</label>
            <input
              type="text"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="e.g. Black, Blue, Silver"
              className="w-full py-2.5 px-3 bg-slate-950/70 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Location Filter */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Library, Gym, Science Hall"
              className="w-full py-2.5 px-3 bg-slate-950/70 text-slate-200 placeholder-slate-500 rounded-xl border border-slate-700/80 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-slate-400 font-medium">
            Showing <strong className="text-white">{reports.length}</strong> {reports.length === 1 ? "result" : "results"}
          </span>
          <button
            onClick={resetFilters}
            className="text-slate-400 hover:text-white flex items-center gap-1 font-semibold transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
          </button>
        </div>
      </div>

      {/* Results Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-72 bg-slate-900/40 border border-slate-800/80 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 backdrop-blur-md rounded-3xl border border-slate-800/80 space-y-3">
          <Filter className="w-12 h-12 text-slate-600 mx-auto" />
          <h3 className="font-bold text-white text-base">No Matching Reports Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
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
    <Suspense fallback={<div className="h-64 bg-slate-900/30 rounded-3xl animate-pulse" />}>
      <ReportsCatalogContent />
    </Suspense>
  );
}
