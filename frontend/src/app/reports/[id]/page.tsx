"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import api, { formatImageUrl } from "@/lib/api";
import { Report, MatchCandidate } from "@/types";
import { useAuth } from "@/lib/auth-context";
import { 
  MapPin, Calendar, Tag, ShieldCheck, Sparkles, AlertCircle, 
  CheckCircle, ArrowLeft, Send
} from "lucide-react";

export default function ReportDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();

  const [report, setReport] = useState<Report | null>(null);
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Claim Modal states
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [distinctiveMarks, setDistinctiveMarks] = useState("");
  const [secretContents, setSecretContents] = useState("");
  const [lossCircumstances, setLossCircumstances] = useState("");
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccess, setClaimSuccess] = useState(false);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const res = await api.get(`/reports/${id}`);
        setReport(res.data);

        // If user is owner or admin, also fetch candidate matches
        if (user && (user._id === res.data.user_id || user.role === "admin")) {
          try {
            const matchRes = await api.get(`/reports/${id}/matches`);
            setMatches(matchRes.data);
          } catch {}
        }
      } catch (err: any) {
        setError(err.response?.data?.detail || "Could not load report details.");
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id, user]);

  const handleClaimSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setClaimError(null);
    setClaimSubmitting(true);

    try {
      const res = await api.post(`/claims/reports/${id}`, {
        distinctive_marks: distinctiveMarks,
        secret_contents: secretContents,
        loss_circumstances: lossCircumstances,
        evidence_image_urls: []
      });
      setClaimSuccess(true);
      setTimeout(() => {
        router.push(`/dashboard/claims/${res.data._id}`);
      }, 1500);
    } catch (err: any) {
      setClaimError(err.response?.data?.detail || "Failed to submit ownership claim.");
      setClaimSubmitting(false);
    }
  };

  if (loading) {
    return <div className="h-96 bg-slate-200/50 dark:bg-slate-900/40 rounded-3xl border border-slate-200 dark:border-slate-800 animate-pulse" />;
  }

  if (error || !report) {
    return (
      <div className="max-w-md mx-auto py-16 text-center bg-white/80 dark:bg-slate-900/60 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-md">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Unable to view report</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error || "Item not found"}</p>
        <Link href="/reports" className="inline-block mt-4 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          ← Back to Catalog
        </Link>
      </div>
    );
  }

  const isOwner = user && user._id === report.user_id;
  const isFound = report.type === "found";
  const canClaim = isFound && report.moderation_status === "published" && report.item_outcome !== "returned" && !isOwner;

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Back button */}
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Property Catalog
      </Link>

      <div className="bg-white/90 dark:bg-slate-900/70 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-md dark:shadow-2xl overflow-hidden backdrop-blur-xl">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Photograph gallery */}
          <div className="bg-slate-100 dark:bg-slate-950/80 flex items-center justify-center min-h-[320px] relative border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800">
            {report.image_urls?.[0] ? (
              <img
                src={formatImageUrl(report.image_urls[0])}
                alt={report.item_name}
                className="w-full h-full object-cover max-h-[440px]"
              />
            ) : (
              <div className="text-center p-8 text-slate-400 dark:text-slate-600">
                <Tag className="w-12 h-12 mx-auto stroke-1 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-xs font-medium text-slate-500">No photograph attached to this report</p>
              </div>
            )}

            {/* Type badge */}
            <span
              className={`absolute top-4 left-4 px-3 py-1 text-[11px] font-extrabold rounded-xl shadow-md uppercase tracking-wider backdrop-blur-md ${
                report.type === "lost" ? "bg-rose-500 text-white shadow-rose-500/25" : "bg-emerald-500 text-white shadow-emerald-500/25"
              }`}
            >
              {report.type} Item
            </span>
          </div>

          {/* Details Column */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
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

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                {report.item_name}
              </h1>

              {/* Status Tags */}
              <div className="flex flex-wrap gap-2 mt-3.5">
                <span className="px-2.5 py-1 text-[11px] font-bold bg-blue-50 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-500/25 rounded-lg">
                  Status: {report.item_outcome.replace("_", " ").toUpperCase()}
                </span>
                {report.color && (
                  <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 rounded-lg">
                    Color: {report.color}
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-300 mt-4 leading-relaxed whitespace-pre-wrap">
                {report.description}
              </p>

              {/* Location & Time */}
              <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-400">Location:</strong> {report.location}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span>
                    <strong className="text-slate-700 dark:text-slate-400">Date & Time:</strong> {new Date(report.event_time).toLocaleString()}
                  </span>
                </div>
                {report.custody_location && (
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-2.5 rounded-xl mt-2">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    <span>
                      <strong className="text-amber-700 dark:text-amber-400">Custody:</strong> {report.custody_location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Action button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
              {canClaim ? (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-101 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  This is Mine — Claim Item
                </button>
              ) : isOwner ? (
                <div className="p-3 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs rounded-xl flex items-center gap-2">
                  <Tag className="w-4 h-4 shrink-0 text-blue-600 dark:text-blue-400" />
                  <span>You submitted this report. You can monitor matches on your dashboard.</span>
                </div>
              ) : report.item_outcome === "returned" ? (
                <div className="p-3 bg-slate-100 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs rounded-xl text-center font-medium border border-slate-200 dark:border-slate-700/50">
                  This item has already been verified and returned to its owner.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Candidate Matches Section (Owner or Admin view) */}
      {matches.length > 0 && (
        <div className="bg-white/80 dark:bg-slate-900/70 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-md dark:shadow-xl backdrop-blur-xl space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Potential Candidate Matches ({matches.length})
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Our multi-attribute matching algorithm scored these opposite-type reports based on category, color, brand, location, and date proximity.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {matches.map((m) => {
              const opp = m.target_report;
              if (!opp) return null;
              const pct = Math.round(m.score * 100);
              return (
                <div key={m._id} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 shadow-xs">
                  <div>
                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-500/20 border border-amber-200 dark:border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold text-[10px] rounded-md">
                      {pct}% Match
                    </span>
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white mt-1">{opp.item_name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{opp.category} • {opp.location}</p>
                  </div>
                  <Link
                    href={`/reports/${opp.id}`}
                    className="px-3.5 py-1.5 bg-slate-100 hover:bg-blue-600 text-slate-800 hover:text-white dark:bg-slate-800 dark:hover:bg-blue-600 dark:text-slate-200 dark:hover:text-white rounded-xl text-xs font-bold transition-colors shrink-0 border border-slate-200 dark:border-slate-700 shadow-xs"
                  >
                    View Match →
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Claim Submission Modal */}
      {claimModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-700/80 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="space-y-1">
              <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center mb-2">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Submit Private Ownership Claim
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Supply distinctive facts known only to the true owner. These answers are kept strictly private and visible only to campus administrators for verification.
              </p>
            </div>

            {claimError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            {claimSuccess ? (
              <div className="py-8 text-center space-y-2">
                <CheckCircle className="w-12 h-12 text-emerald-500 dark:text-emerald-400 mx-auto animate-bounce" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Claim Submitted Successfully!</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Redirecting to your claim status dashboard...</p>
              </div>
            ) : (
              <form onSubmit={handleClaimSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Distinctive Marks / Scratches / Serial Number *
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Describe flaws, stickers, decals, serial numbers, engravings, or unique wear.
                  </p>
                  <textarea
                    required
                    rows={2}
                    value={distinctiveMarks}
                    onChange={(e) => setDistinctiveMarks(e.target.value)}
                    placeholder="e.g. Small scratch on bottom-left corner; NASA sticker on back; Serial begins with F3..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Secret Contents / Internal Items (Optional)
                  </label>
                  <p className="text-[11px] text-slate-500 mb-1.5">
                    Items inside pockets, hidden compartments, lockscreen photo, or keychain attachments.
                  </p>
                  <textarea
                    rows={2}
                    value={secretContents}
                    onChange={(e) => setSecretContents(e.target.value)}
                    placeholder="e.g. Inside zippered pocket is a student ID card and library card; lockscreen shows a dog..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Circumstances & Loss Timeline *
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={lossCircumstances}
                    onChange={(e) => setLossCircumstances(e.target.value)}
                    placeholder="e.g. Left behind in Chemistry lecture hall 204 around 2:30 PM after lab..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700/80 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setClaimModalOpen(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claimSubmitting}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {claimSubmitting ? "Submitting..." : "Submit Claim"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
