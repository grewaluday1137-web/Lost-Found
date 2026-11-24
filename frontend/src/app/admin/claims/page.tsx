"use client";

import React, { useState, useEffect } from "react";
import api from "@/lib/api";
import { Claim } from "@/types";
import { Check, X, HelpCircle, ShieldCheck, User, MapPin } from "lucide-react";

export default function AdminClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [filterStatus, setFilterStatus] = useState("submitted");
  const [loading, setLoading] = useState(true);

  // Decision Modal
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "request_info" | null>(null);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchClaims = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/claims?status=${filterStatus}`);
      setClaims(res.data);
    } catch {}
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, [filterStatus]);

  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim || !actionType) return;
    setSubmitting(true);

    try {
      await api.post(`/admin/claims/${selectedClaim._id}/decision`, {
        action: actionType,
        reason: reason || undefined
      });
      setSelectedClaim(null);
      setActionType(null);
      setReason("");
      fetchClaims();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit claim decision.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and status tabs */}
      <div className="bg-white/80 dark:bg-slate-900/75 p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Claim Verification Queue</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compare private evidence submitted by claimants with the physical found item.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {["submitted", "under_review", "approved", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl uppercase tracking-wider transition-all shrink-0 ${
                filterStatus === st
                  ? "bg-amber-500 text-slate-950 shadow-sm"
                  : "bg-slate-100 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Claims list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((n) => (
            <div key={n} className="h-44 bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-20 bg-white/70 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800/80 backdrop-blur-md space-y-2 shadow-xs">
          <ShieldCheck className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
          <h3 className="font-bold text-slate-900 dark:text-white text-base">No Claims in &apos;{filterStatus}&apos;</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Check other tabs or wait for campus claimants to file evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div
              key={c._id}
              className="bg-white/90 dark:bg-slate-900/70 p-6 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-md space-y-4 backdrop-blur-md"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-500/20">
                    Claim ID: {c._id.slice(-8)}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">
                    Claimed Item: {c.report?.item_name || "Found Item"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <MapPin className="w-3.5 h-3.5" /> Held at: {c.report?.custody_location || c.report?.location}
                  </p>
                </div>

                <div className="text-left sm:text-right text-xs">
                  <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center sm:justify-end gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Claimant ID: {c.claimant_id.slice(-6)}
                  </p>
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block mt-0.5">
                    Filed: {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Private Evidence Drawer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Private Ownership Evidence
                  </h4>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 font-semibold">Marks / Serial / Flaws:</span>
                    <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono text-[11px] whitespace-pre-wrap">{c.distinctive_marks}</p>
                  </div>
                  {c.secret_contents && (
                    <div className="pt-1.5 border-t border-slate-200/80 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Secret Contents:</span>
                      <p className="text-slate-800 dark:text-slate-200 mt-0.5 font-mono text-[11px] whitespace-pre-wrap">{c.secret_contents}</p>
                    </div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-950/70 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <h4 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[10px]">
                    Loss Circumstances
                  </h4>
                  <p className="text-slate-700 dark:text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{c.loss_circumstances}</p>
                  {c.decision_reason && (
                    <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 text-amber-700 dark:text-amber-300">
                      <strong>Admin Note / Requested Info:</strong> {c.decision_reason}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {(c.status === "submitted" || c.status === "under_review" || c.status === "info_requested") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("approve");
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve & Issue QR Pass
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("request_info");
                    }}
                    className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 hover:bg-amber-100 dark:hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs rounded-xl border border-amber-200 dark:border-amber-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5" /> Request Details
                  </button>

                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("reject");
                    }}
                    className="px-3.5 py-2 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/20 text-rose-700 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-500/30 transition-colors flex items-center gap-1.5"
                  >
                    <X className="w-3.5 h-3.5" /> Reject Claim
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedClaim && actionType && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
              {actionType.replace("_", " ")} Ownership Claim
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {actionType === "approve"
                ? "Approving will automatically mint an expiring single-use QR token sent to the student for campus desk pickup."
                : actionType === "request_info"
                ? "Send a notification asking the claimant to submit additional specific facts."
                : "Reject this claim if the answers contradict the physical evidence."}
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {actionType === "approve" ? "Optional Pickup Instructions" : "Reason / Required Clarifications *"}
                </label>
                <textarea
                  required={actionType !== "approve"}
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    actionType === "approve"
                      ? "e.g. Please bring student ID to Security Desk between 9am-5pm."
                      : "Explain what additional details are needed..."
                  }
                  className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setActionType(null);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2.5 text-white font-bold text-xs rounded-xl shadow-xs ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : actionType === "request_info"
                      ? "bg-amber-600 hover:bg-amber-500"
                      : "bg-rose-600 hover:bg-rose-500"
                  }`}
                >
                  {submitting ? "Processing..." : "Confirm Decision"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
