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
    <html lang="en" className="dark">
      <body className={`${inter.className} min-h-screen bg-[#090D16] text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white relative`}>
        {/* Ambient Top Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-600/15 via-indigo-600/5 to-transparent blur-3xl pointer-events-none -z-10" />

        <AuthProvider>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
            {children}
          </main>
          <footer className="border-t border-slate-800/80 bg-slate-950/80 backdrop-blur-md py-8 text-center text-xs text-slate-400">
            <div className="max-w-7xl mx-auto px-4 space-y-2">
              <p className="font-semibold text-slate-300">© 2026 Campus Lost & Found Portal — Secure Property Return Network</p>
              <p className="text-slate-500">
                Powered by Human Verification, Multi-Attribute Heuristic Matching & Single-Use Cryptographic QR Passes
              </p>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
