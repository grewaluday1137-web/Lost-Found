"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api, { formatImageUrl } from "@/lib/api";
import { Report, Claim } from "@/types";
import { 
  FileText, ShieldCheck, QrCode, 
  MapPin, PlusCircle, CheckCircle2, Tag 
} from "lucide-react";

export default function UserDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<"reports" | "claims">("reports");
  const [reports, setReports] = useState<Report[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const [repRes, claimRes] = await Promise.all([
          api.get("/reports/mine"),
          api.get("/claims/mine")
        ]);
        setReports(repRes.data);
        setClaims(claimRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, router]);

  if (loading) {
    return <div className="h-96 bg-slate-200/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />;
  }

  return (
    <div className="space-y-8 py-2">
      {/* User Header Profile Card */}
      <div className="bg-gradient-to-r from-white via-slate-50 to-blue-50/50 dark:from-slate-900/90 dark:via-slate-900/80 dark:to-blue-950/40 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-md dark:shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 border-2 border-white/20 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-blue-500/25">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-500/20">
                {user?.role || "Campus Member"}
              </span>
              {user?.campus_id && (
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                  ID: {user.campus_id}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
              Welcome, {user?.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {user?.email} {user?.department && `• ${user.department}`}
            </p>
          </div>
        </div>

        <div className="flex gap-2.5 shrink-0">
          <Link
            href="/reports/lost/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-xs rounded-xl shadow-md shadow-rose-600/20 transition-all hover:scale-102"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Lost
          </Link>
          <Link
            href="/reports/found/new"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all hover:scale-102"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-950/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/80 max-w-md shadow-xs">
        <button
          onClick={() => setActiveTab("reports")}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "reports"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          My Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`flex-1 py-2.5 px-4 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "claims"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          My Claims ({claims.length})
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-20 bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-3 shadow-xs">
              <FileText className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">No Reports Submitted Yet</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                You haven&apos;t filed any lost or found items on campus yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r) => (
                <div key={r._id} className="bg-white/80 dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md flex gap-4 backdrop-blur-md">
                  <div className="w-20 h-20 bg-slate-100 dark:bg-slate-950/60 rounded-xl overflow-hidden shrink-0 border border-slate-200 dark:border-slate-800">
                    {r.image_urls?.[0] ? (
                      <img
                        src={formatImageUrl(r.image_urls[0])}
                        alt={r.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 dark:text-slate-600">
                        <Tag className="w-6 h-6 stroke-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                            r.type === "lost" ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30" : "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                          }`}
                        >
                          {r.type}
                        </span>
                        <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                          {r.moderation_status}
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm mt-1 line-clamp-1">{r.item_name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {r.location}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 mt-2">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        Outcome: <strong className="text-slate-800 dark:text-slate-200 capitalize">{r.item_outcome.replace("_", " ")}</strong>
                      </span>
                      <Link
                        href={`/reports/${r._id}`}
                        className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
                      >
                        View & Matches →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Claims Tab */}
      {activeTab === "claims" && (
        <div className="space-y-4">
          {claims.length === 0 ? (
            <div className="text-center py-20 bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-3 shadow-xs">
              <ShieldCheck className="w-12 h-12 text-slate-400 dark:text-slate-600 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">No Ownership Claims Submitted</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Browse found items in the catalog to submit a claim for your property.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {claims.map((c) => {
                const isApproved = c.status === "approved";
                const isCompleted = c.status === "completed";
                const isInfoReq = c.status === "info_requested";

                return (
                  <div key={c._id} className="bg-white/80 dark:bg-slate-900/70 p-6 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md flex flex-col justify-between space-y-4 backdrop-blur-md">
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-extrabold rounded-lg uppercase tracking-wider ${
                            isApproved
                              ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/40"
                              : isCompleted
                              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                              : isInfoReq
                              ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40"
                              : "bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/40"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-900 dark:text-white mt-2">
                        {c.report?.item_name || "Found Item"}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                        Category: {c.report?.category} • Found at: {c.report?.location}
                      </p>

                      <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-950/60 rounded-xl text-xs text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80">
                        <p className="line-clamp-2">
                          <strong className="text-slate-500 dark:text-slate-400">Your Evidence:</strong> {c.distinctive_marks}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      {isApproved ? (
                        <Link
                          href={`/dashboard/claims/${c._id}`}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition-all hover:scale-102"
                        >
                          <QrCode className="w-4 h-4" />
                          View Collection QR Pass
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/claims/${c._id}`}
                          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          View Status & History →
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
