'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function HalamanPending() {
  const router = useRouter();

  // Halaman ini mengecek role secara berkala karena status akun bisa berubah kapan saja.
  React.useEffect(() => {
    let isActive = true;

    const checkAdminRole = async () => {
      // Admin tidak perlu menunggu verifikasi, jadi langsung diarahkan ke dashboard.
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isActive) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (isActive && profile?.role?.toLowerCase().trim() === 'admin') {
        router.replace('/dashboard/admin');
      }
    };

    void checkAdminRole();
    const intervalId = window.setInterval(() => void checkAdminRole(), 5000);

    // Hentikan pengecekan saat halaman ditutup agar tidak ada request yang tertinggal.
    return () => {
      isActive = false;
      window.clearInterval(intervalId);
    };
  }, [router]);

  // Hapus sesi saat pengguna memilih keluar, lalu kembali ke halaman login.
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center font-sans">
      <div className="fixed top-10 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-gradient-to-tr from-amber-200/40 via-emerald-200/30 to-teal-200/30 dark:from-amber-950/20 dark:via-emerald-950/20 rounded-full blur-3xl -z-10 pointer-events-none" />

      <div className="bg-white dark:bg-slate-900 p-8 sm:p-10 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none max-w-md w-full border border-slate-200/80 dark:border-slate-800 relative overflow-hidden">
        
        {/* Ikon ini diberi animasi untuk menunjukkan proses peninjauan masih berjalan. */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-2xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 mb-6 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-2xl bg-amber-400 opacity-20"></span>
          <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
          Akun Dalam Peninjauan ⏳
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Pendaftaran akun Anda sedang ditinjau oleh tim <span className="font-semibold text-emerald-600 dark:text-emerald-400">PanganCerdas</span>. Proses validasi data biasanya memakan waktu maksimal 1x24 jam.
        </p>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 mb-6 text-left space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 font-bold">✓</span> Akun terdaftar di sistem
          </div>
          <div className="flex items-center gap-2">
            <span className="text-amber-500 font-bold">•</span> Verifikasi kelayakan oleh Admin
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">•</span> Akses Penuh Dashboard
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.location.reload()}
            className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            Cek Status Terbaru
          </button>

          <button
            onClick={handleLogout}
            className="w-full py-3 px-4 bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 font-semibold text-xs rounded-xl transition-all cursor-pointer"
          >
            Keluar / Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}