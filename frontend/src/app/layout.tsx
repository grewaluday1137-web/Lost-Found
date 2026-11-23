import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Campus Lost & Found Portal",
  description: "Centralized campus lost and found reporting, intelligent candidate matching, and verified QR handovers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50/50 text-gray-900 flex flex-col antialiased`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <footer className="border-t border-gray-200/80 bg-white py-6 text-center text-xs text-gray-500">
            <p>© 2026 Campus Lost & Found Portal — Secure Property Return System</p>
            <p className="mt-1 text-gray-400">Powered by Human Verification, Heuristic Matching & Single-Use QR Tokens</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
