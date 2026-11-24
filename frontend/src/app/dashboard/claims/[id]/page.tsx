"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Claim } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { 
  ShieldCheck, Clock, CheckCircle2, AlertCircle, QrCode, 
  ArrowLeft, Building, Send, FileText, Check, Sparkles 
} from "lucide-react";

export default function ClaimDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [claim, setClaim] = useState<Claim | null>(null);
  const [qrData, setQrData] = useState<{ qr_data_url: string; expires_at: string } | null>(null);
  const [additionalEvidence, setAdditionalEvidence] = useState("");
  const [loading, setLoading] = useState(true);
  const [submittingInfo, setSubmittingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }

    const fetchClaim = async () => {
      try {
        const res = await api.get(`/claims/${id}`);
        setClaim(res.data);

        // If approved, fetch QR pass
        if (res.data.status === "approved") {
          try {
            const qrRes = await api.get(`/claims/${id}/qr`);
            setQrData(qrRes.data);
          } catch {}
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Could not load claim information.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchClaim();
  }, [id, user, router]);

  const handleAdditionalInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingInfo(true);
    try {
      await api.post(`/claims/${id}/additional-info`, {
        additional_evidence: additionalEvidence
      });
      // Refresh claim
      const res = await api.get(`/claims/${id}`);
      setClaim(res.data);
      setAdditionalEvidence("");
    } catch {
      alert("Failed to submit additional information.");
    } finally {
      setSubmittingInfo(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse" />;
  }

  if (error || !claim) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-slate-900/60 p-8 rounded-3xl border border-slate-800">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white">Claim Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">{error || "Access denied or invalid ID"}</p>
        <Link href="/dashboard" className="inline-block mt-4 text-xs font-semibold text-blue-400 hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  const steps = [
    { key: "submitted", label: "Submitted" },
    { key: "under_review", label: "Under Review" },
    { key: "approved", label: "Approved" },
    { key: "completed", label: "Handover Verified" },
  ];

  const getStepIndex = (status: string) => {
    if (status === "submitted") return 0;
    if (status === "under_review" || status === "info_requested") return 1;
    if (status === "approved") return 2;
    if (status === "completed") return 3;
    return 0;
  };

  const currentStep = getStepIndex(claim.status);

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-2">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Dashboard
      </Link>

      {/* Progress tracker */}
      <div className="bg-slate-900/70 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-8">
        <div>
          <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
            Claim Tracking
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
            Claim for: {claim.report?.item_name || "Found Item"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Claim Reference: <code className="text-blue-300 bg-slate-950 px-2 py-0.5 rounded-md border border-slate-800 font-mono">{claim._id}</code>
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="grid grid-cols-4 gap-2 pt-2">
          {steps.map((s, idx) => {
            const isPassed = idx <= currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div key={s.key} className="space-y-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    isPassed ? "bg-blue-500 shadow-sm shadow-blue-500/50" : "bg-slate-800"
                  }`}
                />
                <span
                  className={`text-[11px] block font-semibold ${
                    isCurrent ? "text-blue-400 font-bold" : isPassed ? "text-slate-200" : "text-slate-500"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Status Callout */}
        {claim.status === "approved" && qrData && (
          <div className="p-8 bg-gradient-to-b from-emerald-950/60 via-slate-900/80 to-slate-900/90 border border-emerald-500/40 rounded-3xl text-center space-y-5 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full border border-emerald-500/30">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Ownership Verified — Ready for Campus Collection
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-white">
                Your Single-Use Collection Pass
              </h2>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Present this screen to the authorized campus administrator at the collection desk. The administrator will scan it to record physical handover.
              </p>
            </div>

            {/* QR Code display */}
            <div className="p-5 bg-white rounded-3xl shadow-2xl inline-block mx-auto border-4 border-emerald-500/30">
              <img
                src={qrData.qr_data_url}
                alt="Collection QR Code"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <div className="text-xs text-slate-400 space-y-1">
              <p>
                <strong className="text-slate-200">Valid until:</strong> {new Date(qrData.expires_at).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-500">
                Cryptographic 256-bit single-use token. Automatically marked used and retired upon verified handover.
              </p>
            </div>
          </div>
        )}

        {claim.status === "info_requested" && (
          <div className="p-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              Additional Verification Evidence Requested
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              {claim.decision_reason || "The campus administrator needs more specific details to verify your claim."}
            </p>

            <form onSubmit={handleAdditionalInfoSubmit} className="space-y-3 pt-2">
              <textarea
                required
                rows={3}
                value={additionalEvidence}
                onChange={(e) => setAdditionalEvidence(e.target.value)}
                placeholder="Enter additional details or clarifications here..."
                className="w-full p-3 bg-slate-950/80 rounded-xl border border-amber-500/40 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
              <button
                type="submit"
                disabled={submittingInfo}
                className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingInfo ? "Submitting..." : "Send Additional Evidence"}
              </button>
            </form>
          </div>
        )}

        {claim.status === "completed" && (
          <div className="p-6 bg-slate-950/60 border border-slate-800 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Handover Completed</h3>
            <p className="text-xs text-slate-400">
              The item has been returned and verified by campus staff. This claim is completed.
            </p>
          </div>
        )}

        {claim.status === "rejected" && (
          <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-1">
            <h3 className="text-sm font-bold text-rose-300">Claim Rejected</h3>
            <p className="text-xs text-rose-400">
              {claim.decision_reason || "Ownership evidence did not match the physical item."}
            </p>
          </div>
        )}

        {/* Evidence Summary */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3">
          <h3 className="text-sm font-bold text-white">Private Verification Answers Submitted</h3>
          <div className="p-4 bg-slate-950/60 rounded-2xl space-y-2 text-xs text-slate-300 border border-slate-800">
            <div>
              <strong className="text-slate-400">Distinctive Marks & Flaws:</strong>
              <p className="text-slate-200 mt-0.5">{claim.distinctive_marks}</p>
            </div>
            {claim.secret_contents && (
              <div>
                <strong className="text-slate-400">Secret Contents:</strong>
                <p className="text-slate-200 mt-0.5">{claim.secret_contents}</p>
              </div>
            )}
            <div>
              <strong className="text-slate-400">Circumstances of Loss:</strong>
              <p className="text-slate-200 mt-0.5">{claim.loss_circumstances}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
