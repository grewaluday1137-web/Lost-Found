"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { 
  ShieldAlert, LayoutDashboard, CheckSquare, FileSearch, 
  QrCode, AlertTriangle 
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== "admin")) {
      router.push("/login");
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div className="h-96 bg-slate-900/40 rounded-3xl border border-slate-800 animate-pulse" />;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="py-20 text-center max-w-md mx-auto bg-slate-900/80 p-8 rounded-3xl border border-slate-800">
        <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white">Access Restricted</h2>
        <p className="text-xs text-slate-400 mt-1">
          You must be an authorized campus administrator to access this area.
        </p>
        <Link href="/login" className="inline-block mt-4 text-xs font-semibold text-blue-400 hover:underline">
          Sign in as Administrator →
        </Link>
      </div>
    );
  }

  const navItems = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Report Moderation", href: "/admin/moderation", icon: CheckSquare },
    { label: "Claim Review", href: "/admin/claims", icon: FileSearch },
    { label: "QR Handover Scanner", href: "/admin/handover", icon: QrCode },
  ];

  return (
    <div className="space-y-6 py-2">
      {/* Admin Title Bar */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900/90 to-slate-900/90 border border-amber-500/30 p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Campus Administration Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1.5">
            Property Custody & Verification Desk
          </h1>
          <p className="text-xs text-amber-300/80 mt-1">
            Logged in as {user.name} ({user.email})
          </p>
        </div>
      </div>

      {/* Admin Nav Tabs */}
      <div className="flex gap-2 overflow-x-auto border-b border-slate-800 pb-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2 py-2.5 px-4 font-bold text-xs rounded-xl transition-all shrink-0 ${
                isActive
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/25"
                  : "bg-slate-900/60 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/80"
              }`}
            >
              <Icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div>{children}</div>
    </div>
  );
}
