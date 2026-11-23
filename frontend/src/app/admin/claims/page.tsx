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
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Claim Verification Queue</h2>
          <p className="text-xs text-gray-500">
            Compare private evidence submitted by claimants with the physical found item.
          </p>
        </div>

        <div className="flex gap-2">
          {["submitted", "under_review", "approved", "completed"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg uppercase tracking-wider transition-colors ${
                filterStatus === st
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
            <div key={n} className="h-44 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-gray-800 text-base">No Claims in &apos;{filterStatus}&apos;</h3>
          <p className="text-xs text-gray-500 mt-1">
            Check other tabs or wait for campus claimants to file evidence.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {claims.map((c) => (
            <div key={c._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
                    Claim against found report:
                  </span>
                  <h3 className="font-bold text-lg text-gray-900">{c.report?.item_name || "Found Item"}</h3>
                  <p className="text-xs text-gray-500">
                    Category: {c.report?.category} {c.report?.custody_location && `• Custody: ${c.report.custody_location}`}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold rounded-md uppercase text-[10px]">
                    {c.status.replace("_", " ")}
                  </span>
                  <p className="text-gray-400 mt-1">{new Date(c.created_at).toLocaleString()}</p>
                </div>
              </div>

              {/* Claimant info & Private Evidence */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Claimant Identity */}
                <div className="p-4 bg-blue-50/50 rounded-xl space-y-1.5 border border-blue-100">
                  <span className="font-bold text-blue-900 flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Claimant Identity
                  </span>
                  <p><strong>Name:</strong> {c.claimant?.name || "Anonymous"}</p>
                  <p><strong>Email:</strong> {c.claimant?.email}</p>
                  {c.claimant?.campus_id && <p><strong>Campus ID:</strong> {c.claimant.campus_id}</p>}
                  {c.claimant?.phone && <p><strong>Phone:</strong> {c.claimant.phone}</p>}
                </div>

                {/* Evidence Answers */}
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 border border-gray-100">
                  <span className="font-bold text-gray-900">Non-Public Evidence Answers</span>
                  <div>
                    <strong className="text-gray-600 block">Distinctive Marks / Serial:</strong>
                    <p className="text-gray-900 font-medium">{c.distinctive_marks}</p>
                  </div>
                  {c.secret_contents && (
                    <div>
                      <strong className="text-gray-600 block">Secret Contents:</strong>
                      <p className="text-gray-900 font-medium">{c.secret_contents}</p>
                    </div>
                  )}
                  <div>
                    <strong className="text-gray-600 block">Circumstances of Loss:</strong>
                    <p className="text-gray-900 font-medium">{c.loss_circumstances}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {(c.status === "submitted" || c.status === "under_review") && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 justify-end">
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("request_info");
                    }}
                    className="py-2 px-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl border border-amber-200"
                  >
                    Request More Info
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("reject");
                    }}
                    className="py-2 px-3.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold rounded-xl border border-red-200"
                  >
                    Reject Claim
                  </button>
                  <button
                    onClick={() => {
                      setSelectedClaim(c);
                      setActionType("approve");
                    }}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs"
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
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-bold text-base text-gray-900 capitalize">
              {actionType === "approve"
                ? "Approve Claim & Issue Collection QR"
                : actionType === "reject"
                ? "Reject Claim"
                : "Request Additional Information"}
            </h3>

            <p className="text-xs text-gray-500">
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
                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClaim(null);
                    setActionType(null);
                  }}
                  className="flex-1 py-2 text-xs font-semibold bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-2 text-xs font-semibold text-white rounded-xl ${
                    actionType === "approve"
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : actionType === "reject"
                      ? "bg-red-600 hover:bg-red-700"
                      : "bg-amber-600 hover:bg-amber-700"
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
