"use client";

import React, { useState, useEffect } from "react";
import api, { formatImageUrl } from "@/lib/api";
import { Report } from "@/types";
import { Check, X, Tag, MapPin, Calendar, AlertCircle } from "lucide-react";

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
      <div className="bg-slate-900/75 p-5 rounded-2xl border border-slate-800/80 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Report Moderation Queue</h2>
          <p className="text-xs text-slate-400">
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
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
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
            <div key={n} className="h-32 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-2">
          <Check className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">Queue is Clear</h3>
          <p className="text-xs text-slate-400">
            No reports currently in &apos;{filterStatus}&apos; status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800/80 shadow-md flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between backdrop-blur-md"
            >
              <div className="flex gap-4 items-start">
                <div className="w-20 h-20 bg-slate-950/60 rounded-xl overflow-hidden shrink-0 border border-slate-800">
                  {r.image_urls?.[0] ? (
                    <img
                      src={formatImageUrl(r.image_urls[0])}
                      alt={r.item_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-600">
                      <Tag className="w-6 h-6 stroke-1" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider ${
                        r.type === "lost" ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      }`}
                    >
                      {r.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-300">{r.category}</span>
                    {r.brand && (
                      <span className="text-xs text-slate-500">• {r.brand}</span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-white leading-snug">{r.item_name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" /> {r.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-500" /> {new Date(r.event_time).toLocaleDateString()}
                    </span>
                    {r.custody_location && (
                      <span className="text-amber-300 font-semibold bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                        Held: {r.custody_location}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              {r.moderation_status === "submitted" && (
                <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
                  <button
                    onClick={() => handleApprove(r._id)}
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => {
                      setActionId(r._id);
                      setRejectModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial py-2.5 px-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-500/30"
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4">
            <h3 className="font-bold text-base text-white">Reject Report</h3>
            <p className="text-xs text-slate-400">
              Provide a clear reason for the user explaining why this report was not approved.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Duplicate report, insufficient observable details, inappropriate content..."
                className="w-full p-3 bg-slate-950/80 rounded-xl border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-md"
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
