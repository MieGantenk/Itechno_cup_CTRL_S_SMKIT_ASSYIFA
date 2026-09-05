'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import SidebarAplikasi from './SidebarAplikasi';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  // Nama halaman dipakai untuk menentukan apakah sidebar perlu ditampilkan.
  const pathname = usePathname();

  /*
   * Halaman yang TIDAK menggunakan sidebar.
   *
   * /             = Home
   * /login        = Login
   * /register     = Register
   * /onboarding   = Pengisian data setelah Google Register
   * /auth/...     = Callback OAuth
   * /pending      = Menunggu verifikasi admin
   */

  const tanpaSidebar =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/onboarding' ||
    pathname.startsWith('/auth/') ||
    pathname === '/pending';

  // Halaman login dan proses awal akun dibuat lebih sederhana tanpa sidebar.
  if (tanpaSidebar) {
    return (
      <main className="min-h-screen w-full">
        {children}
      </main>
    );
  }

  // Halaman utama aplikasi memakai sidebar sebagai navigasi.
  return (
    <div className="min-h-screen w-full flex bg-slate-50 dark:bg-slate-950">
      <SidebarAplikasi />

      <main className="flex-1 min-w-0 min-h-screen overflow-x-auto pb-24 md:pb-0">
        {children}
      </main>
    </div>
  );
}