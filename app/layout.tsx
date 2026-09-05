import type { Metadata } from "next";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Pangan Cerdas",
  description: "Aplikasi Pangan & Bio-Energi Spasial",
  icons: {
    icon: "/logo%20transparan.png",
    shortcut: "/logo%20transparan.png",
    apple: "/logo%20transparan.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="antialiased">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}