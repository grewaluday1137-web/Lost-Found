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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Image Preview & Badges */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {firstImage ? (
          <img
            src={formatImageUrl(firstImage)}
            alt={report.item_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 bg-slate-50">
            <Tag className="w-8 h-8 stroke-1 text-gray-300 mb-1" />
            <span className="text-xs">No photograph</span>
          </div>
        )}

        {/* Type Badge */}
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span
            className={`px-2.5 py-1 text-xs font-bold rounded-lg shadow-xs uppercase tracking-wide ${
              isLost
                ? "bg-red-600 text-white"
                : "bg-emerald-600 text-white"
            }`}
          >
            {report.type}
          </span>
        </div>

        {/* Outcome Badge */}
        <div className="absolute top-3 right-3">
          {report.item_outcome === "returned" ? (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-gray-900 text-white rounded-md flex items-center gap-1 shadow-xs">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Returned
            </span>
          ) : report.item_outcome === "claim_pending" ? (
            <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500 text-white rounded-md flex items-center gap-1 shadow-xs">
              <Clock className="w-3 h-3" /> Under Claim
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-blue-600 mb-1">
            <span>{report.category}</span>
            {report.brand && (
              <>
                <span className="text-gray-300">•</span>
                <span className="text-gray-600">{report.brand}</span>
              </>
            )}
          </div>

          <h3 className="font-bold text-gray-900 text-base leading-snug group-hover:text-blue-600 transition-colors line-clamp-1">
            {report.item_name}
          </h3>

          <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Meta details */}
        <div className="pt-3 mt-3 border-t border-gray-50 space-y-1.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
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
            className="block text-center mt-3 w-full py-2 px-3 text-xs font-semibold rounded-lg bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 transition-colors border border-gray-100"
          >
            View Details & Actions →
          </Link>
        </div>
      </div>
    </div>
  );
}
