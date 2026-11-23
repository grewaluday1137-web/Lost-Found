"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api, { formatImageUrl } from "@/lib/api";
import { Report, Claim } from "@/types";
import { 
  FileText, ShieldCheck, Clock, CheckCircle2, QrCode, 
  Sparkles, AlertCircle, ArrowRight, Tag, MapPin 
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
    return <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />;
  }

  return (
    <div className="space-y-8">
      {/* User Header */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Campus Member Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
            Welcome, {user?.name}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            {user?.email} • {user?.campus_id || "Campus Affiliate"} {user?.department && `• ${user.department}`}
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            href="/reports/lost/new"
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Report Lost
          </Link>
          <Link
            href="/reports/found/new"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Report Found
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("reports")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "reports"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <FileText className="w-4 h-4" />
          My Submitted Reports ({reports.length})
        </button>
        <button
          onClick={() => setActiveTab("claims")}
          className={`py-3 px-5 font-bold text-sm border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "claims"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-900"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          My Ownership Claims ({claims.length})
        </button>
      </div>

      {/* Reports Tab */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          {reports.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 text-base">No Reports Submitted Yet</h3>
              <p className="text-xs text-gray-500 mt-1">
                You haven&apos;t filed any lost or found items on campus yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map((r) => (
                <div key={r._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex gap-4">
                  <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden shrink-0">
                    {r.image_urls?.[0] ? (
                      <img
                        src={formatImageUrl(r.image_urls[0])}
                        alt={r.item_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <Tag className="w-6 h-6 stroke-1" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-md uppercase ${
                            r.type === "lost" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                          }`}
                        >
                          {r.type}
                        </span>
                        <span className="text-xs text-gray-400">•</span>
                        <span className="text-xs font-semibold text-gray-500">
                          {r.moderation_status.toUpperCase()}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-sm mt-1">{r.item_name}</h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400" /> {r.location}
                      </p>
                    </div>

                    <div className="pt-2 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        Outcome: <strong className="text-gray-700">{r.item_outcome}</strong>
                      </span>
                      <Link
                        href={`/reports/${r._id}`}
                        className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-0.5"
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
            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
              <ShieldCheck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <h3 className="font-bold text-gray-800 text-base">No Ownership Claims Submitted</h3>
              <p className="text-xs text-gray-500 mt-1">
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
                  <div key={c._id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-1 text-xs font-bold rounded-lg uppercase ${
                            isApproved
                              ? "bg-emerald-100 text-emerald-800"
                              : isCompleted
                              ? "bg-gray-100 text-gray-800"
                              : isInfoReq
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                        <span className="text-[11px] text-gray-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-gray-900 mt-2">
                        {c.report?.item_name || "Found Item"}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                        Category: {c.report?.category} • Found at: {c.report?.location}
                      </p>

                      <div className="mt-3 p-3 bg-gray-50 rounded-xl text-xs text-gray-600">
                        <p className="line-clamp-2">
                          <strong>Your Evidence:</strong> {c.distinctive_marks}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      {isApproved ? (
                        <Link
                          href={`/dashboard/claims/${c._id}`}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                          View Collection QR Pass
                        </Link>
                      ) : (
                        <Link
                          href={`/dashboard/claims/${c._id}`}
                          className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
