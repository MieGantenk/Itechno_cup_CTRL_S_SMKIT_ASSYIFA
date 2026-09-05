'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { toDatabaseRole } from '@/lib/roles';

// Pilihan role yang tampil di form, termasuk aturan akses awalnya.
const ROLES = [
  {
    id: 'merchant',
    title: 'Merchant & Mitra Kuliner',
    desc: 'Restoran, cafe, bakery, atau hotel yang ingin mengelola sisa makanan layak konsumsi.',
    badge: 'Butuh Verifikasi',
    gradien: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    bgDark: 'bg-amber-950/20',
    borderLight: 'border-amber-200',
    borderDark: 'border-amber-800/50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'konsumen_umum',
    title: 'Konsumen Umum / Individu',
    desc: 'Masyarakat umum yang ingin membeli makanan hemat & penyelamat pangan (rescue food).',
    badge: 'Akses Langsung',
    gradien: 'from-blue-500 to-indigo-600',
    bgLight: 'bg-blue-50',
    bgDark: 'bg-blue-950/20',
    borderLight: 'border-blue-200',
    borderDark: 'border-blue-800/50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'konsumen_panti',
    title: 'Penerima Manfaat / Panti',
    desc: 'Panti asuhan, komunitas sosial, atau perorangan yang membutuhkan bantuan pangan gratis.',
    badge: 'Akses Langsung',
    gradien: 'from-emerald-500 to-teal-600',
    bgLight: 'bg-emerald-50',
    bgDark: 'bg-emerald-950/20',
    borderLight: 'border-emerald-200',
    borderDark: 'border-emerald-800/50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
  {
    id: 'pengolah_energi',
    title: 'Pengolah Limbah & Energi',
    desc: 'Mitra pengolah sampah organik menjadi biogas, kompos, atau budidaya maggot BSF.',
    badge: 'Akses Langsung',
    gradien: 'from-cyan-500 to-blue-600',
    bgLight: 'bg-cyan-50',
    bgDark: 'bg-cyan-950/20',
    borderLight: 'border-cyan-200',
    borderDark: 'border-cyan-800/50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'kurir',
    title: 'Kurir Relawan & Penjemput',
    desc: 'Tim lapangan yang membantu proses penjemputan dan distribusi bantuan makanan.',
    badge: 'Butuh Verifikasi',
    gradien: 'from-purple-500 to-pink-600',
    bgLight: 'bg-purple-50',
    bgDark: 'bg-purple-950/20',
    borderLight: 'border-purple-200',
    borderDark: 'border-purple-800/50',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
      </svg>
    ),
  },
];

type UserProfile = {
  id: string;
  email?: string | null;
  user_metadata?: {
    full_name?: string;
    nama_lengkap?: string;
    phone?: string;
    nomor_telepon?: string;
    role?: string;
    [key: string]: unknown;
  };
};

