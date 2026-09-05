'use client';
import React, { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ThemeToggle } from '@/components/ThemeToggle';
import LogoPangan from '@/components/LogoPangan';

// Ikon kecil di halaman register dibuat sebagai komponen agar markup utama tetap rapi.
const IkonKembali = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
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
const IkonCentangBerhasil = () => (
  <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);
const AnimasiEkosistemPangan = () => {
  return (
    <div className="relative w-full py-8 px-4 bg-gradient-to-br from-emerald-50/50 via-teal-50/30 to-amber-50/40 dark:from-slate-800/50 dark:via-slate-800/30 dark:to-slate-900/40 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 overflow-hidden flex flex-col items-center justify-center min-h-[180px]">
      {/* Visual Pulsa Latar */}
      <div className="absolute w-32 h-32 bg-emerald-400/20 rounded-full blur-2xl animate-pulse" />

      {/* Node Ekosistem Berputar/Melayang */}
      <div className="relative z-10 flex items-center justify-center gap-4 sm:gap-8">
        {/* Node 1: Makanan / Merchant */}
        <div className="flex flex-col items-center animate-bounce-gentle" style={{ animationDelay: '0s' }}>
          <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2">Sisa Pangan</span>
        </div>

        {/* Panah Alur 1 */}
        <div className="text-emerald-500 animate-pulse">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Node Pusat: PanganCerdas Hub */}
        <div className="flex flex-col items-center animate-float">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 relative">
            <div className="absolute inset-0 rounded-3xl bg-emerald-400 animate-ping opacity-25" />
            <LogoPangan className="w-10 h-10" />
          </div>
          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-2">Zero Waste Hub</span>
        </div>

        {/* Panah Alur 2 */}
        <div className="text-emerald-500 animate-pulse">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>

        {/* Node 3: Dampak Sosial & Energi */}
        <div className="flex flex-col items-center animate-bounce-gentle" style={{ animationDelay: '1s' }}>
          <div className="w-12 h-12 rounded-2xl bg-teal-500 text-white flex items-center justify-center shadow-lg shadow-teal-500/30">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.684a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-2">Dampak Berkelanjutan</span>
        </div>
      </div>

      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-4 text-center">
        ⚡ Pendaftaran cepat! Peran & profil pengguna dikonfigurasi pada langkah <span className="text-emerald-600 dark:text-emerald-400 font-bold">Onboarding</span>.
      </p>
    </div>
  );
};

