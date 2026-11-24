"use client";

import React from "react";
import Link from "next/link";
import { Report } from "@/types";
import { formatImageUrl } from "@/lib/api";
import { MapPin, Calendar, Tag, ShieldCheck, Clock } from "lucide-react";

interface ReportCardProps {
  report: Report;
}

export default function ReportCard({ report }: ReportCardProps) {
  const isLost = report.type === "lost";
  const firstImage = report.image_urls?.[0];

  return (
    <div className="bg-white dark:bg-slate-900/70 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 border border-slate-200/90 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700/80 rounded-2xl shadow-sm hover:shadow-xl dark:shadow-lg dark:hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group backdrop-blur-md">
      {/* Image Preview & Badges */}
      <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-950/60 overflow-hidden">
        {firstImage ? (
          <img
            src={formatImageUrl(firstImage)}
            alt={report.item_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950/40">
            <Tag className="w-8 h-8 stroke-1 text-slate-300 dark:text-slate-600 mb-1" />
            <span className="text-[11px] font-medium">No photograph</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg shadow-md uppercase tracking-wider backdrop-blur-md ${
              isLost
                ? "bg-rose-500 text-white shadow-rose-500/25"
                : "bg-emerald-500 text-white shadow-emerald-500/25"
            }`}
          >
            {report.type}
          </span>
        </div>

        {/* Outcome Badge */}
        <div className="absolute top-3 right-3">
          {report.item_outcome === "returned" ? (
            <span className="px-2.5 py-1 text-[10px] font-bold bg-white/90 dark:bg-slate-950/90 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-lg flex items-center gap-1 backdrop-blur-md shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Returned
            </span>
          ) : report.item_outcome === "claim_pending" ? (
            <span className="px-2.5 py-1 text-[10px] font-bold bg-amber-500 text-amber-950 rounded-lg flex items-center gap-1 backdrop-blur-md shadow-xs">
              <Clock className="w-3 h-3" /> Under Claim
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1.5">
            <span>{report.category}</span>
            {report.brand && (
              <>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-slate-600 dark:text-slate-300">{report.brand}</span>
              </>
            )}
          </div>

          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors line-clamp-1">
            {report.item_name}
          </h3>

          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Meta details */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <span>
              {new Date(report.event_time).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric"
              })}
            </span>
          </div>

          <Link
            href={`/reports/${report._id}`}
            className="block text-center mt-3 w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white dark:bg-slate-800/80 dark:hover:bg-blue-600 dark:text-slate-200 dark:hover:text-white transition-all border border-slate-200 dark:border-slate-700/60 hover:border-blue-600 dark:hover:border-blue-500 shadow-xs"
          >
            View Details & Actions →
          </Link>
        </div>
      </div>
    </div>
  );
}
