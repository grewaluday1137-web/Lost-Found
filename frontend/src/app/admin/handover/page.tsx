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
        () => {
          // ignore scan frame errors
        }
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
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-xs space-y-6">
        <div>
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Collection Desk Handover
          </span>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            QR Collection Verification
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Scan the claimant&apos;s phone screen using your webcam/camera or manually enter the 32-character token.
          </p>
        </div>

        {/* Camera Toggle */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-gray-900">Webcam Scanner</h2>
              <p className="text-[11px] text-gray-500">Scan QR code using device camera</p>
            </div>
          </div>
          <button
            onClick={() => setScannerActive(!scannerActive)}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            {scannerActive ? "Stop Camera" : "Start Camera"}
          </button>
        </div>

        {/* Video reader container */}
        {scannerActive && (
          <div className="overflow-hidden rounded-2xl border border-gray-200">
            <div id="qr-reader" className="w-full" />
          </div>
        )}

        {/* Manual Token input */}
        <form onSubmit={handleManualSubmit} className="space-y-3">
          <label className="block text-xs font-semibold text-gray-700">
            Manual Token Entry (or Scanned Output)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder="Paste or enter 32+ character verification token..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-xs font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              type="submit"
              disabled={verifying}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50"
            >
              {verifying ? "Checking..." : "Verify Token"}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {completeSuccess && (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">Handover Successfully Completed!</h3>
            <p className="text-xs text-gray-600">
              The item has been marked as Returned, the claim is completed, and the token has been permanently retired.
            </p>
          </div>
        )}

        {/* Verification Success Result Card */}
        {verificationResult && (
          <div className="p-6 bg-emerald-50/70 border-2 border-emerald-500 rounded-3xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-lg uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Valid QR Token
              </span>
              <span className="text-xs text-emerald-800 font-medium">Ready for Physical Release</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-2 text-xs">
              <h3 className="font-bold text-base text-gray-900">
                {verificationResult.item_name}
              </h3>
              <p className="text-gray-500">Category: {verificationResult.category}</p>

              <div className="pt-2 border-t border-gray-100 space-y-1">
                <p>
                  <strong>Distinctive Marks verified:</strong> {verificationResult.distinctive_marks}
                </p>
                {verificationResult.secret_contents && (
                  <p>
                    <strong>Secret Contents:</strong> {verificationResult.secret_contents}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleConfirmHandover}
              disabled={completing}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
