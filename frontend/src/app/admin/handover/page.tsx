"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { 
  Camera, CheckCircle2, AlertCircle, ShieldCheck, 
  ArrowRight, Key 
} from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function AdminHandoverPage() {
  const [tokenInput, setTokenInput] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeSuccess, setCompleteSuccess] = useState(false);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const runVerification = async (rawToken: string) => {
    if (!rawToken.trim()) return;
    setError(null);
    setVerificationResult(null);
    setVerifying(true);

    try {
      const res = await api.post("/admin/qr/verify", { token: rawToken.trim() });
      if (res.data.valid) {
        setVerificationResult(res.data);
      } else {
        setError(res.data.message || "Invalid or expired verification token.");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Verification failed.");
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runVerification(tokenInput);
  };

  // Setup HTML5 QR Scanner
  useEffect(() => {
    if (scannerActive) {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(
        (decodedText) => {
          setTokenInput(decodedText);
          runVerification(decodedText);
          scanner.clear();
          setScannerActive(false);
        },
        () => {}
      );

      scannerRef.current = scanner;

      return () => {
        scanner.clear().catch(() => {});
      };
    }
  }, [scannerActive]);

  const handleConfirmHandover = async () => {
    if (!verificationResult || !verificationResult.claim_id) return;
    setCompleting(true);
    try {
      await api.post(`/admin/claims/${verificationResult.claim_id}/complete`);
      setCompleteSuccess(true);
      setVerificationResult(null);
      setTokenInput("");
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to confirm handover.");
    } finally {
      setCompleting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white/90 dark:bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-md dark:shadow-2xl backdrop-blur-xl space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            Collection Desk Handover
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            QR Collection Verification
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Scan the claimant&apos;s phone screen using your webcam/camera or manually enter the 32-character token.
          </p>
        </div>

        {/* Camera Toggle */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-900 dark:text-white">Webcam Scanner</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Scan QR code using device camera</p>
            </div>
          </div>
          <button
            onClick={() => setScannerActive(!scannerActive)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
          >
            {scannerActive ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {/* Video reader container */}
        {scannerActive && (
          <div className="overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 bg-black">
            <div id="qr-reader" className="w-full text-white" />
          </div>
        )}

        {/* Manual Token input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Manual Token Entry (or Scanned Output)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Enter 32-character secure alphanumeric token..."
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={verifying || !tokenInput.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-50 transition-colors shrink-0"
            >
              {verifying ? "Verifying..." : "Verify Token"}
            </button>
          </div>
        </form>

        {/* Success complete notification */}
        {completeSuccess && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-xs">Handover Officially Recorded!</h3>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-300/80">
                The single-use QR token was consumed, the item status set to &apos;returned&apos;, and audit trail recorded.
              </p>
            </div>
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-3 text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Verification result details */}
        {verificationResult && (
          <div className="p-6 bg-slate-50 dark:bg-slate-950/70 rounded-3xl border border-emerald-300 dark:border-emerald-500/40 space-y-4 animate-in fade-in">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-5 h-5" /> Token Validated — Ready for Item Release
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Item to Release</span>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{verificationResult.item_name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">Category: {verificationResult.category}</p>
              </div>

              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                <span className="text-slate-400 dark:text-slate-500 block text-[10px] uppercase font-bold">Verified Claimant</span>
                <p className="font-extrabold text-slate-900 dark:text-white text-sm mt-0.5">{verificationResult.claimant_name}</p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">ID: {verificationResult.claimant_campus_id || "Registered User"}</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-xl text-[11px] text-amber-800 dark:text-amber-300">
              Check physical photo ID of the claimant matches <strong>{verificationResult.claimant_name}</strong> before handing over property.
            </div>

            <button
              onClick={handleConfirmHandover}
              disabled={completing}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-101 flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {completing ? "Recording Handover..." : "Confirm Physical Handover & Retire QR Pass"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
