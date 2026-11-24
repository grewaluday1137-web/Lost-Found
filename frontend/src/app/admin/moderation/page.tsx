"use client";

import React, { useState, useEffect } from "react";
import api, { formatImageUrl } from "@/lib/api";
import { Report } from "@/types";
import { Check, X, Tag, MapPin, Calendar } from "lucide-react";

export default function AdminModerationPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectModalOpen, setRejectModalOpen] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/reports?status=${filterStatus}`);
      setReports(res.data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterStatus]);

  const handleApprove = async (id: string) => {
    try {
      await api.post(`/admin/reports/${id}/decision`, {
        action: "publish",
      });
      fetchReports();
    } catch {
      alert("Failed to approve report.");
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionId) return;
    try {
      await api.post(`/admin/reports/${actionId}/decision`, {
        action: "reject",
        reason: rejectReason || "Violates campus reporting policy"
      });
      setRejectModalOpen(false);
      setRejectReason("");
      setActionId(null);
      fetchReports();
    } catch {
      alert("Failed to reject report.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Subheader and Filter */}
      <div className="bg-white/80 dark:bg-slate-900/75 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Report Moderation Queue</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verify content before making items discoverable in the public campus catalog.
          </p>
        </div>

        <div className="flex gap-2">
          {["submitted", "published", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all ${
                filterStatus === st
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-2 shadow-xs">
          <Check className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">Queue is Clear</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            No reports currently in &apos;{filterStatus}&apos; status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white/90 dark:bg-slate-900/70 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between backdrop-blur-md"
            >
              <div className="flex gap-4 items-start">
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

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-extrabold rounded uppercase tracking-wider ${
                        r.type === "lost"
                          ? "bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30"
                          : "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30"
                      }`}
                    >
                      {r.type}
                    </span>
                    <span className="text-xs text-slate-300 dark:text-slate-600">•</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{r.category}</span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-white text-base">{r.item_name}</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 max-w-xl leading-relaxed">
                    {r.description}
                  </p>

                  <div className="flex flex-wrap gap-4 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {r.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {new Date(r.event_time).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Moderation Controls */}
              {filterStatus === "submitted" && (
                <div className="flex gap-2 sm:self-center shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleApprove(r._id)}
                    className="flex-1 sm:flex-initial px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => {
                      setActionId(r._id);
                      setRejectModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial px-3.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-500/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white">Reject Report Submission</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please state why this report cannot be published to the public catalog (e.g., inappropriate language, false claim, insufficient info).
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
