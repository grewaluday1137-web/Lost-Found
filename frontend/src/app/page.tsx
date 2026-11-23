"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Report } from "@/types";
import ReportCard from "@/components/report-card";
import { 
  Search, PlusCircle, ShieldCheck, CheckCircle2, QrCode, 
  HelpCircle, ArrowRight, Laptop, Wallet, Key, BookOpen, Shirt, Sparkles
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const res = await api.get("/reports?limit=6");
        setRecentReports(res.data);
      } catch {
        // Handle gracefully if backend is booting
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/reports?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/reports");
    }
  };

  const categories = [
    { name: "Electronics", icon: Laptop, color: "text-blue-600 bg-blue-50" },
    { name: "Wallets & Cards", icon: Wallet, color: "text-emerald-600 bg-emerald-50" },
    { name: "Keys", icon: Key, color: "text-amber-600 bg-amber-50" },
    { name: "Books & Bags", icon: BookOpen, color: "text-purple-600 bg-purple-50" },
    { name: "Clothing", icon: Shirt, color: "text-rose-600 bg-rose-50" },
    { name: "Accessories", icon: Sparkles, color: "text-cyan-600 bg-cyan-50" },
  ];

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center py-12 px-4 sm:py-16 bg-gradient-to-b from-blue-50/80 via-white to-transparent rounded-3xl border border-blue-100/50 relative overflow-hidden shadow-xs">
        <div className="max-w-3xl mx-auto space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-800 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            Verified Campus Lost & Found System
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
            Lost Something on Campus? <br className="hidden sm:inline" />
            <span className="text-blue-600">Let&apos;s Get It Back to You.</span>
          </h1>

          <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
            Centralized property reporting, multi-attribute candidate matching, private ownership evidence, and verified single-use QR handovers.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto relative flex items-center">
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by keyword, item name, brand, or location..."
              className="w-full pl-12 pr-28 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
            <button
              type="submit"
              className="absolute right-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs rounded-xl shadow-xs transition-colors"
            >
              Search
            </button>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/reports/lost/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm shadow-red-500/20 transition-all hover:scale-102"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>
            <Link
              href="/reports/found/new"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm shadow-emerald-500/20 transition-all hover:scale-102"
            >
              <CheckCircle2 className="w-4 h-4" />
              Report Found Item
            </Link>
          </div>
        </div>
      </section>

      {/* Category Shortcuts */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Explore by Category</h2>
          <Link href="/reports" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.name}
                href={`/reports?category=${encodeURIComponent(c.name)}`}
                className="p-4 bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-xs transition-all flex flex-col items-center text-center group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2 group-hover:scale-110 transition-transform ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-gray-800 group-hover:text-blue-600">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it Works Banner */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg relative overflow-hidden">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-center sm:text-left">
            How Campus Handover Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">1</span>
              <h3 className="font-semibold text-sm text-white">Private Claim Filing</h3>
              <p className="text-xs text-gray-300">
                Identify your item and supply secret details (distinctive marks, serial number, or contents) kept strictly private from the public.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">2</span>
              <h3 className="font-semibold text-sm text-white">Admin Ownership Review</h3>
              <p className="text-xs text-gray-300">
                Authorized campus staff review your answers against the physical item. Once verified, a secure single-use QR pass is issued.
              </p>
            </div>
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-2">
              <span className="w-7 h-7 rounded-full bg-blue-500 text-white font-bold text-xs flex items-center justify-center">3</span>
              <h3 className="font-semibold text-sm text-white">Verified Collection</h3>
              <p className="text-xs text-gray-300">
                Show your collection QR at the campus security desk. The staff scans it, confirms physical custody exchange, and marks it returned.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Approved Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Recently Reported Campus Items</h2>
            <p className="text-xs text-gray-500">Live listings verified by campus administration</p>
          </div>
          <Link href="/reports" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1">
            View full catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No approved listings right now</p>
            <p className="text-xs text-gray-500 mt-1">Be the first to submit a lost or found report</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentReports.map((report) => (
              <ReportCard key={report._id} report={report} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
