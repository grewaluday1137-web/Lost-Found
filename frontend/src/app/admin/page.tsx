"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { 
  CheckSquare, FileSearch, QrCode, Users, CheckCircle, 
  ArrowRight, ShieldCheck, Clock 
} from "lucide-react";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({
    pending_reports_count: 0,
    published_reports_count: 0,
    pending_claims_count: 0,
    completed_handovers_count: 0,
    total_users_count: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/admin/overview");
        setStats(res.data);
      } catch {}
      finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <div className="h-64 bg-gray-100 rounded-3xl animate-pulse" />;
  }

  const statCards = [
    {
      label: "Pending Reports",
      value: stats.pending_reports_count,
      desc: "Awaiting administrative review",
      color: "text-amber-600 bg-amber-50 border-amber-200",
      href: "/admin/moderation"
    },
    {
      label: "Pending Claims",
      value: stats.pending_claims_count,
      desc: "Ownership claims requiring verification",
      color: "text-blue-600 bg-blue-50 border-blue-200",
      href: "/admin/claims"
    },
    {
      label: "Completed Returns",
      value: stats.completed_handovers_count,
      desc: "Successfully returned via QR token",
      color: "text-emerald-600 bg-emerald-50 border-emerald-200",
      href: "/admin/handover"
    },
    {
      label: "Registered Users",
      value: stats.total_users_count,
      desc: "Campus students & faculty members",
      color: "text-purple-600 bg-purple-50 border-purple-200",
      href: "#"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`p-5 rounded-2xl border ${card.color} space-y-1`}>
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {card.label}
            </span>
            <div className="text-3xl font-extrabold text-gray-900">{card.value}</div>
            <p className="text-[11px] text-gray-600 pt-1">{card.desc}</p>
            {card.href !== "#" && (
              <Link href={card.href} className="inline-flex items-center gap-1 text-xs font-bold text-gray-900 hover:underline pt-2">
                Open Queue <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>

      {/* Quick Launchpad */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/admin/handover"
          className="p-6 bg-gradient-to-r from-emerald-900 to-emerald-950 text-white rounded-3xl shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-emerald-500 text-emerald-950 text-[10px] font-bold rounded-md uppercase">
              Physical Handover Desk
            </span>
            <h2 className="text-xl font-bold">Open QR Camera Scanner</h2>
            <p className="text-xs text-emerald-200">
              Scan student collection QR codes to verify ownership and log physical release.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <QrCode className="w-6 h-6 text-emerald-300" />
          </div>
        </Link>

        <Link
          href="/admin/moderation"
          className="p-6 bg-gradient-to-r from-blue-900 to-blue-950 text-white rounded-3xl shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
        >
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 bg-blue-500 text-blue-950 text-[10px] font-bold rounded-md uppercase">
              Moderation Desk
            </span>
            <h2 className="text-xl font-bold">Review Submitted Reports</h2>
            <p className="text-xs text-blue-200">
              Approve or reject lost and found submissions before they appear in public search.
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CheckSquare className="w-6 h-6 text-blue-300" />
          </div>
        </Link>
      </div>
    </div>
  );
}
