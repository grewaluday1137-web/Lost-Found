"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import { AppNotification } from "@/types";
import { 
  Search, PlusCircle, ShieldAlert, Bell, CheckCircle, 
  User as UserIcon, LogOut, Menu, X, Check
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
    } catch {
      // Ignore background notification fetch errors
    }
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
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Search className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-bold text-lg text-gray-900 tracking-tight block leading-tight">
                Campus Portal
              </span>
              <span className="text-xs text-blue-600 font-medium tracking-wide uppercase">
                Lost & Found
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/reports"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/reports")
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Browse Items
            </Link>
            <Link
              href="/reports/lost/new"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/reports/lost/new")
                  ? "bg-red-50 text-red-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Report Lost
            </Link>
            <Link
              href="/reports/found/new"
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive("/reports/found/new")
                  ? "bg-emerald-50 text-emerald-700 font-semibold"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              Report Found
            </Link>

            {user && (
              <Link
                href="/dashboard"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive("/dashboard")
                    ? "bg-blue-50 text-blue-700 font-semibold"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                My Dashboard
              </Link>
            )}

            {user?.role === "admin" && (
              <Link
                href="/admin"
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith("/admin")
                    ? "bg-amber-100 text-amber-900 font-semibold"
                    : "text-amber-700 hover:bg-amber-50"
                }`}
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Admin Console
              </Link>
            )}
          </nav>

          {/* User actions */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown menu */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                        <span className="font-semibold text-sm text-gray-800">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>
                      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                        {notifications.length === 0 ? (
                          <p className="text-center py-6 text-sm text-gray-400">
                            No notifications yet
                          </p>
                        ) : (
                          notifications.map((n) => (
                            <button
                              key={n._id}
                              onClick={() => handleNotificationClick(n)}
                              className={`w-full text-left p-3 hover:bg-gray-50 transition-colors flex gap-3 ${
                                !n.is_read ? "bg-blue-50/50" : ""
                              }`}
                            >
                              <div className="mt-0.5">
                                <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5" />
                              </div>
                              <div className="flex-1">
                                <p className="text-xs font-semibold text-gray-900">{n.title}</p>
                                <p className="text-xs text-gray-600 line-clamp-2 mt-0.5">
                                  {n.message}
                                </p>
                                <span className="text-[10px] text-gray-400 block mt-1">
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

                {/* Profile info & logout */}
                <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 leading-none">{user.name}</p>
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={logout}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition-all hover:shadow"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pt-2 pb-6 space-y-2">
          <Link
            href="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50"
          >
            Browse Items
          </Link>
          <Link
            href="/reports/lost/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-red-600 hover:bg-red-50"
          >
            Report Lost Item
          </Link>
          <Link
            href="/reports/found/new"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-emerald-600 hover:bg-emerald-50"
          >
            Report Found Item
          </Link>
          {user && (
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-blue-600 hover:bg-blue-50"
            >
              My Dashboard
            </Link>
          )}
          {user?.role === "admin" && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-amber-700 bg-amber-50"
            >
              Admin Console
            </Link>
          )}

          <div className="pt-4 border-t border-gray-100">
            {user ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium border border-gray-200 rounded-lg text-gray-700"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-medium bg-blue-600 text-white rounded-lg"
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
