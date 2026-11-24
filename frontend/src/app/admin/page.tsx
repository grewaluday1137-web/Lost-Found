"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import api from "@/lib/api";
import { 
  CheckSquare, QrCode, 
  ArrowRight 
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
    return <div className="h-64 bg-slate-200/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />;
  }

  const statCards = [
    {
      label: "Pending Reports",
      value: stats.pending_reports_count,
      desc: "Awaiting administrative review",
      color: "text-amber-700 dark:text-amber-400 bg-amber-50/80 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25",
      href: "/admin/moderation"
    },
    {
      label: "Pending Claims",
      value: stats.pending_claims_count,
      desc: "Ownership claims requiring review",
      color: "text-blue-700 dark:text-blue-400 bg-blue-50/80 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25",
      href: "/admin/claims"
    },
    {
      label: "Completed Returns",
      value: stats.completed_handovers_count,
      desc: "Successfully returned via QR token",
      color: "text-emerald-700 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25",
      href: "/admin/handover"
    },
    {
      label: "Registered Users",
      value: stats.total_users_count,
      desc: "Campus students & faculty members",
      color: "text-purple-700 dark:text-purple-400 bg-purple-50/80 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/25",
      href: "#"
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.label} className={`p-6 rounded-2xl border ${card.color} space-y-1.5 backdrop-blur-md shadow-xs`}>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {card.label}
            </span>
            <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white">{card.value}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">{card.desc}</p>
            {card.href !== "#" && (
              <Link href={card.href} className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-2">
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
          className="p-6 sm:p-8 bg-gradient-to-r from-emerald-500/15 via-white to-slate-50 dark:from-emerald-950/80 dark:to-slate-900 border border-emerald-300 dark:border-emerald-500/30 rounded-3xl shadow-sm hover:shadow-md dark:shadow-xl dark:hover:shadow-2xl transition-all group flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold rounded-md uppercase tracking-wider border border-emerald-300 dark:border-emerald-500/30">
              Physical Handover Desk
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Open QR Camera Scanner</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
              Scan student collection QR passes to verify ownership and record physical release on the spot.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <QrCode className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
        </Link>

        <Link
          href="/admin/moderation"
          className="p-6 sm:p-8 bg-gradient-to-r from-blue-500/15 via-white to-slate-50 dark:from-blue-950/80 dark:to-slate-900 border border-blue-300 dark:border-blue-500/30 rounded-3xl shadow-sm hover:shadow-md dark:shadow-xl dark:hover:shadow-2xl transition-all group flex items-center justify-between"
        >
          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 bg-blue-100 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[10px] font-bold rounded-md uppercase tracking-wider border border-blue-300 dark:border-blue-500/30">
              Moderation Desk
            </span>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">Review Submitted Reports</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm leading-relaxed">
              Approve or reject lost and found submissions before they appear in the public campus catalog.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform shrink-0">
            <CheckSquare className="w-7 h-7 text-blue-600 dark:text-blue-400" />
          </div>
        </Link>
      </div>
    </div>
  );
}
