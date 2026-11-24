import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/navbar";
import { AuthProvider } from "@/lib/auth-context";
import { ThemeProvider } from "@/lib/theme-context";

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
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('campus_portal_theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  if (theme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen bg-slate-50 dark:bg-[#090D16] text-slate-900 dark:text-slate-100 flex flex-col antialiased selection:bg-blue-600 selection:text-white relative transition-colors duration-200`}>
        {/* Ambient Top Glow */}
        <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-400/10 via-indigo-400/5 to-transparent dark:from-blue-600/15 dark:via-indigo-600/5 dark:to-transparent blur-3xl pointer-events-none -z-10" />

        <ThemeProvider>
          <AuthProvider>
            <Navbar />
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-0">
              {children}
            </main>
            <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md py-8 text-center text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
              <div className="max-w-7xl mx-auto px-4 space-y-2">
                <p className="font-semibold text-slate-700 dark:text-slate-300">© 2026 Campus Lost & Found Portal — Secure Property Return Network</p>
                <p className="text-slate-500 dark:text-slate-500">
                  Powered by Human Verification, Multi-Attribute Heuristic Matching & Single-Use Cryptographic QR Passes
                </p>
              </div>
            </footer>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
