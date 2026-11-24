"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AppNotification } from "@/types";
import ThemeToggle from "@/components/theme-toggle";
import { 
  Search, ShieldAlert, Bell, LogOut, Menu, X, Check,
  Sparkles
} from "lucide-react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
      const unread = res.data.filter((n: AppNotification) => !n.is_read).length;
      setUnreadCount(unread);
    } catch {}
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.post("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.is_read) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {}
    }
    setNotificationsOpen(false);
    if (notif.link) {
      router.push(notif.link);
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#090D16]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 shadow-xs dark:shadow-none transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/25 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white tracking-tight block leading-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                Campus Portal
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-wider uppercase flex items-center gap-1">
                Lost & Found <Sparkles className="w-2.5 h-2.5" />
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5">
            <Link
              href="/reports"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive("/reports")
                  ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold"
                  : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
              }`}
            >
              Browse Catalog
            </Link>
            <Link
              href="/reports/lost/new"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive("/reports/lost/new")
                  ? "bg-rose-50 dark:bg-rose-500/20 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-bold"
                  : "text-rose-600 dark:text-rose-400/90 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10"
              }`}
            >
              Report Lost
            </Link>
            <Link
              href="/reports/found/new"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive("/reports/found/new")
                  ? "bg-emerald-50 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/30 font-bold"
                  : "text-emerald-600 dark:text-emerald-400/90 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              }`}
            >
              Report Found
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive("/dashboard")
                    ? "bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/30 font-bold"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60"
                }`}
              >
                My Dashboard
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/40 shadow-xs"
                    : "text-amber-600 dark:text-amber-400/90 hover:text-amber-700 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-500/10"
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Admin Console
              </Link>
            )}
          </nav>

          {/* Right actions: ThemeToggle + User Profile / Sign In */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <ThemeToggle />

            {user ? (
              <div className="flex items-center gap-2.5">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60 transition-all"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl rounded-2xl shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-700/70 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 font-semibold"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-xs text-slate-400 dark:text-slate-500">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors flex gap-3 ${
                                !n.is_read ? "bg-blue-50/60 dark:bg-blue-500/5" : ""
                              }`}
                            >
                              <div className="mt-1">
                                <div className={`w-2 h-2 rounded-full ${!n.is_read ? "bg-blue-600 dark:bg-blue-500 ring-4 ring-blue-500/20" : "bg-slate-300 dark:bg-slate-700"}`} />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900 dark:text-slate-200">{n.title}</p>
                                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1">
                                  {new Date(n.created_at).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Chip */}
                <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200 dark:border-slate-800">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-gradient-to-tr dark:from-slate-800 dark:to-slate-700 border border-blue-200 dark:border-slate-600 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-900 dark:text-white leading-none">{user.name}</p>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
                    title="Sign Out"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-xl transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-md shadow-blue-600/30 transition-all hover:scale-102"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle & ThemeToggle */}
          <div className="md:hidden flex items-center gap-1.5">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#090D16]/95 backdrop-blur-2xl px-4 pt-3 pb-6 space-y-2">
          <Link
            href="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Browse Catalog
          </Link>
          <Link
            href="/reports/lost/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10"
          >
            Report Lost Item
          </Link>
          <Link
            href="/reports/found/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
          >
            Report Found Item
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10"
            >
              My Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-xl text-sm font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10"
            >
              Admin Console
            </Link>
          )}

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{user.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-xs font-bold bg-blue-600 text-white rounded-xl shadow-xs hover:bg-blue-500"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
