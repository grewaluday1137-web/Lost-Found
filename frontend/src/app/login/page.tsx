"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { Lock, Mail, AlertCircle, ArrowRight, ShieldCheck, UserCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      login(res.data.access_token, res.data.user);
      if (res.data.user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAdmin = () => {
    setEmail("admin@campus.edu");
    setPassword("Admin@12345");
  };

  const fillDemoStudent = () => {
    setEmail("student@campus.edu");
    setPassword("Student@12345");
  };

  return (
    <div className="max-w-md mx-auto py-8">
      <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Sign In to Campus Portal</h1>
          <p className="text-xs text-gray-500">
            Access your property reports, claims, and collection QR codes
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
              Campus Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@campus.edu"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50/50 rounded-xl border border-gray-200 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast-fill helpers for test convenience */}
        <div className="pt-4 border-t border-gray-100">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider text-center mb-2">
            Testing / Demo Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="py-1.5 px-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-medium rounded-lg border border-amber-200 flex items-center justify-center gap-1 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Demo Admin
            </button>
            <button
              type="button"
              onClick={fillDemoStudent}
              className="py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-medium rounded-lg border border-blue-200 flex items-center justify-center gap-1 transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5" />
              Demo Student
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-gray-500">
          Don&apos;t have an account yet?{" "}
          <Link href="/register" className="font-semibold text-blue-600 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
