"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/api";
import { Claim } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { 
  ShieldCheck, Clock, CheckCircle2, AlertCircle, QrCode, 
  ArrowLeft, Building, Send, FileText, Check 
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
    return <div className="h-96 bg-gray-100 rounded-3xl animate-pulse" />;
  }

  if (error || !claim) {
    return (
      <div className="max-w-md mx-auto py-12 text-center bg-white p-8 rounded-3xl border border-gray-100">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-gray-900">Claim Not Found</h2>
        <p className="text-xs text-gray-500 mt-1">{error || "Access denied or invalid ID"}</p>
        <Link href="/dashboard" className="inline-block mt-4 text-xs font-semibold text-blue-600 hover:underline">
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
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to My Dashboard
      </Link>

      {/* Progress tracker */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
            Claim Tracking
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Claim for: {claim.report?.item_name || "Found Item"}
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Claim ID: <code className="text-gray-700 bg-gray-100 px-1 py-0.5 rounded">{claim._id}</code>
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
                  className={`h-2 rounded-full transition-colors ${
                    isPassed ? "bg-blue-600" : "bg-gray-200"
                  }`}
                />
                <span
                  className={`text-[11px] block font-semibold ${
                    isCurrent ? "text-blue-600 font-bold" : isPassed ? "text-gray-900" : "text-gray-400"
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
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
              <CheckCircle2 className="w-4 h-4" /> Claim Approved — Present at Collection Desk
            </div>

            <h2 className="text-xl font-bold text-emerald-950">
              Your Single-Use Collection QR Pass
            </h2>
            <p className="text-xs text-emerald-800 max-w-md mx-auto">
              Please present this QR code to the authorized campus administrator at the collection desk. The administrator will scan it to verify ownership and record physical handover.
            </p>

            {/* QR Code display */}
            <div className="p-4 bg-white rounded-2xl shadow-md border border-emerald-100 inline-block mx-auto">
              <img
                src={qrData.qr_data_url}
                alt="Collection QR Code"
                className="w-56 h-56 mx-auto object-contain"
              />
            </div>

            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Valid until:</strong> {new Date(qrData.expires_at).toLocaleString()}
              </p>
              <p className="text-[11px] text-gray-400">
                Single-use cryptographic token. Invalided immediately upon handover completion.
              </p>
            </div>
          </div>
        )}

        {claim.status === "info_requested" && (
          <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              Additional Verification Evidence Requested
            </div>
            <p className="text-xs text-amber-800">
              {claim.decision_reason || "The campus administrator needs more specific details to verify your claim."}
            </p>

            <form onSubmit={handleAdditionalInfoSubmit} className="space-y-3 pt-2">
              <textarea
                required
                rows={3}
                value={additionalEvidence}
                onChange={(e) => setAdditionalEvidence(e.target.value)}
                placeholder="Enter additional details or clarifications here..."
                className="w-full p-3 bg-white rounded-xl border border-amber-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                disabled={submittingInfo}
                className="py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {submittingInfo ? "Submitting..." : "Send Additional Evidence"}
              </button>
            </form>
          </div>
        )}

        {claim.status === "completed" && (
          <div className="p-6 bg-gray-50 border border-gray-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Handover Complete</h3>
            <p className="text-xs text-gray-500">
              The item has been returned and verified by campus staff. This claim is completed.
            </p>
          </div>
        )}

        {claim.status === "rejected" && (
          <div className="p-5 bg-red-50 border border-red-200 rounded-2xl space-y-1">
            <h3 className="text-sm font-bold text-red-900">Claim Rejected</h3>
            <p className="text-xs text-red-700">
              {claim.decision_reason || "Ownership evidence did not match the physical item."}
            </p>
          </div>
        )}

        {/* Evidence Summary */}
        <div className="pt-4 border-t border-gray-100 space-y-3">
          <h3 className="text-sm font-bold text-gray-900">Private Verification Answers Submitted</h3>
          <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-xs text-gray-700">
            <div>
              <strong>Distinctive Marks & Flaws:</strong>
              <p className="text-gray-600 mt-0.5">{claim.distinctive_marks}</p>
            </div>
            {claim.secret_contents && (
              <div>
                <strong>Secret Contents:</strong>
                <p className="text-gray-600 mt-0.5">{claim.secret_contents}</p>
              </div>
            )}
            <div>
              <strong>Loss Circumstances:</strong>
              <p className="text-gray-600 mt-0.5">{claim.loss_circumstances}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
