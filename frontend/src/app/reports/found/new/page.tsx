"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { CheckCircle2, Upload, AlertCircle, ArrowLeft, Shield } from "lucide-react";
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
    <div className="max-w-2xl mx-auto py-6 space-y-6">
      <Link href="/reports" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Cancel & Return
      </Link>

      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider">
            Report Found Property
          </div>
          <h1 className="text-2xl font-bold text-gray-900">
            Help return property to its owner
          </h1>
          <p className="text-xs text-gray-500">
            Thank you for being a good citizen! Enter details about where you found the item and where it is currently held.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Found Item Name *
            </label>
            <input
              type="text"
              required
              value={formData.item_name}
              onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
              placeholder="e.g. Black AirPods Pro Case, Set of Dorm Keys with Lanyard"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Category *
              </label>
              <select
                required
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Color
              </label>
              <input
                type="text"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder="e.g. White, Black, Red"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Brand / Markings
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g. Apple, Anker, Casio"
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Found Date & Time *
              </label>
              <input
                type="datetime-local"
                required
                value={formData.event_time}
                onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Found Location (Where on campus did you pick it up?) *
            </label>
            <input
              type="text"
              required
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g. Bench outside Cafeteria, Table 4 in Library"
              className="w-full px-4 py-2.5 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Current Custody Location */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-amber-900 font-semibold text-xs">
              <Shield className="w-4 h-4 text-amber-600" />
              Physical Custody Location (Staff & Admin Only)
            </div>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              This field is confidential and will NOT be shown in public search results. It enables administrators to coordinate handover.
            </p>
            <select
              required
              value={formData.custody_location}
              onChange={(e) => setFormData({ ...formData, custody_location: e.target.value })}
              className="w-full px-3.5 py-2 bg-white rounded-xl border border-amber-300 text-xs font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              {custodyOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Public Description *
            </label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe observable features so the rightful owner can recognize it. Avoid posting unique serial numbers or secret contents."
              className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Photograph Upload */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Photograph (Recommended)
            </label>
            <div className="flex items-center gap-4">
              <label className="cursor-pointer border-2 border-dashed border-gray-200 hover:border-emerald-500 rounded-2xl p-4 flex flex-col items-center justify-center flex-1 transition-colors bg-gray-50/50">
                <Upload className="w-6 h-6 text-gray-400 mb-1" />
                <span className="text-xs font-medium text-gray-600">
                  {imageFile ? imageFile.name : "Click to select a photograph of the found item"}
                </span>
                <span className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, or WEBP up to 5MB</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
              {imagePreview && (
                <div className="w-24 h-24 rounded-2xl overflow-hidden border border-gray-200 shrink-0">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Submitting Report..." : "Submit Found Report"}
          </button>
        </form>
      </div>
    </div>
  );
}
