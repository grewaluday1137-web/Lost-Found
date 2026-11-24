"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Report } from "@/types";
import ReportCard from "@/components/report-card";
import { 
  Search, PlusCircle, ShieldCheck, CheckCircle2,
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
    { name: "Electronics", icon: Laptop, color: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/20" },
    { name: "Wallets & Cards", icon: Wallet, color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20" },
    { name: "Keys", icon: Key, color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20" },
    { name: "Books & Bags", icon: BookOpen, color: "text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/20" },
    { name: "Clothing", icon: Shirt, color: "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20" },
    { name: "Accessories", icon: Sparkles, color: "text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-500/10 border-cyan-200 dark:border-cyan-500/20" },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* Hero Section */}
      <section className="text-center py-10 sm:py-18 relative">
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          {/* Verified Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-700 dark:text-blue-300 text-xs font-semibold backdrop-blur-md shadow-xs">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            Verified Campus Lost & Found System
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.15]">
            Lost Something on Campus? <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 dark:from-blue-400 dark:via-indigo-300 dark:to-sky-400">
              Let&apos;s Get It Back to You.
            </span>
          </h1>

          <p className="text-slate-600 dark:text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Centralized property reporting, multi-attribute candidate matching, private ownership evidence, and verified single-use QR handovers.
          </p>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="max-w-2xl mx-auto relative flex items-center group">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-indigo-500/20 dark:from-blue-600/30 dark:to-indigo-600/30 rounded-2xl blur-md group-hover:blur-lg transition-all opacity-70" />
            <div className="relative w-full flex items-center bg-white dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-700/80 rounded-2xl shadow-lg dark:shadow-2xl overflow-hidden focus-within:border-blue-500 transition-colors">
              <Search className="absolute left-4 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by keyword, item name, brand, or location..."
                className="w-full pl-12 pr-32 py-4 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none"
              />
              <button
                type="submit"
                className="absolute right-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all hover:scale-102"
              >
                Search
              </button>
            </div>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/reports/lost/new"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-600/25 transition-all hover:scale-102 hover:shadow-xl"
            >
              <PlusCircle className="w-4 h-4" />
              Report Lost Item
            </Link>
            <Link
              href="/reports/found/new"
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/25 transition-all hover:scale-102 hover:shadow-xl"
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
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Explore by Category</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Quickly filter campus listings by object type</p>
          </div>
          <Link href="/reports" className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
            Browse all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {categories.map((c) => {
            const Icon = c.icon;
            return (
              <Link
                key={c.name}
                href={`/reports?category=${encodeURIComponent(c.name)}`}
                className="p-5 bg-white/80 dark:bg-slate-900/60 hover:bg-white dark:hover:bg-slate-800/70 border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl backdrop-blur-md transition-all duration-300 hover:-translate-y-1 shadow-xs hover:shadow-md dark:shadow-none flex flex-col items-center text-center group"
              >
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                  {c.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* How it Works Banner */}
      <section className="bg-gradient-to-b from-slate-100 to-white dark:from-slate-900/80 dark:to-slate-950/80 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-8 sm:p-10 shadow-lg dark:shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center sm:text-left space-y-1">
            <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
              Step-by-Step
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              How Campus Handover Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl space-y-2.5 shadow-xs dark:shadow-none">
              <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/20 border border-blue-200 dark:border-blue-500/40 text-blue-700 dark:text-blue-300 font-bold text-xs flex items-center justify-center">
                1
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Private Claim Filing</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Supply secret details (distinctive marks, serial number, lockscreen photo, or pocket contents) kept strictly private from public view.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl space-y-2.5 shadow-xs dark:shadow-none">
              <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-500/20 border border-indigo-200 dark:border-indigo-500/40 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center">
                2
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Ownership Review</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Authorized campus staff compare your evidence against the held item. Upon verification, an expiring single-use QR pass is issued.
              </p>
            </div>

            <div className="p-5 bg-white dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/50 rounded-2xl space-y-2.5 shadow-xs dark:shadow-none">
              <span className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center">
                3
              </span>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Verified Collection</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Show your collection QR at the campus desk. Staff scan the code, confirm physical exchange, and record the handover.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Approved Items */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Recently Reported Items</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Live listings verified by campus administration</p>
          </div>
          <Link href="/reports" className="text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors">
            View full catalog <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-72 bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : recentReports.length === 0 ? (
          <div className="text-center py-16 bg-white/70 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 rounded-3xl backdrop-blur-md space-y-2">
            <HelpCircle className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-300">No approved listings right now</p>
            <p className="text-xs text-slate-500">Be the first to submit a lost or found report</p>
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
