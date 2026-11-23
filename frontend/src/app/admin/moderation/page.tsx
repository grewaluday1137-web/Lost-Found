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
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Report Moderation Queue</h2>
          <p className="text-xs text-gray-500">
            Verify content before making items discoverable in the public campus catalog.
          </p>
        </div>

        <div className="flex gap-2">
          {["submitted", "published", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
                filterStatus === st
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <div key={n} className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <Check className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-base">Queue is Clear</h3>
          <p className="text-xs text-gray-500 mt-1">
            No reports currently in &apos;{filterStatus}&apos; status.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between"
            >
              <div className="flex gap-4 items-start">
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

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                        r.type === "lost" ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {r.type}
                    </span>
                    <span className="text-xs font-semibold text-gray-700">{r.category}</span>
                    {r.brand && (
                      <span className="text-xs text-gray-400">• {r.brand}</span>
                    )}
                  </div>

                  <h3 className="font-bold text-base text-gray-900 leading-snug">{r.item_name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>

                  <div className="flex items-center gap-3 text-[11px] text-gray-400 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {r.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {new Date(r.event_time).toLocaleDateString()}
                    </span>
                    {r.custody_location && (
                      <span className="text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
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
                    className="flex-1 sm:flex-initial py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Check className="w-4 h-4" /> Approve & Publish
                  </button>
                  <button
                    onClick={() => {
                      setActionId(r._id);
                      setRejectModalOpen(true);
                    }}
                    className="flex-1 sm:flex-initial py-2 px-4 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 border border-red-200"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-gray-900">Reject Report</h3>
            <p className="text-xs text-gray-500">
              Provide a clear reason for the user explaining why this report was not approved.
            </p>
            <form onSubmit={handleRejectSubmit} className="space-y-3">
              <textarea
                required
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Duplicate report, insufficient observable details, inappropriate content..."
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-semibold bg-red-600 text-white rounded-xl"
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
