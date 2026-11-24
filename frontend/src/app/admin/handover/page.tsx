"use client";

import React, { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { 
  QrCode, Camera, CheckCircle2, AlertCircle, ShieldCheck, 
  ArrowRight, RefreshCw, Key 
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
      <div className="bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl backdrop-blur-xl space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Collection Desk Handover
          </span>
          <h1 className="text-2xl font-extrabold text-white mt-1">
            QR Collection Verification
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Scan the claimant&apos;s phone screen using your webcam/camera or manually enter the 32-character token.
          </p>
        </div>

        {/* Camera Toggle */}
        <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-white">Webcam Scanner</h2>
              <p className="text-[11px] text-slate-400">Scan QR code using device camera</p>
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
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-black">
            <div id="qr-reader" className="w-full text-white" />
          </div>
        )}

        {/* Manual Token input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-slate-300">
            Manual Token Entry (or Scanned Output)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste or enter 32+ character verification token..."
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 rounded-xl border border-slate-700/80 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition-all shrink-0 disabled:opacity-50"
            >
              {verifying ? "Checking..." : "Verify Token"}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {completeSuccess && (
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Handover Successfully Completed!</h3>
            <p className="text-xs text-slate-400">
              The item has been marked as Returned, the claim is completed, and the token has been permanently retired.
            </p>
          </div>
        )}

        {/* Verification Success Result Card */}
        {verificationResult && (
          <div className="p-6 bg-emerald-950/40 border-2 border-emerald-500 rounded-3xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-4 h-4" /> Valid QR Token
              </span>
              <span className="text-xs text-emerald-300 font-semibold">Ready for Physical Release</span>
            </div>

            <div className="bg-slate-950/80 p-4 rounded-2xl border border-emerald-500/30 space-y-2 text-xs">
              <h3 className="font-bold text-base text-white">
                {verificationResult.item_name}
              </h3>
              <p className="text-slate-400">Category: {verificationResult.category}</p>

              <div className="pt-2 border-t border-slate-800 space-y-1">
                <p>
                  <strong className="text-slate-300">Distinctive Marks verified:</strong> {verificationResult.distinctive_marks}
                </p>
                {verificationResult.secret_contents && (
                  <p>
                    <strong className="text-slate-300">Secret Contents:</strong> {verificationResult.secret_contents}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmHandover}
              disabled={completing}
              className="w-full py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-5 h-5" />
              {completing ? "Confirming Handover..." : "Confirm Physical Handover to Claimant"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
