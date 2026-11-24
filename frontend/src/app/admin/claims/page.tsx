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
      <div className="bg-slate-900/75 p-5 rounded-2xl border border-slate-800/80 shadow-md backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">Claim Verification Queue</h2>
          <p className="text-xs text-slate-400">
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
                  : "bg-slate-950/60 text-slate-400 hover:text-white border border-slate-800"
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
            <div key={n} className="h-44 bg-slate-900/40 border border-slate-800 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/40 rounded-3xl border border-slate-800/80 backdrop-blur-md space-y-2">
          <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="font-bold text-white text-base">No Claims in &apos;{filterStatus}&apos;</h3>
          <p className="text-xs text-slate-400">
            Check other tabs or wait for campus claimants to file evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c._id} className="bg-slate-900/70 p-6 rounded-2xl border border-slate-800/80 shadow-md space-y-4 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">
                    Claim against found report:
                  </span>
                  <h3 className="font-bold text-lg text-white">{c.report?.item_name || "Found Item"}</h3>
                  <p className="text-xs text-slate-400">
                    Category: {c.report?.category} {c.report?.custody_location && `• Custody: ${c.report.custody_location}`}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold rounded-lg uppercase text-[10px]">
                    {c.status.replace("_", " ")}
                  </span>
                  <p className="text-slate-500 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Claimant info & Private Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Claimant Identity */}
                <div className="p-4 bg-slate-950/60 rounded-xl space-y-1.5 border border-slate-800">
                  <span className="font-bold text-blue-400 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Claimant Identity
                  </span>
                  <p><strong className="text-slate-400">Name:</strong> {c.claimant?.name || "Anonymous"}</p>
                  <p><strong className="text-slate-400">Email:</strong> {c.claimant?.email}</p>
                  {c.claimant?.campus_id && <p><strong className="text-slate-400">Campus ID:</strong> {c.claimant.campus_id}</p>}
                  {c.claimant?.phone && <p><strong className="text-slate-400">Phone:</strong> {c.claimant.phone}</p>}
                </div>

                {/* Evidence Answers */}
                <div className="p-4 bg-slate-950/60 rounded-xl space-y-2 border border-slate-800">
                  <span className="font-bold text-slate-200">Non-Public Evidence Answers</span>
                  <div>
                    <strong className="text-slate-400 block">Distinctive Marks / Serial:</strong>
                    <p className="text-white font-medium">{c.distinctive_marks}</p>
                  </div>
                  {c.secret_contents && (
                    <div>
                      <strong className="text-slate-400 block">Secret Contents:</strong>
                      <p className="text-white font-medium">{c.secret_contents}</p>
                    </div>
                  )}
                  <div>
                    <strong className="text-slate-400 block">Circumstances of Loss:</strong>
                    <p className="text-white font-medium">{c.loss_circumstances}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(c.status === "submitted" || c.status === "under_review") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800 justify-end">
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("request_info");
                    }}
                    className="py-2 px-3.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-bold rounded-xl border border-amber-500/30"
                  >
                    Request More Info
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("reject");
                    }}
                    className="py-2 px-3.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold rounded-xl border border-rose-500/30"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("approve");
                    }}
                    className="py-2 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/30"
                  >
                    Approve Ownership & Issue QR
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decision Modal */}
      {selectedClaim && actionType && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-700/80 space-y-4">
            <h3 className="font-bold text-base text-white capitalize">
              {actionType === "approve"
                ? "Approve Claim & Issue Collection QR"
                : actionType === "reject"
                ? "Reject Claim"
                : "Request Additional Information"}
            </h3>

            <p className="text-xs text-slate-400 leading-relaxed">
              {actionType === "approve"
                ? "Approving this claim will mint a secure, single-use, 48-hour QR token for the student to collect their property."
                : actionType === "reject"
                ? "Provide a recorded reason for the rejection."
                : "Specify what additional details or receipts the claimant should provide."}
            </p>

            <form onSubmit={handleDecisionSubmit} className="space-y-3">
              <textarea
                required={actionType !== "approve"}
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={
                  actionType === "approve"
                    ? "Optional notes regarding evidence satisfaction..."
                    : "Enter reason or instructions for claimant..."
                }
                className="w-full p-3 bg-slate-950/80 rounded-xl border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setActionType(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2 text-xs font-bold text-white rounded-xl shadow-md ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-500"
                      : actionType === "reject"
                      ? "bg-rose-600 hover:bg-rose-500"
                      : "bg-amber-600 hover:bg-amber-500"
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
