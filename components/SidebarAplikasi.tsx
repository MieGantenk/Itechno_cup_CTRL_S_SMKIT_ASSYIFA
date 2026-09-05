'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import LogoPangan from '@/components/LogoPangan';
import { supabase } from '@/lib/supabase';
import { toAppRole, toDatabaseRole } from '@/lib/roles';
import { 
  LogOut, 
  X, 
  AlertTriangle, 
  Loader2, 
  CheckCircle2, 
  Shield, 
  ChevronRight, 
  Truck, 
  ReceiptText,
} from 'lucide-react';

// ============================================================
// Role disamakan dengan nilai pada kolom profiles.role dan middleware.
// ============================================================
export type RoleUser = 'admin' | 'merchant' | 'konsumen_panti' | 'konsumen_umum' | 'kurir' | 'pengolah_energi';

// ============================================================
// IKON SVG CUSTOM
// ============================================================
const IkonMenuToggle = ({ terbuka }: { terbuka: boolean }) => (
  <svg
    className={`w-6 h-6 transition-transform duration-500 ease-in-out ${terbuka ? 'rotate-180' : 'rotate-0'}`}
    fill="none" viewBox="0 0 24 24" stroke="currentColor"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
  </svg>
);

const IkonDashboard = () => (
  <svg className="w-6 h-6 md:w-6 md:h-6 min-w-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IkonKlasifikasi = () => (
  <svg className="w-6 h-6 md:w-6 md:h-6 min-w-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const IkonPeta = () => (
  <svg className="w-6 h-6 md:w-6 md:h-6 min-w-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

// ============================================================
// TIPE DATA & KONFIGURASI MENU ROLE
// ============================================================
interface ToastNotifikasi {
  id: number;
  tipe: 'sukses' | 'error' | 'info';
  judul: string;
  pesan: string;
}

interface ProfilUser {
  nama: string;
  email: string;
  inisial: string;
  role: RoleUser | null;
}

interface MenuItem {
  nama: string;
  href: string;
  ikon: React.ReactNode;
  roles: RoleUser[];
}

// Setiap role hanya menerima halaman yang menjadi bagian dari alur rolenya.
const DAFTAR_MENU: MenuItem[] = [
  { nama: 'Dashboard Admin', href: '/dashboard/admin', ikon: <Shield className="w-6 h-6 min-w-[24px]" />, roles: ['admin'] },
  { nama: 'Riwayat Transaksi', href: '/dashboard/admin/transaksi', ikon: <ReceiptText className="w-6 h-6 min-w-[24px]" />, roles: ['admin'] },
  { nama: 'Dashboard Merchant', href: '/dashboard/merchant', ikon: <IkonDashboard />, roles: ['merchant'] },
  { nama: 'Peta Spasial', href: '/peta', ikon: <IkonPeta />, roles: ['merchant'] },
  { nama: 'Klasifikasi Tier', href: '/tier', ikon: <IkonKlasifikasi />, roles: ['merchant'] },
  { nama: 'Dashboard Konsumen Panti', href: '/dashboard/konsumen_panti', ikon: <IkonDashboard />, roles: ['konsumen_panti'] },
  { nama: 'Dashboard Konsumen Umum', href: '/dashboard/konsumen_umum', ikon: <IkonDashboard />, roles: ['konsumen_umum'] },
  { nama: 'Dashboard Kurir', href: '/dashboard/kurir', ikon: <Truck className="w-6 h-6 min-w-[24px]" />, roles: ['kurir'] },
];

export default function SidebarAplikasi() {
  // State ini mengatur menu, modal logout, notifikasi, dan data user.
  const [terbuka, setTerbuka] = useState(true);
  const [bukaModalLogout, setBukaModalLogout] = useState(false);
  const [sedangLogout, setSedangLogout] = useState(false);
  const [daftarToast, setDaftarToast] = useState<ToastNotifikasi[]>([]);
  const [profilUser, setProfilUser] = useState<ProfilUser>({
    nama: 'Memuat...',
    email: '...',
    inisial: '...',
    role: null,
  });

  const pathname = usePathname();
  const router = useRouter();

  // Ambil profil dari Supabase agar menu yang muncul sesuai role user.
  useEffect(() => {
    const fetchProfilUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
          const userRole = toAppRole(profile?.role || user.user_metadata?.role);
          const safeRole = userRole && ['admin', 'merchant', 'konsumen_panti', 'konsumen_umum', 'kurir', 'pengolah_energi'].includes(userRole)
            ? userRole as RoleUser
            : null;
          const nama = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna';
          const email = user.email || '';
          const inisial = nama.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);

          setProfilUser({
            nama,
            email,
            inisial,
            role: safeRole,
          });
        }
      } catch (err) {
        console.error('Gagal memuat profil user:', err);
      }
    };
    fetchProfilUser();
  }, []);

  // User hanya melihat menu yang memang boleh diakses rolenya.
  const menuTersedia = profilUser.role
    ? DAFTAR_MENU.filter((item) => item.roles.includes(profilUser.role as RoleUser))
    : [];

  // Tampilkan nama role sesuai nilai yang tersimpan pada profiles.role di Supabase.
  const roleSupabase = profilUser.role ? toDatabaseRole(profilUser.role) : '...';

  const kirimToast = (tipe: ToastNotifikasi['tipe'], judul: string, pesan: string) => {
    const idBaru = Date.now() + Math.random();
    setDaftarToast((sebelumnya) => [...sebelumnya, { id: idBaru, tipe, judul, pesan }]);
    setTimeout(() => {
      setDaftarToast((sebelumnya) => sebelumnya.filter((t) => t.id !== idBaru));
    }, 4000);
  };

  // Logout memakai modal konfirmasi agar tidak terpencet tanpa sengaja.
  const prosesLogout = async () => {
    setSedangLogout(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      kirimToast('sukses', 'Logout Berhasil', 'Anda telah keluar dari akun PanganCerdas.');
      
      setTimeout(() => {
        router.push('/login');
      }, 800);
    } catch (err: any) {
      kirimToast('error', 'Gagal Logout', err.message || 'Terjadi kesalahan saat logout.');
      setSedangLogout(false);
      setBukaModalLogout(false);
    }
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideAtas { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideKanan { from { opacity: 0; transform: translateX(110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes skalaMasuk { from { opacity: 0; transform: scale(.92) translateY(8px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes kilau { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes denyutMerah { 0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,.5) } 50% { box-shadow: 0 0 0 8px rgba(239,68,68,0) } }
        .anim-fadeIn { animation: fadeIn .3s ease-out both }
        .anim-slideAtas { animation: slideAtas .5s cubic-bezier(.22,1,.36,1) both }
        .anim-slideKanan { animation: slideKanan .5s cubic-bezier(.22,1,.36,1) both }
        .anim-skalaMasuk { animation: skalaMasuk .4s cubic-bezier(.34,1.56,.64,1) both }
        .efek-kilau { background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.25) 50%, transparent 60%); background-size: 200% 100%; animation: kilau 3s linear infinite }
        .denyut-merah { animation: denyutMerah 2s ease-out infinite }
      `}</style>

      {/* TOAST NOTIFIKASI */}
      <div className="fixed top-5 right-5 z-[200] space-y-3 w-[min(92vw,380px)] pointer-events-none">
        {daftarToast.map((toast) => {
          const konfigurasi = {
            sukses: { Icon: CheckCircle2, warna: 'text-emerald-500', border: 'border-emerald-300 dark:border-emerald-700' },
            error: { Icon: X, warna: 'text-rose-500', border: 'border-rose-300 dark:border-rose-700' },
            info: { Icon: AlertTriangle, warna: 'text-blue-500', border: 'border-blue-300 dark:border-blue-700' },
          }[toast.tipe];
          return (
            <div key={toast.id} className={`anim-slideKanan bg-white dark:bg-slate-900 border ${konfigurasi.border} rounded-2xl p-4 shadow-2xl flex gap-3 pointer-events-auto`}>
              <div className={`p-2 h-fit rounded-xl bg-slate-100 dark:bg-slate-800 ${konfigurasi.warna}`}>
                <konfigurasi.Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">{toast.judul}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{toast.pesan}</p>
              </div>
              <button onClick={() => setDaftarToast((s) => s.filter((t) => t.id !== toast.id))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white h-fit cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* MODAL LOGOUT */}
      {bukaModalLogout && (
        <div 
          className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn"
          onClick={() => !sedangLogout && setBukaModalLogout(false)}
        >
          <div 
            className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative bg-gradient-to-br from-rose-500 via-red-500 to-orange-500 p-6 overflow-hidden">
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white relative">
                    <LogOut className="w-7 h-7" />
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full denyut-merah" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Konfirmasi</p>
                    <h3 className="text-xl font-black text-white tracking-tight">Keluar Akun?</h3>
                  </div>
                </div>
                <button 
                  onClick={() => !sedangLogout && setBukaModalLogout(false)}
                  disabled={sedangLogout}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all active:scale-90 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="relative p-6 space-y-5">
              <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Perhatian!</p>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Anda akan keluar dari sesi akun saat ini. Anda perlu login kembali untuk mengakses dashboard dan fitur PanganCerdas.
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-200 dark:border-slate-700">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-emerald-500" /> Data Anda Aman
                </p>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  Semua data produk surplus, riwayat transaksi, dan sertifikat ESG Anda tersimpan aman di cloud dan akan tersedia kembali saat Anda login.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setBukaModalLogout(false)}
                  disabled={sedangLogout}
                  className="flex-1 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={prosesLogout}
                  disabled={sedangLogout}
                  className="group relative flex-1 py-3.5 px-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-black text-sm rounded-2xl transition-all active:scale-[0.98] shadow-lg shadow-rose-500/30 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden"
                >
                  <span className="absolute inset-0 efek-kilau" />
                  {sedangLogout ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengeluarkan...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="w-5 h-5 group-hover:-translate-x-1 group-hover:-rotate-12 transition-transform" />
                      <span>Ya, Keluar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SIDEBAR UTAMA */}
      <aside
        className={`
          fixed bottom-0 left-0 w-full z-50 flex flex-row items-center justify-between px-4 py-2
          bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800
          md:sticky md:top-0 md:h-screen md:flex-col md:px-4 md:py-4 md:border-t-0 md:border-r
          transition-all duration-300 ease-in-out
          ${terbuka ? 'md:w-64' : 'md:w-20'}
        `}
      >
        <div className="flex md:flex-col w-full md:h-full">
          
          {/* HEADER DESKTOP */}
          <div className="hidden md:flex items-center justify-between mb-6 shrink-0">
            {terbuka && (
              <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="PanganCerdas">
                <LogoPangan className="h-10 w-10 shrink-0" />
                <span className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                  Pangan<span className="text-emerald-600 dark:text-emerald-400">Cerdas</span>
                </span>
              </Link>
            )}
            <button
              onClick={() => setTerbuka(!terbuka)}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title={terbuka ? 'Tutup Sidebar' : 'Buka Sidebar'}
            >
              <IkonMenuToggle terbuka={terbuka} />
            </button>
          </div>

          {/* MENU NAVIGASI DENGAN RENDER ROLE */}
          <nav className="flex flex-row justify-around w-full md:flex-col md:gap-1.5 md:justify-start shrink-0 overflow-x-auto md:overflow-visible">
            {menuTersedia.map((item) => {
              const aktif = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex flex-col md:flex-row items-center justify-center md:justify-start gap-1 md:gap-3 
                    p-2 md:px-3 md:py-3 rounded-xl transition-all shrink-0
                    ${
                      aktif
                        ? 'text-emerald-600 dark:text-emerald-400 md:bg-emerald-500 md:text-white md:shadow-md md:shadow-emerald-500/20'
                        : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 md:hover:bg-slate-100 md:dark:hover:bg-slate-800/60 md:hover:text-slate-900 md:dark:hover:text-white'
                    }
                  `}
                >
                  <div className={`${aktif ? 'bg-emerald-50 dark:bg-emerald-900/30 md:bg-transparent p-1.5 rounded-full md:p-0 md:rounded-none' : 'p-1.5 md:p-0'}`}>
                    {item.ikon}
                  </div>
                  <span 
                    className={`
                      text-[10px] md:text-sm font-semibold text-center md:text-left
                      md:${terbuka ? 'block' : 'hidden'}
                    `}
                  >
                    {item.nama}
                  </span>
                </Link>
              );
            })}
            
            {/* Theme Toggle (Mobile) */}
            <div className="flex md:hidden flex-col items-center justify-center p-2 gap-1 text-slate-500 dark:text-slate-400 shrink-0">
              <ThemeToggle ringkas={true} />
              <span className="text-[10px] font-semibold text-center">Tema</span>
            </div>

            {/* Logout Button (Mobile) */}
            <div className="flex md:hidden flex-col items-center justify-center p-2 gap-1 shrink-0">
              <button
                onClick={() => setBukaModalLogout(true)}
                className="group relative p-2 rounded-full bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 hover:border-rose-400 transition-all active:scale-90 cursor-pointer"
                title="Keluar dari Akun"
                aria-label="Tombol Logout"
              >
                <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 group-hover:-rotate-12 transition-transform" />
              </button>
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 text-center">Keluar</span>
            </div>
          </nav>

          <div className="hidden md:block flex-1" />

          {/* FOOTER DESKTOP */}
          <div className="hidden md:flex md:flex-col w-full gap-3 pt-4 border-t border-slate-200 dark:border-slate-800 shrink-0">
            
            {/* Mode Tampilan */}
            <div className="flex items-center justify-between">
              {terbuka && (
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Tampilan Mode
                </span>
              )}
              <ThemeToggle ringkas={!terbuka} />
            </div>

            {/* PROFIL USER TERMASUK ROLES */}
            <div className={`relative group/profil ${terbuka ? '' : 'flex justify-center'}`}>
              {terbuka ? (
                <Link 
                  href="/profil" 
                  className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200 dark:border-emerald-800/50 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all cursor-pointer group-hover/profil:shadow-lg group-hover/profil:shadow-emerald-500/10"
                >
                  <div className="relative shrink-0">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md">
                      {profilUser.inisial}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{profilUser.nama}</p>
                    </div>
                    {/* Badge Role */}
                    <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                      {roleSupabase}
                    </span>
                  </div>
                  
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover/profil:text-emerald-500 group-hover/profil:translate-x-1 transition-all shrink-0" />
                </Link>
              ) : (
                <Link 
                  href="/profil" 
                  className="relative group/avatar"
                >
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 flex items-center justify-center text-white font-black text-sm shadow-md hover:scale-110 transition-transform cursor-pointer">
                    {profilUser.inisial}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />
                  
                  <div className="absolute left-full ml-3 px-3 py-2 bg-slate-900 text-white rounded-xl opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl">
                    <p className="text-xs font-bold">{profilUser.nama} ({roleSupabase})</p>
                    <p className="text-[10px] text-slate-400">Lihat Profil</p>
                  </div>
                </Link>
              )}
            </div>

            {/* Logout Button (Desktop) */}
            {terbuka ? (
              <button
                onClick={() => setBukaModalLogout(true)}
                className="group relative flex items-center justify-center gap-2.5 w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-rose-500/10 to-red-500/10 dark:from-rose-950/40 dark:to-red-950/40 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 font-bold text-sm hover:from-rose-500 hover:to-red-600 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300 active:scale-[0.98] cursor-pointer overflow-hidden"
                aria-label="Keluar dari Akun"
              >
                <span className="absolute inset-0 efek-kilau opacity-0 group-hover:opacity-100" />
                <LogOut className="w-5 h-5 group-hover:-translate-x-1 group-hover:-rotate-12 transition-transform" />
                <span className="font-black">Keluar dari Akun</span>
              </button>
            ) : (
              <div className="relative group/tombol flex justify-center">
                <button
                  onClick={() => setBukaModalLogout(true)}
                  className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white hover:border-transparent hover:shadow-lg hover:shadow-rose-500/30 transition-all duration-300 active:scale-90 cursor-pointer"
                  aria-label="Keluar dari Akun"
                >
                  <LogOut className="w-5 h-5 group-hover/tombol:-translate-x-0.5 group-hover/tombol:-rotate-12 transition-transform" />
                </button>
                <span className="absolute left-full ml-3 px-2.5 py-1 bg-slate-900 text-white text-[10px] font-bold rounded-lg opacity-0 group-hover/tombol:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  Keluar Akun
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}