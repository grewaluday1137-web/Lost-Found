"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AlertCircle, ArrowLeft, Shield, Image as ImageIcon } from "lucide-react";
import Link from "next/link";

export default function ReportFoundPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    item_name: "",
    category: "Electronics",
    description: "",
    color: "",
    brand: "",
    location: "",
    event_time: new Date().toISOString().slice(0, 16),
    custody_location: "Campus Security Office (Central Desk)"
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = [
    "Electronics",
    "Wallets & Cards",
    "Keys",
    "Books & Bags",
    "Clothing",
    "Accessories",
    "Bottles & Mugs",
    "Sporting Equipment",
    "Other"
  ];

  const custodyOptions = [
    "Campus Security Office (Central Desk)",
    "Student Union Lost & Found Desk",
    "Library Help Desk (Ground Floor)",
    "Department Reception Desk",
    "With Finder (Held until claimant handover is verified)"
  ];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      router.push("/login");
      return;
    }
    setError(null);
    setLoading(true);

    try {
      let imageUrls: string[] = [];

      // Upload photograph if provided
      if (imageFile) {
        const uploadData = new FormData();
        uploadData.append("file", imageFile);
        const uploadRes = await api.post("/reports/upload-image", uploadData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        imageUrls.push(uploadRes.data.url);
      }

      const payload = {
        ...formData,
        event_time: new Date(formData.event_time).toISOString(),
        image_urls: imageUrls
      };

      const res = await api.post("/reports/found", payload);
      router.push(`/reports/${res.data._id}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to submit found report. Please check fields.");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      <div className="bg-white/90 dark:bg-slate-900/75 p-6 sm:p-8 rounded-3xl border border-slate-200/90 dark:border-slate-800/80 shadow-md dark:shadow-2xl backdrop-blur-xl space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/15 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
            Report Found Property
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Help return property to its owner
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Thank you for being a good citizen! Enter details about where you found the item and where it is currently held.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Found Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="e.g. Black AirPods Pro Case, Set of Dorm Keys with Lanyard"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c} className="bg-white dark:bg-slate-900">{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Primary Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g. White, Red, Navy"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brand (if visible)
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Sony, Anker, Patagonia"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Date & Approximate Time Found *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Location Found on Campus *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Engineering Hall Bench near Room 102"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Custody / Physical Holding Location *
            </label>
            <select
              value={formData.custody_location}
              onChange={(e) => setFormData({ ...formData, custody_location: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:border-blue-500"
            >
              {custodyOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-white dark:bg-slate-900">{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Public Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a general description. Do not list secret distinctive marks that a claimant should provide to prove ownership..."
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/70 rounded-xl border border-slate-200 dark:border-slate-700/80 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Photograph Upload */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Attach Photograph (Recommended)
            </label>
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl p-6 text-center transition-colors bg-slate-50/80 dark:bg-slate-950/50">
              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-48 h-36 object-cover mx-auto rounded-xl border border-slate-300 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview(null);
                    }}
                    className="text-xs text-rose-600 dark:text-rose-400 font-semibold hover:underline"
                  >
                    Remove Photo
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block space-y-2">
                  <ImageIcon className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold">
                    Click to browse or drop photograph here
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    JPG, PNG, WebP up to 10MB
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs rounded-xl flex items-center gap-2">
            <Shield className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <span>Custody locations help verified claimants know which campus desk to visit with their QR pass.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all hover:scale-101 disabled:opacity-50"
          >
            {loading ? "Submitting Report..." : "Submit Found Item Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