function KontenHalamanRegister() {
  const router = useRouter();
  // Semua nilai input disimpan dalam satu object supaya mudah dikirim saat daftar.
  const [formData, setFormData] = useState({
    namaLengkap: '',
    email: '',
    nomorTelepon: '',
    setujuSyarat: false,
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingGoogle, setLoadingGoogle] = useState<boolean>(false);
  const [pesanError, setPesanError] = useState<string>('');
  const [bukaModalSukses, setBukaModalSukses] = useState<boolean>(false);
  const [formComplete, setFormComplete] = useState(0);
  const [shakeError, setShakeError] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorMessage = searchParams.get('error');
    if (errorMessage) {
      setPesanError(decodeURIComponent(errorMessage));
    }
  }, [searchParams]);

  // Hitung kelengkapan form setiap kali ada input yang berubah.
  useEffect(() => {
    let complete = 0;
    if (formData.namaLengkap.length > 2) complete += 25;
    if (formData.email.includes('@')) complete += 25;
    if (formData.nomorTelepon.length >= 10) complete += 20;
    if (formData.setujuSyarat) complete += 30;
    setFormComplete(Math.min(complete, 100));
  }, [formData]);

  // Satu handler dipakai oleh semua input dengan nama field yang sesuai.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Buat akun dengan password sementara; password pengguna ditetapkan saat onboarding.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPesanError('');
    setShakeError(false);

    setLoading(true);
    try {
      // Role belum dipilih di sini; pengguna akan memilihnya saat onboarding.
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: `Onboarding-${crypto.randomUUID()}!`,
        options: {
          data: {
            full_name: formData.namaLengkap,
            phone_number: formData.nomorTelepon,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Simpan data dasar agar profil sudah tersedia sebelum onboarding selesai.
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: authData.user.id,
            nama_lengkap: formData.namaLengkap,
            nomor_telepon: formData.nomorTelepon,
            email: formData.email,
          },
        ]);

        if (profileError) {
          console.error('Error saat membuat data profil:', profileError.message);
        }
      }

      setBukaModalSukses(true);
    } catch (err: any) {
      setPesanError(err.message || 'Terjadi kesalahan saat mendaftar.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
    } finally {
      setLoading(false);
    }
  };

  // Pendaftaran Google dialihkan ke callback untuk menyelesaikan proses login.
  const handleRegisterGoogle = async () => {
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
      setPesanError(err.message || 'Gagal mendaftar dengan akun Google.');
      setShakeError(true);
      setTimeout(() => setShakeError(false), 500);
      setLoadingGoogle(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans antialiased transition-colors duration-300 relative overflow-hidden">
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(3deg); }
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
          from { opacity: 0; transform: translateY(-30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        @keyframes bounce-gentle {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 5s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-slideUp { animation: slideUp 0.5s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
        .animate-shake { animation: shake 0.5s ease-in-out; }
        .animate-bounce-gentle { animation: bounce-gentle 2.5s ease-in-out infinite; }
        .gradient-text {
          background: linear-gradient(120deg, #059669 0%, #0d9488 50%, #f59e0b 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .glass {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
      `}</style>

      {/* Header Navigation */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl mb-6 px-4 sm:px-0 flex items-center justify-between relative z-10" style={{ animation: 'slideDown 0.5s ease-out' }}>
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all duration-300"
        >
          <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 glass border border-slate-200 dark:border-slate-700 group-hover:scale-110 transition-transform">
            <IkonKembali />
          </div>
          <span className="hidden sm:inline">Kembali ke Beranda</span>
        </Link>
        <ThemeToggle ringkas={true} />
      </div>

      {/* Main Container */}
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl relative z-10" style={{ animation: 'slideUp 0.6s ease-out 0.1s both' }}>
        
        {/* Header */}
        <div className="text-center px-4 mb-6">
          <LogoPangan className="mb-4 h-14 w-14 drop-shadow-[0_8px_18px_rgba(16,185,129,0.35)]" />
          <h2 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
            Buat Akun <span className="gradient-text">PanganCerdas</span>
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
            Bergabunglah bersama kami untuk meminimalkan sisa pangan dan membangun ekosistem berkelanjutan.
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-4 mb-6">
          <div className="bg-white/60 dark:bg-slate-800/60 glass rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Progres Kelengkapan Form</span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formComplete}%</span>
            </div>
            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${formComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className={`bg-white/80 dark:bg-slate-900/80 glass py-8 px-6 shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/40 rounded-3xl sm:px-10 border border-slate-200/80 dark:border-slate-700/80 ${shakeError ? 'animate-shake' : ''}`}>
          
          {/* Error Message */}
          {pesanError && (
            <div className="mb-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium animate-slideDown flex items-start gap-3">
              <span className="flex-1">{pesanError}</span>
              <button onClick={() => setPesanError('')} className="text-red-500 hover:text-red-700">✕</button>
            </div>
          )}

          {/* Google OAuth Button */}
          <button
            type="button"
            onClick={handleRegisterGoogle}
            disabled={loadingGoogle || loading}
            className="group relative w-full py-4 px-4 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-sm font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed mb-6 cursor-pointer hover:-translate-y-0.5"
          >
            {loadingGoogle ? (
              <span>Mengarahkan ke Google...</span>
            ) : (
              <>
                <IkonGoogle />
                <span>Daftar Cepat dengan Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-3 items-center mb-6">
            <div className="flex-grow border-t-2 border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink mx-4 text-xs uppercase font-black text-slate-500 dark:text-slate-400 tracking-widest bg-white dark:bg-slate-900 px-3 py-1 rounded-full">
              atau isikan data akun
            </span>
            <div className="flex-grow border-t-2 border-slate-200 dark:border-slate-700"></div>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Component Animasi Interaktif Ekosistem (Pengganti Grid Role) */}
            <div className="mb-6">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-3">
                Ekosistem PanganCerdas
              </label>
              <AnimasiEkosistemPangan />
            </div>

            {/* Nama Lengkap */}
            <div>
              <label htmlFor="namaLengkap" className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                Nama Lengkap <span className="text-emerald-600 dark:text-emerald-400">*</span>
              </label>
              <input
                id="namaLengkap"
                name="namaLengkap"
                type="text"
                placeholder="Contoh: Ahmad Subagja"
                value={formData.namaLengkap}
                onChange={handleChange}
                required
                className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Email & Nomor Telepon */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="email" className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                  Email <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="nama@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
              <div>
                <label htmlFor="nomorTelepon" className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                  No. WhatsApp <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <input
                  id="nomorTelepon"
                  name="nomorTelepon"
                  type="tel"
                  placeholder="081234567890"
                  value={formData.nomorTelepon}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-white text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all"
                />
              </div>
            </div>

            {/* Checkbox Persetujuan */}
            <div className="flex items-start pt-2">
              <input
                id="setujuSyarat"
                name="setujuSyarat"
                type="checkbox"
                checked={formData.setujuSyarat}
                onChange={handleChange}
                required
                className="h-5 w-5 text-emerald-600 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 rounded-md focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="setujuSyarat" className="ml-3 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                Saya menyetujui <span className="font-bold text-emerald-600 dark:text-emerald-400 underline">Syarat & Ketentuan</span> serta <span className="font-bold text-emerald-600 dark:text-emerald-400 underline">Kebijakan Privasi</span> PanganCerdas.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || loadingGoogle || !formData.setujuSyarat}
              className="w-full py-4 px-4 text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 rounded-2xl shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Memproses Registrasi...</span>
              ) : (
                <>
                  <span>Lanjutkan proses Registerasi</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 border-t-2 border-slate-100 dark:border-slate-800 pt-6 text-center text-sm text-slate-600 dark:text-slate-400">
            Sudah memiliki akun?{' '}
            <Link href="/login" className="font-black text-emerald-600 dark:text-emerald-400 hover:underline">
              Masuk di sini
            </Link>
          </div>
        </div>
      </div>

      {/* Modal Sukses */}
      {bukaModalSukses && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-scaleIn">
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-6">
              <IkonCentangBerhasil />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Registrasi Berhasil!</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Link verifikasi telah dikirim ke <span className="font-bold text-emerald-600">{formData.email}</span>. Silakan verifikasi untuk melanjutkan ke tahap Onboarding.
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-lg transition-all"
            >
              Lanjut ke Halaman Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HalamanRegister() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Memuat...</div>}>
      <KontenHalamanRegister />
    </Suspense>
  );
}