export default function OnboardingPage() {
  const router = useRouter();
  // Data user dipakai untuk mengisi form dan menentukan profil yang disimpan.
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  // Onboarding dimulai dalam mode terang.
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Data yang diisi pengguna sebelum profil dikirim ke Supabase.
  const [formData, setFormData] = useState({
    role: 'merchant',
    namaLengkap: '',
    namaInstansi: '',
    nomorTelepon: '',
    kataKunci: '',
    konfirmasiKataKunci: '',
    alamatLengkap: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  // Persentase ini hanya untuk memberi gambaran seberapa lengkap formnya.
  const [formComplete, setFormComplete] = useState(0);

  useEffect(() => {
    // Setiap bagian form menyumbang nilai yang berbeda ke progress bar.
    let complete = 0;
    if (formData.role) complete += 15;
    if (formData.namaLengkap.length > 2) complete += 15;
    if ((formData.role === 'merchant' || formData.role === 'pengolah_energi') && formData.namaInstansi.length > 2) complete += 15;
    else if (formData.namaInstansi.length > 2) complete += 15;
    if (formData.nomorTelepon.length >= 10) complete += 15;
    if (formData.kataKunci.length >= 8 && formData.kataKunci === formData.konfirmasiKataKunci) complete += 20;
    if (formData.alamatLengkap.length > 10) complete += 20;
    setFormComplete(Math.min(complete, 100));
  }, [formData]);

  // Ambil data akun yang sedang login dan isi beberapa field secara otomatis.
  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Gunakan data dari proses register agar pengguna tidak perlu mengetik ulang.
      const meta = user.user_metadata || {};
      setFormData((prev) => ({
        ...prev,
        role: meta.role || prev.role,
        namaLengkap: meta.full_name || meta.nama_lengkap || prev.namaLengkap,
        nomorTelepon: meta.phone || meta.nomor_telepon || prev.nomorTelepon,
      }));

      setLoading(false);
    }
    loadUser();
  }, [router]);

  // Handler ini dipakai bersama oleh input teks, pilihan role, dan alamat.
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Simpan role yang dipilih pada form.
  const handleRoleSelect = (roleId: string) => {
    setFormData((prev) => ({ ...prev, role: roleId }));
  };

  // Ambil koordinat perangkat, lalu ubah koordinat itu menjadi alamat yang mudah dibaca.
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setErrorMsg('Browser Anda tidak mendukung fitur deteksi lokasi.');
      return;
    }

    setGettingLocation(true);
    setErrorMsg('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        setFormData((prev) => ({
          ...prev,
          latitude,
          longitude,
        }));

        try {
          // Nominatim mencari nama jalan dan wilayah dari koordinat GPS.
          const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1&accept-language=id`;
          const response = await fetch(reverseUrl, {
            headers: {
              Accept: 'application/json',
              'Accept-Language': 'id-ID',
            },
          });

          if (!response.ok) {
            throw new Error(`Reverse geocoding gagal: ${response.status}`);
          }

          const data = await response.json();

          const address =
            data?.display_name ||
            [
              data?.address?.road,
              data?.address?.village,
              data?.address?.suburb,
              data?.address?.city,
              data?.address?.state,
              data?.address?.country,
            ]
              .filter(Boolean)
              .join(', ') ||
            `Lokasi GPS: ${latitude}, ${longitude}`;

          setFormData((prev) => ({
            ...prev,
            alamatLengkap: address,
          }));
        } catch {
          setFormData((prev) => ({
            ...prev,
            alamatLengkap: `Lokasi GPS: ${latitude}, ${longitude}`,
          }));
          setErrorMsg(
            'Lokasi berhasil dideteksi, tetapi alamat lengkap tidak bisa ditarik otomatis. Koordinat Anda sudah diisi sebagai cadangan.'
          );
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        setGettingLocation(false);

        if (error.code === error.PERMISSION_DENIED) {
          setErrorMsg('Izin lokasi ditolak. Mohon izinkan akses lokasi di browser Anda, lalu klik tombol ini lagi.');
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          setErrorMsg('Lokasi tidak tersedia. Pastikan GPS atau Wi‑Fi aktif, lalu coba lagi.');
        } else if (error.code === error.TIMEOUT) {
          setErrorMsg('Waktu pencarian lokasi habis. Coba lagi dalam beberapa saat.');
        } else {
          setErrorMsg('Gagal mendapatkan lokasi saat ini. Pastikan GPS aktif dan coba lagi.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
      }
    );
  };

  // Periksa profil lama, lalu pilih update atau insert sesuai hasilnya.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    if (!user) {
      setErrorMsg('Sesi pengguna tidak ditemukan. Silakan login ulang.');
      setSubmitting(false);
      return;
    }

    if (formData.kataKunci.length < 8) {
      setErrorMsg('Kata sandi minimal harus 8 karakter.');
      setSubmitting(false);
      return;
    }

    if (formData.kataKunci !== formData.konfirmasiKataKunci) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      setSubmitting(false);
      return;
    }

    // Merchant dan kurir perlu menunggu persetujuan admin; role lain bisa langsung aktif.
    const statusAwal = formData.role === 'merchant' || formData.role === 'kurir' ? 'pending' : 'active';
    const databaseRole = toDatabaseRole(formData.role);

    // Bentuk data disamakan dengan kolom yang ada di tabel profiles.
    const profilePayload = {
      id: user.id,
      email: user.email,
      role: databaseRole,
      nama_lengkap: formData.namaLengkap,
      nama_instansi: formData.namaInstansi || null,
      nomor_telepon: formData.nomorTelepon,
      alamat: formData.alamatLengkap || null,
      latitude: formData.latitude ?? null,
      longitude: formData.longitude ?? null,
      status: statusAwal,
      updated_at: new Date().toISOString(),
    };

    try {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: formData.kataKunci,
      });

      if (passwordError) {
        throw new Error(`Gagal menyimpan kata sandi: ${passwordError.message}`);
      }

      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error(fetchError.message);
      }

      // Profil yang sudah ada diperbarui, sedangkan profil baru dibuat.
      let saveError: Error | null = null;

      if (existingProfile) {
        const { error } = await supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', user.id);

        saveError = error ? new Error(error.message) : null;
      } else {
        const { error } = await supabase
          .from('profiles')
          .insert([profilePayload]);

        saveError = error ? new Error(error.message) : null;
      }

      if (saveError) {
        const message = saveError.message.toLowerCase();
        const isPolicyError =
          message.includes('infinite recursion') ||
          message.includes('policy') ||
          message.includes('rls') ||
          message.includes('permission denied');

        const isMissingColumnError =
          message.includes('does not exist') ||
          message.includes('column') ||
          message.includes('no such column');

        if (isPolicyError) {
          throw new Error(
            `${saveError.message}. Masalah ini biasanya berasal dari policy RLS tabel profiles di Supabase yang saling memanggil diri sendiri.`
          );
        }

        if (isMissingColumnError) {
          throw new Error(
            `${saveError.message}. Pastikan kolom di tabel profiles sesuai dengan payload yang dikirim.`
          );
        }

        throw saveError;
      }

      // Simpan juga ringkasan data di metadata Auth untuk kebutuhan login berikutnya.
      await supabase.auth.updateUser({
        data: {
          full_name: formData.namaLengkap,
          role: formData.role,
          onboarding_completed: true,
        },
      });

      setSuccessMsg(true);

      // Arah tujuan setelah onboarding bergantung pada role dan status akun.
      setTimeout(() => {
        if (statusAwal === 'pending') {
          router.push('/pending');
        } else if (formData.role === 'konsumen_umum') {
          router.push('/dashboard/konsumen_umum');
        } else if (formData.role === 'konsumen_panti') {
          router.push('/dashboard/konsumen_panti');
        } else if (formData.role === 'pengolah_energi') {
          router.push('/dashboard/energi');
        } else if (formData.role === 'kurir') {
          router.push('/dashboard/kurir');
        } else {
          router.push('/dashboard');
        }
      }, 2500);

      return;
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Ada kendala saat menyimpan data. Coba lagi sebentar.';

      console.error('Detail Error Onboarding:', err);
      setErrorMsg(`Gagal menyimpan profil: ${message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center font-sans transition-colors duration-500 ease-in-out ${isDarkMode ? 'bg-slate-950 text-slate-300' : 'bg-slate-50 text-slate-600'}`}>
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium">Memverifikasi akun Anda...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={isDarkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 selection:bg-emerald-500 selection:text-white font-sans antialiased transition-colors duration-300 relative overflow-hidden">
        
        {/* Gaya global untuk animasi halaman onboarding. */}
        <style jsx global>{`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-20px) rotate(5deg); }
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
          @keyframes pulse-ring {
            0% { transform: scale(0.95); opacity: 1; }
            100% { transform: scale(1.5); opacity: 0; }
          }
          @keyframes confetti-fall {
            0% { transform: translateY(-100vh) rotate(0deg); opacity: 1; }
            100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
          }
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
          @keyframes shine {
            0% { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
          @keyframes blob {
            0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
          }
          @keyframes progress-fill {
            from { width: 0%; }
          }
          @keyframes bounce-gentle {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-5px); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
          .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
          .animate-slideUp { animation: slideUp 0.5s ease-out; }
          .animate-slideDown { animation: slideDown 0.5s ease-out; }
          .animate-scaleIn { animation: scaleIn 0.4s ease-out; }
          .animate-shake { animation: shake 0.5s ease-in-out; }
          .animate-blob { animation: blob 8s ease-in-out infinite; }
          .animate-confetti { animation: confetti-fall 3s ease-in forwards; }
          .animate-bounce-gentle { animation: bounce-gentle 2s ease-in-out infinite; }
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
        `}</style>

        {/* Hiasan latar yang tidak mengganggu isi form. */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-96 h-96 bg-emerald-300/20 dark:bg-emerald-900/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-10 w-80 h-80 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-2s' }} />
          <div className="absolute bottom-20 left-1/2 w-72 h-72 bg-amber-300/20 dark:bg-amber-900/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-4s' }} />
          <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-purple-300/10 dark:bg-purple-900/5 rounded-full blur-3xl animate-float-slow" />
        </div>

        {/* Header Navigation */}
        <div className="sm:mx-auto sm:w-full sm:max-w-3xl mb-6 px-4 sm:px-0 flex items-center justify-between relative z-10" style={{ animation: 'slideDown 0.5s ease-out' }}>
          <div className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            <div className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 glass border border-slate-200 dark:border-slate-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <span className="hidden sm:inline">PanganCerdas Onboarding</span>
          </div>
          <button
            type="button"
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="px-3.5 py-2 rounded-full bg-white/60 dark:bg-slate-800/60 glass border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-300 ease-in-out text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm active:scale-95"
            title="Ubah Tema"
          >
            <span className={`inline-block transition-transform duration-500 ease-in-out ${isDarkMode ? 'rotate-180' : 'rotate-0'}`}>
              {isDarkMode ? '🌙' : '☀️'}
            </span>
            <span>{isDarkMode ? 'Gelap' : 'Terang'}</span>
          </button>
        </div>

        {/* Main Container */}
        <div className="sm:mx-auto sm:w-full sm:max-w-3xl relative z-10" style={{ animation: 'slideUp 0.6s ease-out 0.1s both' }}>
          
          {/* Header */}
          <div className="text-center px-4 mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 text-white shadow-xl shadow-emerald-500/30 mb-4 relative group">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-amber-500 blur-xl opacity-60 group-hover:opacity-90 transition-opacity" />
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
              Lengkapi Profil <span className="gradient-text">PanganCerdas</span>
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
              Terhubung sebagai <span className="text-emerald-600 dark:text-emerald-400 font-medium">{user?.email}</span>. Lengkapi profil untuk memulai.
            </p>
          </div>

          {/* Progress Bar */}
          <div className="px-4 mb-6">
            <div className="bg-white/60 dark:bg-slate-800/60 glass rounded-2xl p-4 border border-slate-200/80 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Progres Onboarding</span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">{formComplete}%</span>
              </div>
              <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-amber-500 rounded-full transition-all duration-500 ease-out relative"
                  style={{ width: `${formComplete}%` }}
                >
                  <div className="absolute inset-0 shine-effect" />
                </div>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white/80 dark:bg-slate-900/80 glass py-8 px-6 shadow-2xl shadow-slate-200/60 dark:shadow-slate-950/40 rounded-3xl sm:px-10 border border-slate-200/80 dark:border-slate-700/80">
            
            {/* Error Message */}
            {errorMsg && (
              <div className="mb-6 p-4 rounded-2xl bg-red-50/80 dark:bg-red-950/40 border-2 border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm font-medium animate-slideDown flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <span className="flex-1">{errorMsg}</span>
                <button onClick={() => setErrorMsg('')} className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Opsi Role */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.1s both' }}>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-3">
                  Pilih Jenis Peran Anda <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {ROLES.map((r) => {
                    const isSelected = formData.role === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => handleRoleSelect(r.id)}
                        className={`group relative p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-left ${
                          isSelected
                            ? `${r.bgLight} dark:${r.bgDark} ${r.borderLight} dark:${r.borderDark} shadow-lg scale-105`
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md'
                        }`}
                      >
                        {isSelected && (
                          <div className={`absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br ${r.gradien} flex items-center justify-center`}>
                            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${r.gradien} flex items-center justify-center text-white mb-2 group-hover:scale-110 transition-transform ${isSelected ? 'scale-110' : ''}`}>
                          {r.icon}
                        </div>
                        <div className="flex justify-between items-start mb-1">
                          <h3 className="text-sm font-black text-slate-900 dark:text-white">
                            {r.title}
                          </h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                          {r.desc}
                        </p>
                        <div className={`mt-2 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          isSelected ? 'bg-white/60 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}>
                          {r.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ animation: 'slideUp 0.4s ease-out 0.15s both' }}>
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    Nama Lengkap <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="namaLengkap"
                      value={formData.namaLengkap}
                      onChange={handleChange}
                      required
                      placeholder="Contoh: Budi Santoso"
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    />
                    {formData.namaLengkap.length > 2 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>

                {/* Nama Resto/Instansi */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    Nama Usaha / Instansi{' '}
                    {(formData.role === 'merchant' || formData.role === 'pengolah_energi') ? (
                      <span className="text-emerald-600 dark:text-emerald-400">*</span>
                    ) : (
                      <span className="text-slate-400 text-[10px] lowercase font-normal">(opsional)</span>
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      name="namaInstansi"
                      placeholder="Contoh: Resto Berkah / Panti Kasih"
                      value={formData.namaInstansi}
                      onChange={handleChange}
                      required={formData.role === 'merchant' || formData.role === 'pengolah_energi'}
                      className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    />
                    {formData.namaInstansi.length > 2 && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* No WhatsApp */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.2s both' }}>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                  Nomor WhatsApp / HP <span className="text-emerald-600 dark:text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="nomorTelepon"
                    placeholder="081234567890"
                    value={formData.nomorTelepon}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                  />
                  {formData.nomorTelepon.length >= 10 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              {/* Password akun */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" style={{ animation: 'slideUp 0.4s ease-out 0.22s both' }}>
                <div>
                  <label htmlFor="kataKunci" className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    Kata Sandi <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="kataKunci"
                      type={showPassword ? 'text' : 'password'}
                      name="kataKunci"
                      value={formData.kataKunci}
                      onChange={handleChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Minimal 8 karakter"
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showPassword ? 'M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z' : 'M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243'} />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                      </svg>
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="konfirmasiKataKunci" className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300 mb-2">
                    Konfirmasi Kata Sandi <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="konfirmasiKataKunci"
                      type={showPasswordConfirmation ? 'text' : 'password'}
                      name="konfirmasiKataKunci"
                      value={formData.konfirmasiKataKunci}
                      onChange={handleChange}
                      required
                      minLength={8}
                      autoComplete="new-password"
                      placeholder="Ulangi kata sandi"
                      className="w-full px-4 py-3.5 pr-12 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordConfirmation(!showPasswordConfirmation)}
                      aria-label={showPasswordConfirmation ? 'Sembunyikan konfirmasi kata sandi' : 'Tampilkan konfirmasi kata sandi'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-emerald-500 transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        <circle cx="12" cy="12" r="3" strokeWidth={2} />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>

              {/* Alamat Lengkap + Tombol Lokasi Saat Ini */}
              <div style={{ animation: 'slideUp 0.4s ease-out 0.25s both' }}>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                    Alamat Operasional Utama <span className="text-emerald-600 dark:text-emerald-400">*</span>
                  </label>
                  
                  {/* Tombol Gunakan Lokasi Saat Ini */}
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    disabled={gettingLocation}
                    className="text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer disabled:opacity-50 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/50"
                  >
                    {gettingLocation ? (
                      <>
                        <div className="w-3 h-3 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        <span>Mendeteksi...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>Gunakan Lokasi Saya</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="relative">
                  <textarea
                    name="alamatLengkap"
                    rows={3}
                    placeholder="Sebutkan jalan, nomor, kecamatan, dan kota atau klik lokasi otomatis di atas..."
                    value={formData.alamatLengkap}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 transition-all resize-none"
                  />
                  {formData.alamatLengkap.length > 10 && (
                    <div className="absolute right-3 top-4 text-emerald-500">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting || successMsg}
                className="group relative w-full py-4 px-4 text-sm font-black text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-800 rounded-2xl shadow-xl shadow-emerald-600/30 hover:shadow-2xl hover:shadow-emerald-600/40 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xl flex items-center justify-center gap-2 overflow-hidden mt-2"
                style={{ animation: 'slideUp 0.4s ease-out 0.3s both' }}
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shine-effect" />
                {submitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Menyimpan Profil...</span>
                  </>
                ) : successMsg ? (
                  <>
                    <svg className="w-5 h-5 text-white animate-bounce-gentle" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Berhasil! Mengalihkan...</span>
                  </>
                ) : (
                  <>
                    <span>Simpan & Lanjutkan</span>
                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Trust Badges */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-500 dark:text-slate-400" style={{ animation: 'slideUp 0.4s ease-out 0.35s both' }}>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span>SSL Terenkripsi</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Data Aman</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span>Realtime Sync</span>
            </div>
          </div>
        </div>

        {/* Modal sukses ditampilkan setelah profil berhasil disimpan. */}
        {successMsg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
            {/* Efek confetti sebagai tanda proses selesai. */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(50)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 animate-confetti"
                  style={{
                    left: `${Math.random() * 100}%`,
                    backgroundColor: ['#10b981', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6'][Math.floor(Math.random() * 5)],
                    animationDelay: `${Math.random() * 2}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-8 sm:p-10 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-800 text-center animate-scaleIn">
              
              {/* Ikon sukses dengan animasi lingkaran yang berdenyut. */}
              <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-emerald-100 dark:bg-emerald-950/60 mb-6 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-30"></span>
                <div className="relative animate-bounce-gentle">
                  <svg className="w-12 h-12 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
                Profil Berhasil Disimpan!
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Selamat datang di ekosistem <span className="font-bold text-emerald-600 dark:text-emerald-400">PanganCerdas</span>. Anda akan diarahkan ke dashboard dalam beberapa saat.
              </p>

              <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Mengalihkan ke dashboard...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}