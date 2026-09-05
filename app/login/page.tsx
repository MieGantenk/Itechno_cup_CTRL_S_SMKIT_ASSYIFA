'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { resolveUserRole, toAppRole } from '@/lib/roles';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';
import LogoPangan from '@/components/LogoPangan';
import { ChartNoAxesCombined, MapPinned, PackageCheck } from 'lucide-react';

// Ikon dipisah menjadi komponen kecil supaya bagian form lebih mudah dibaca.
// ==========================================
// IKON SVG KOMPONEN
// ==========================================
const IkonKembali = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IkonGembok = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const IkonEmail = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);

const IkonMata = ({ terbuka }: { terbuka: boolean }) => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    {terbuka ? (
      <>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </>
    ) : (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    )}
  </svg>
);

const IkonGoogle = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const IkonShield = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IkonPanah = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const IkonCentang = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

function KontenHalamanLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lihatPassword, setLihatPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [pesanError, setPesanError] = useState('');
  const [sukses, setSukses] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [shakeError, setShakeError] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      setPesanError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPesanError('');
    setShakeError(false);
    
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      const user = signInData?.user;
      if (!user) {
        throw new Error('Sesi login tidak terbentuk. Silakan coba lagi.');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.warn('Gagal membaca role profil saat login:', profileError.message);
      }

      // Role bisa berasal dari profil atau metadata Auth, tergantung tahap akun.
      const role = resolveUserRole(
        profile?.role ?? null,
        user.user_metadata?.role ?? null,
        user.user_metadata?.app_role ?? null
      );

      const hasProfileRecord = Boolean(profile);
      const normalizedRole = role ? toAppRole(role) : undefined;

      const dashboardByRole: Record<string, string> = {
        admin: '/dashboard/admin',
        merchant: '/dashboard/merchant',
        kurir: '/dashboard/kurir',
        courier: '/dashboard/kurir',
        konsumen_umum: '/dashboard/konsumen_umum',
        pengolah_energi: '/dashboard/energi',
        konsumen_panti: '/dashboard/konsumen_panti',
      };

      const targetDashboard = hasProfileRecord && normalizedRole && (dashboardByRole[normalizedRole] || (normalizedRole === 'courier' ? '/dashboard/kurir' : ''))
        ? dashboardByRole[normalizedRole] || '/dashboard/kurir'
        : '/onboarding';

      setSukses(true);

      setTimeout(() => {
        window.location.href = targetDashboard;
      }, 1800);
    } catch (err: any) {
      setPesanError(err.message || 'Gagal masuk. Periksa kembali email dan kata sandi Anda.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginGoogle = async () => {
    setLoadingGoogle(true);
    setPesanError('');
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setPesanError(err.message || 'Gagal terhubung dengan akun Google.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col relative overflow-hidden transition-colors duration-300 selection:bg-emerald-500 selection:text-white">
      
      {/* Gaya global untuk animasi dan elemen dekorasi halaman. */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-glow {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes typing {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-8px); opacity: 1; }
        }
        @keyframes confetti-fall {
          0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes success-check {
          0% { transform: scale(0) rotate(-45deg); opacity: 0; }
          50% { transform: scale(1.2) rotate(0deg); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes ping-ring {
          0% { transform: scale(1); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes border-orbit {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes panel-breathe {
          0%, 100% { box-shadow: 0 30px 90px -45px rgba(15, 118, 110, 0.34), 0 0 0 1px rgba(148, 163, 184, 0.16); }
          50% { box-shadow: 0 36px 110px -42px rgba(5, 150, 105, 0.48), 0 0 0 1px rgba(45, 212, 191, 0.28); }
        }
        @keyframes feature-line {
          0%, 100% { opacity: .25; transform: scaleX(.7); transform-origin: left; }
          50% { opacity: .75; transform: scaleX(1); transform-origin: left; }
        }
        @keyframes ticker {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-slideDown { animation: slideDown 0.4s ease-out; }
        .animate-slideInLeft { animation: slideInLeft 0.6s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-blob { animation: blob 10s ease-in-out infinite; }
        .animate-pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
        .animate-typing-1 { animation: typing 1.4s infinite; animation-delay: 0s; }
        .animate-typing-2 { animation: typing 1.4s infinite; animation-delay: 0.2s; }
        .animate-typing-3 { animation: typing 1.4s infinite; animation-delay: 0.4s; }
        .animate-confetti { animation: confetti-fall 3s ease-in forwards; }
        .animate-success-check { animation: success-check 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); }
        .animate-ping-ring { animation: ping-ring 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-ticker { animation: ticker 30s linear infinite; }
        .login-panel-breathe { animation: panel-breathe 7s ease-in-out infinite; }
        .login-border-orbit { animation: border-orbit 18s linear infinite; }
        .feature-line { animation: feature-line 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .login-panel-breathe, .login-border-orbit, .feature-line { animation: none; }
        }
        .gradient-text {
          background: linear-gradient(120deg, #059669 0%, #0d9488 50%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 6s ease infinite;
        }
        .shine-effect {
          background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shine 3s linear infinite;
        }
        .glass {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.08) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.03;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
        /* Custom checkbox styling */
        .custom-checkbox {
          position: relative;
          appearance: none;
          width: 20px;
          height: 20px;
          border: 2px solid rgb(203 213 225);
          border-radius: 6px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .dark .custom-checkbox {
          background: rgb(30 41 59);
          border-color: rgb(51 65 85);
        }
        .custom-checkbox:checked {
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border-color: transparent;
        }
        .custom-checkbox:checked::after {
          content: '';
          position: absolute;
          left: 5px;
          top: 1px;
          width: 5px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }
        .custom-checkbox:focus {
          outline: none;
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.2);
        }
      `}</style>

      {/* Hiasan latar yang bergerak mengikuti posisi mouse. */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
          style={{ transform: `translate(calc(-50% + ${mousePos.x}px), calc(-50% + ${mousePos.y}px))` }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/30 via-teal-200/20 to-amber-200/30 dark:from-emerald-900/20 dark:via-teal-900/10 dark:to-amber-900/20 animate-blob blur-3xl" />
          <div className="absolute inset-10 bg-gradient-to-bl from-amber-300/20 via-teal-200/10 to-emerald-200/20 dark:from-amber-900/10 dark:via-teal-900/5 dark:to-emerald-900/10 animate-blob blur-3xl" style={{ animationDelay: '-3s' }} />
        </div>
        <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-900/10 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 right-10 w-80 h-80 bg-amber-300/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-float" />
        <div className="absolute inset-0 noise-overlay" />
      </div>

      {/* Navigasi atas dibuat konsisten dengan halaman register. */}
      <header className="relative z-20 p-4 sm:p-6 max-w-7xl w-full mx-auto flex items-center justify-between" style={{ animation: 'slideDown 0.5s ease-out' }}>
        <Link href="/" className="flex items-center gap-3 group">
          <LogoPangan className="h-10 w-10 drop-shadow-[0_4px_10px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-110" />
          <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Pangan<span className="text-emerald-600 dark:text-emerald-400">Cerdas</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Tombol untuk kembali ke halaman utama. */}
          <Link
            href="/"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
          >
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 glass border border-slate-200 dark:border-slate-700 group-hover:scale-110 group-hover:border-emerald-500/50 transition-all">
              <IkonKembali />
            </div>
            <span className="hidden sm:inline">Kembali ke Beranda</span>
          </Link>
          <ThemeToggle ringkas={true} />
        </div>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-12 relative z-10">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
          
          {/* Sisi kiri berisi identitas dan gambaran singkat aplikasi. */}
          <div className="hidden lg:block space-y-8" style={{ animation: 'slideInLeft 0.7s ease-out 0.1s both' }}>
            
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 glass border border-slate-200/80 dark:border-slate-700/80">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
                Portal Mitra Terverifikasi
              </span>
            </div>

            {/* Headline */}
            <div className="space-y-4">
              <h1 className="text-5xl xl:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
                Selamat Datang <br />
                <span className="gradient-text">Kembali!</span>
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                Lanjutkan misi Anda menyelamatkan kota dari limbah makanan. Satu login, semua ekosistem tersinkronisasi.
              </p>
            </div>

            {/* Feature Highlights */}
            <div className="space-y-4 pt-4">
              {[
                { icon: PackageCheck, title: 'Akses Tier 1, 2, & 3', desc: 'Kelola semua alur sisa pangan dalam satu dashboard', iconClass: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300', dotClass: 'bg-emerald-500' },
                { icon: ChartNoAxesCombined, title: 'Analitik Real-time', desc: 'Monitor dampak ESG dan konversi biogas instan', iconClass: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300', dotClass: 'bg-cyan-500' },
                { icon: MapPinned, title: 'Peta Live Interaktif', desc: 'Koordinasi kurir dan panti dalam jaringan mitra', iconClass: 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-300', dotClass: 'bg-amber-500' },
              ].map((item, i) => {
                const FeatureIcon = item.icon;
                return (
                <div 
                  key={i}
                  className="group relative flex items-start gap-4 overflow-hidden rounded-2xl border border-slate-200/60 bg-white/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/50 hover:bg-white/60 dark:border-slate-700/60 dark:bg-slate-800/40 dark:hover:bg-slate-800/60"
                  style={{ animation: `slideUp 0.5s ease-out ${0.3 + i * 0.1}s both` }}
                >
                  <div className={`relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border transition-transform group-hover:scale-105 ${item.iconClass}`}>
                    <FeatureIcon className="h-6 w-6" strokeWidth={1.8} />
                    <span className={`absolute -bottom-1 -right-1 h-2 w-2 rounded-full shadow-[0_0_12px_currentColor] ${item.dotClass}`} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white mb-1">{item.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                    <span className="feature-line mt-2 block h-px w-16 bg-gradient-to-r from-emerald-500/70 to-transparent" />
                  </div>
                </div>
                );
              })}
            </div>

            {/* Testimonial */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
              <div className="relative">
                <div className="flex gap-1 text-amber-400 mb-3 text-lg">★★★★★</div>
                <p className="text-sm leading-relaxed mb-4 text-slate-200 italic">
                  "PanganCerdas mengubah sisa dapur restoran kami menjadi revenue tambahan. Dashboard analytics-nya sangat jelas dan membantu pengambilan keputusan bisnis."
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center font-black text-sm">
                    RB
                  </div>
                  <div>
                    <p className="font-bold text-sm">Rizki Budiman</p>
                    <p className="text-xs text-slate-400">Owner, Restoran Nusantara</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sisi kanan berisi form login yang digunakan pengguna. */}
          <div style={{ animation: 'slideInRight 0.7s ease-out 0.2s both' }}>
            <div className={`group/login-panel relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-8 shadow-2xl shadow-slate-200/60 dark:border-slate-700/80 dark:bg-slate-900/80 dark:shadow-slate-950/40 sm:p-10 login-panel-breathe ${shakeError ? 'animate-shake' : ''}`}>
              <div className="pointer-events-none absolute -inset-px rounded-3xl opacity-80">
                <div className="login-border-orbit absolute -left-1/2 -top-1/2 h-[200%] w-[200%] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0deg,transparent_300deg,rgba(20,184,166,.75)_330deg,rgba(245,158,11,.55)_350deg,transparent_360deg)]" />
              </div>
              <div className="pointer-events-none absolute inset-px rounded-[23px] bg-white/90 dark:bg-slate-900/90" />
              
              {/* Decorative gradient corner */}
              <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-emerald-500/10 to-teal-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-500/10 to-orange-500/10 blur-3xl pointer-events-none" />

              {/* Lapisan ini muncul sebentar setelah login berhasil. */}
              {sukses && (
                <div className="absolute inset-0 z-20 bg-white/95 dark:bg-slate-900/95 glass flex flex-col items-center justify-center rounded-3xl animate-fadeIn">
                  {/* Hiasan confetti menandai login berhasil. */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {[...Array(40)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 animate-confetti"
                        style={{
                          left: `${Math.random() * 100}%`,
                          backgroundColor: ['#10b981', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                          animationDelay: `${Math.random() * 1}s`,
                          animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                      />
                    ))}
                  </div>
                  <div className="relative">
                    <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-6 relative">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/30 animate-ping-ring" />
                      <div className="relative animate-success-check text-emerald-600 dark:text-emerald-400">
                        <svg className="w-14 h-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white text-center mb-2">
                      Login Berhasil! 🎉
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center mb-4">
                      Mengarahkan ke Dashboard...
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-typing-1" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-typing-2" />
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-typing-3" />
                    </div>
                  </div>
                </div>
              )}

              {/* Header */}
              <div className="text-center space-y-2 mb-8 relative z-10">
                <LogoPangan className="mx-auto mb-3 block h-14 w-14 drop-shadow-[0_8px_18px_rgba(16,185,129,0.35)]" />
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  Selamat Datang Kembali
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Masuk ke akun ekosistem <span className="font-bold text-slate-700 dark:text-slate-300">PanganCerdas</span> Anda
                </p>
              </div>

              {/* Error Message */}
              {pesanError && !sukses && (
                <div className="mb-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium animate-slideDown flex items-start gap-3 relative z-10">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <span className="flex-1">{pesanError}</span>
                  <button onClick={() => setPesanError('')} className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {/* Pilihan login cepat menggunakan akun Google. */}
              <button
                type="button"
                onClick={handleLoginGoogle}
                disabled={loadingGoogle || loading}
                className="group relative w-full py-4 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl shadow-lg shadow-slate-200/50 dark:shadow-slate-950/50 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mb-6 cursor-pointer hover:-translate-y-0.5 hover:shadow-xl relative z-10 overflow-hidden"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-emerald-500/5 via-teal-500/5 to-amber-500/5" />
                {loadingGoogle ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Mengarahkan ke Google...</span>
                  </span>
                ) : (
                  <>
                    <IkonGoogle />
                    <span>Masuk dengan Google</span>
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative flex py-2 items-center mb-6 relative z-10">
                <div className="flex-grow border-t-2 border-slate-200 dark:border-slate-700"></div>
                <span className="flex-shrink mx-4 text-xs uppercase font-black text-slate-500 dark:text-slate-400 tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full">
                  atau via email
                </span>
                <div className="flex-grow border-t-2 border-slate-200 dark:border-slate-700"></div>
              </div>

              <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                  {/* Email akun yang akan digunakan untuk login. */}
                <div style={{ animation: 'slideUp 0.5s ease-out 0.1s both' }}>
                  <label htmlFor="email" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-2">
                    Email Bisnis / Panti
                  </label>
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300`} />
                    <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl transition-all group-focus-within:border-emerald-500 group-focus-within:bg-white dark:group-focus-within:bg-slate-800">
                      <span className={`pl-4 transition-colors ${focusedField === 'email' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <IkonEmail />
                      </span>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="nama@mitra.com"
                        className="w-full px-3 py-3.5 bg-transparent text-slate-900 dark:text-white text-sm font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Kata sandi akun, bisa ditampilkan atau disembunyikan. */}
                <div style={{ animation: 'slideUp 0.5s ease-out 0.2s both' }}>
                  <div className="flex justify-between items-center mb-2">
                    <label htmlFor="password" className="block text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                      Kata Sandi
                    </label>
                    <Link href="#lupa-password" className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
                      Lupa Kata Sandi?
                    </Link>
                  </div>
                  <div className="relative group">
                    <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300`} />
                    <div className="relative flex items-center bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl transition-all group-focus-within:border-emerald-500 group-focus-within:bg-white dark:group-focus-within:bg-slate-800">
                      <span className={`pl-4 transition-colors ${focusedField === 'password' ? 'text-emerald-500' : 'text-slate-400'}`}>
                        <IkonGembok />
                      </span>
                      <input
                        id="password"
                        type={lihatPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                        placeholder="••••••••••••"
                        className="w-full px-3 py-3.5 bg-transparent text-slate-900 dark:text-white text-sm font-medium focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setLihatPassword(!lihatPassword)}
                        className="pr-4 text-slate-400 hover:text-emerald-500 transition-colors cursor-pointer focus:outline-none"
                        aria-label="Toggle Kata Sandi"
                      >
                        <IkonMata terbuka={lihatPassword} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pilihan agar sesi login tetap diingat selama 30 hari. */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2.5 cursor-pointer group" style={{ animation: 'slideUp 0.5s ease-out 0.25s both' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="custom-checkbox"
                    />
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors select-none">
                      Ingat saya 30 hari
                    </span>
                  </label>
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <IkonShield />
                    <span>SSL Secure</span>
                  </div>
                </div>

                {/* Kirim email dan password ke proses login. */}
                <div style={{ animation: 'slideUp 0.5s ease-out 0.3s both' }}>
                  <button
                    type="submit"
                    disabled={loading || loadingGoogle || sukses}
                    className="group relative w-full py-4 px-6 text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 rounded-2xl shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 flex items-center justify-center gap-2 cursor-pointer overflow-hidden"
                  >
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shine-effect" />
                    {loading ? (
                      <>
                        <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Memverifikasi Keamanan...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Akun</span>
                        <IkonPanah />
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 relative z-10">
                <div className="flex items-center gap-1.5">
                  <IkonShield />
                  <span>End-to-End</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Supabase Auth</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <div className="flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <span>ISO 27001</span>
                </div>
              </div>

              {/* Link untuk pengguna yang belum memiliki akun. */}
              <div className="mt-6 text-center text-sm text-slate-600 dark:text-slate-400 relative z-10">
                Belum memiliki akun?{' '}
                <Link href="/register" className="font-black text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 underline underline-offset-2 transition-colors">
                  Daftar Sekarang
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-6 text-center text-xs text-slate-400 dark:text-slate-500">
        © 2026 PanganCerdas SaaS · Sistem Keamanan Multi-Layer Berstandar Enterprise
      </footer>
    </div>
  );
}

export default function HalamanLogin() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
            <LogoPangan className="mx-auto mb-4 block h-16 w-16 drop-shadow-[0_8px_18px_rgba(16,185,129,0.35)] animate-pulse" />
          <p className="text-slate-600 dark:text-slate-400 font-semibold">Memuat halaman login...</p>
        </div>
      </div>
    }>
      <KontenHalamanLogin />
    </Suspense>
  );
}