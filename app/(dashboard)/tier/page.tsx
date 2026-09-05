'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import {
  Leaf, Info, ClipboardCheck, MapPin, Coins, Heart, Zap,
  Crosshair, Loader2, CheckCircle2, ArrowLeft, Sparkles,
  ShieldCheck, Truck, Flame, Users, Wind, Target, X,
  ChevronRight, Navigation, Cpu, Route, Store, Lock,
  Package, Scale, FileCheck2, Building2
} from 'lucide-react';

// Tipe ini membantu menjaga agar data form dan hasil klasifikasi tetap konsisten.
// ============================================================
// TIPE DATA (Bahasa Indonesia)
// ============================================================
type KualitasPangan = 'sangat_baik' | 'layak_konsumsi' | 'sisa_kotor';

interface FormulirMakanan {
  namaResto: string;
  namaMenu: string;
  kuantitas: number;
  kualitas: KualitasPangan | '';
  catatan: string;
  hargaTier1: number;
  alamatResto: string;
  lintang: number;
  bujur: number;
}

interface HasilKlasifikasi {
  nomorTier: number;
  kategoriEnum: 'tier1_marketplace' | 'tier2_donasi' | 'tier3_biogas';
  judul: string;
  deskripsi: string;
  namaAksi: string;
  IconTier: any;
  estimasiDampak: { label: string; nilai: string; Icon: any }[];
}

interface NotifikasiToast {
  id: number;
  tipe: 'sukses' | 'error' | 'info';
  judul: string;
  pesan: string;
}

interface IdentitasMerchant {
  email?: string;
  name?: string;
  id?: string;
  namaResto?: string;
}

// ============================================================
// KONFIGURASI TIER
// ============================================================
const KONFIGURASI_TIER = {
  1: {
    warnaTeks: 'text-amber-600 dark:text-amber-400',
    warnaLatar: 'from-amber-500 to-orange-600',
    warnaLatarLembut: 'bg-amber-50 dark:bg-amber-950/30',
    warnaBorder: 'border-amber-300 dark:border-amber-700/50',
    warnaGlow: 'shadow-amber-500/30',
    Icon: Coins,
    label: 'Tier 1',
    subJudul: 'Surplus Marketplace',
  },
  2: {
    warnaTeks: 'text-emerald-600 dark:text-emerald-400',
    warnaLatar: 'from-emerald-500 to-teal-600',
    warnaLatarLembut: 'bg-emerald-50 dark:bg-emerald-950/30',
    warnaBorder: 'border-emerald-300 dark:border-emerald-700/50',
    warnaGlow: 'shadow-emerald-500/30',
    Icon: Heart,
    label: 'Tier 2',
    subJudul: 'Donasi Sosial',
  },
  3: {
    warnaTeks: 'text-teal-600 dark:text-teal-400',
    warnaLatar: 'from-teal-500 to-cyan-600',
    warnaLatarLembut: 'bg-teal-50 dark:bg-teal-950/30',
    warnaBorder: 'border-teal-300 dark:border-teal-700/50',
    warnaGlow: 'shadow-teal-500/30',
    Icon: Zap,
    label: 'Tier 3',
    subJudul: 'Konversi Bio-Energi',
  },
} as const;

// ============================================================
// OPSI KUALITAS
// ============================================================
const OPSI_KUALITAS: { nilai: KualitasPangan; judul: string; deskripsi: string; Icon: any; tierTarget: 1 | 2 | 3 }[] = [
  { nilai: 'sangat_baik', judul: 'Sangat Baik & Segar', deskripsi: 'Masih utuh, fresh dari dapur/etalase. Ideal dijual dengan diskon.', Icon: Sparkles, tierTarget: 1 },
  { nilai: 'layak_konsumsi', judul: 'Layak Konsumsi', deskripsi: 'Porsi besar, aman dimakan segera. Cocok untuk donasi panti.', Icon: Heart, tierTarget: 2 },
  { nilai: 'sisa_kotor', judul: 'Sisa Piring / Organik', deskripsi: 'Basi, potongan sayur, sisa piring. Diolah jadi biogas.', Icon: RecycleIcon, tierTarget: 3 },
];

// Ikon ini dipakai untuk pilihan makanan yang akan masuk ke pengolahan organik.
function RecycleIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

const TAHAPAN_ANALISIS = [
  { label: 'Memindai kualitas & kesegaran...', Icon: Cpu },
  { label: 'Menganalisis volume & bobot...', Icon: Scale },
  { label: 'Menghitung rute penjemputan...', Icon: Route },
  { label: 'Menentukan tier optimal...', Icon: Target },
];

// ============================================================
// FUNGSI REVERSE GEOCODING (Mengubah koordinat → nama daerah)
// ============================================================
async function dapatkanNamaDaerah(lintang: number, bujur: number): Promise<string> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lintang}&lon=${bujur}&zoom=14&addressdetails=1&accept-language=id`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'PanganCerdas-App/1.0' },
    });
    if (!response.ok) throw new Error('Gagal mengambil data lokasi');
    const data = await response.json();
    
    if (data.address) {
      const bagian = [];
      if (data.address.suburb || data.address.neighbourhood || data.address.village) {
        bagian.push(data.address.suburb || data.address.neighbourhood || data.address.village);
      }
      if (data.address.city_district || data.address.city || data.address.town) {
        bagian.push(data.address.city_district || data.address.city || data.address.town);
      }
      if (data.address.state) bagian.push(data.address.state);
      
      if (bagian.length > 0) return bagian.join(', ');
    }
    
    if (data.display_name) {
      const bagian = data.display_name.split(',').slice(0, 3).join(',').trim();
      return bagian;
    }
    
    return `Lokasi Terdeteksi (${lintang.toFixed(4)}, ${bujur.toFixed(4)})`;
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return `Lokasi Terdeteksi (${lintang.toFixed(4)}, ${bujur.toFixed(4)})`;
  }
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function HalamanKlasifikasiPangan() {
  // Form menyimpan data makanan, lokasi, dan harga jika masuk Tier 1.
  const [dataFormulir, setDataFormulir] = useState<FormulirMakanan>({
    namaResto: '',
    namaMenu: '',
    kuantitas: 0,
    kualitas: '',
    catatan: '',
    hargaTier1: 0,
    alamatResto: 'Jl. Sudirman No. 45, Jakarta Pusat',
    lintang: -6.2088,
    bujur: 106.8456,
  });

  const [sedangMenganalisis, setSedangMenganalisis] = useState(false);
  const [indeksTahapan, setIndeksTahapan] = useState(0);
  const [sedangMenyimpan, setSedangMenyimpan] = useState(false);
  const [sedangMencariLokasi, setSedangMencariLokasi] = useState(false);
  const [hasilKlasifikasi, setHasilKlasifikasi] = useState<HasilKlasifikasi | null>(null);
  const [daftarToast, setDaftarToast] = useState<NotifikasiToast[]>([]);
  const [kunciAnimasiHasil, setKunciAnimasiHasil] = useState(0);
  const [identitasMerchant, setIdentitasMerchant] = useState<IdentitasMerchant>({});
  const [namaRestoTerkunci, setNamaRestoTerkunci] = useState(false);

  // Ambil identitas merchant saat halaman pertama kali dibuka.
  useEffect(() => {
    const muatIdentitasMerchant = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          kirimToast('info', 'Belum Login', 'Silakan login sebagai merchant untuk pengalaman terbaik.');
          return;
        }

        const identitasBaru: IdentitasMerchant = {
          email: user.email,
          id: user.id,
          name: user.user_metadata?.full_name || '',
        };

        // Nama usaha diambil dari profil agar tidak perlu diketik ulang.
        const { data: profil, error } = await supabase
          .from('profiles')
          .select('nama_lengkap, nama_instansi, role')
          .eq('id', user.id)
          .single();

        if (!error && profil) {
          identitasBaru.namaResto = profil.nama_instansi || profil.nama_lengkap || '';
          identitasBaru.name = profil.nama_lengkap || identitasBaru.name;
        } else {
          identitasBaru.namaResto = user.user_metadata?.nama_instansi || user.user_metadata?.full_name || '';
        }

        setIdentitasMerchant(identitasBaru);

        // Jika sudah ada, nama resto diisi otomatis dan tidak bisa diubah dari sini.
        if (identitasBaru.namaResto) {
          setDataFormulir((prev) => ({ ...prev, namaResto: identitasBaru.namaResto || '' }));
          setNamaRestoTerkunci(true);
        }
      } catch (err) {
        console.error('Gagal memuat identitas merchant:', err);
      }
    };
    muatIdentitasMerchant();
  }, []);

  // Semua pesan singkat di halaman dikumpulkan melalui fungsi ini.
  const kirimToast = useCallback((tipe: NotifikasiToast['tipe'], judul: string, pesan: string) => {
    const idBaru = Date.now() + Math.random();
    setDaftarToast((sebelumnya) => [...sebelumnya, { id: idBaru, tipe, judul, pesan }]);
    setTimeout(() => {
      setDaftarToast((sebelumnya) => sebelumnya.filter((t) => t.id !== idBaru));
    }, 5500);
  }, []);

  // Gerakkan indikator analisis secara bertahap selama simulasi berjalan.
  useEffect(() => {
    if (!sedangMenganalisis) return;
    setIndeksTahapan(0);
    const interval = setInterval(() => {
      setIndeksTahapan((sebelumnya) => {
        if (sebelumnya >= TAHAPAN_ANALISIS.length - 1) {
          clearInterval(interval);
          return sebelumnya;
        }
        return sebelumnya + 1;
      });
    }, 400);
    return () => clearInterval(interval);
  }, [sedangMenganalisis]);

  // Ambil lokasi perangkat lalu ubah koordinatnya menjadi nama daerah.
  const ambilLokasiGPS = async () => {
    if (!navigator.geolocation) {
      kirimToast('error', 'Tidak Didukung', 'Browser Anda tidak mendukung Geolocation.');
      return;
    }
    setSedangMencariLokasi(true);
    kirimToast('info', 'Mencari Lokasi', 'Mendeteksi koordinat GPS dan nama daerah...');

    navigator.geolocation.getCurrentPosition(
      async (posisi) => {
        const { latitude, longitude } = posisi.coords;
        const namaDaerah = await dapatkanNamaDaerah(latitude, longitude);
        
        setDataFormulir((sebelumnya) => ({
          ...sebelumnya,
          lintang: latitude,
          bujur: longitude,
          alamatResto: namaDaerah,
        }));
        setSedangMencariLokasi(false);
        kirimToast('sukses', 'Lokasi Ditemukan', `Berhasil mendeteksi: ${namaDaerah}`);
      },
      (galat) => {
        kirimToast('error', 'Gagal Mengambil Lokasi', galat.message);
        setSedangMencariLokasi(false);
      }
    );
  };

  // Tentukan jalur pangan berdasarkan kondisi makanan yang dipilih.
  const prosesKlasifikasi = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dataFormulir.kualitas) {
      kirimToast('info', 'Pilih Kondisi Makanan', 'Silakan pilih kondisi fisik makanan terlebih dahulu.');
      return;
    }
    if (!dataFormulir.namaResto) {
      kirimToast('info', 'Nama Restoran Kosong', 'Silakan login sebagai merchant untuk mengisi otomatis.');
      return;
    }
    setSedangMenganalisis(true);
    setHasilKlasifikasi(null);

    setTimeout(() => {
      // Bagian ini mensimulasikan hasil analisis dan menghitung dampaknya.
      let hasil: HasilKlasifikasi;
      const jumlahKg = dataFormulir.kuantitas || 1;
      const hargaTier1Aktif = dataFormulir.hargaTier1 > 0 ? dataFormulir.hargaTier1 : 15000;

      if (dataFormulir.kualitas === 'sangat_baik') {
        hasil = {
          nomorTier: 1,
          kategoriEnum: 'tier1_marketplace',
          judul: 'Marketplace Surplus',
          deskripsi: 'Makanan masih sangat segar dan utuh. Sistem telah menyiapkan draf penjualan dengan diskon 50% untuk warga sekitar Anda.',
          namaAksi: 'Terbitkan ke Marketplace',
          IconTier: Coins,
          estimasiDampak: [
            { label: 'Estimasi Revenue', nilai: `Rp ${(jumlahKg * hargaTier1Aktif).toLocaleString('id-ID')}`, Icon: Coins },
            { label: 'Porsi Terselamat', nilai: `${jumlahKg * 2} porsi`, Icon: Users },
            { label: 'CO₂e Dihindari', nilai: `${(jumlahKg * 2.5).toFixed(1)} kg`, Icon: Wind },
          ],
        };
      } else if (dataFormulir.kualitas === 'layak_konsumsi') {
        hasil = {
          nomorTier: 2,
          kategoriEnum: 'tier2_donasi',
          judul: 'Donasi Langsung',
          deskripsi: 'Makanan layak konsumsi dalam porsi besar. Sistem sedang mencarikan rute panti asuhan terdekat dari lokasi Anda.',
          namaAksi: 'Panggil Relawan Jemput',
          IconTier: Heart,
          estimasiDampak: [
            { label: 'Penerima Manfaat', nilai: `${jumlahKg * 2} orang`, Icon: Users },
            { label: 'Panti Terdekat', nilai: '3 lokasi', Icon: MapPin },
            { label: 'CO₂e Dihindari', nilai: `${(jumlahKg * 2.5).toFixed(1)} kg`, Icon: Wind },
          ],
        };
      } else {
        hasil = {
          nomorTier: 3,
          kategoriEnum: 'tier3_biogas',
          judul: 'Konversi Bio-Energi',
          deskripsi: 'Limbah organik akan dijemput oleh mitra pengolah biogas. Jangan dibuang ke tong sampah biasa — ubah jadi energi!',
          namaAksi: 'Jadwalkan Penjemputan',
          IconTier: Zap,
          estimasiDampak: [
            { label: 'Biogas Dihasilkan', nilai: `${(jumlahKg * 0.15).toFixed(2)} m³`, Icon: Zap },
            { label: 'Metana Dicegah', nilai: `${(jumlahKg * 0.5).toFixed(1)} kg`, Icon: Flame },
            { label: 'CO₂e Dihindari', nilai: `${(jumlahKg * 2.5).toFixed(1)} kg`, Icon: Wind },
          ],
        };
      }

      setHasilKlasifikasi(hasil);
      setKunciAnimasiHasil((k) => k + 1);
      setSedangMenganalisis(false);
      kirimToast('sukses', 'Analisis Selesai', `Rekomendasi terbaik: ${hasil.judul} (${KONFIGURASI_TIER[hasil.nomorTier as 1 | 2 | 3].label})`);
    }, 1900);
  };

  // Simpan makanan yang sudah diklasifikasikan agar bisa dipakai alur berikutnya.
  const simpanKeSupabase = async () => {
    if (!hasilKlasifikasi) return;
    if (hasilKlasifikasi.nomorTier === 1 && (!dataFormulir.hargaTier1 || dataFormulir.hargaTier1 <= 0)) {
      kirimToast('error', 'Harga Tier 1 Wajib Diisi', 'Masukkan harga jual yang sesuai agar tidak dihitung otomatis.');
      return;
    }
    setSedangMenyimpan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const merchantEmail = user?.email || identitasMerchant.email;
      const merchantId = user?.id || identitasMerchant.id;
      const merchantName = user?.user_metadata?.full_name || identitasMerchant.name || 'Merchant';
      
      // Field di bawah ini mengikuti kolom tabel makanan_surplus.
      const { error } = await supabase.from('makanan_surplus').insert([
        {
          nama_resto: dataFormulir.namaResto,
          nama_makanan: dataFormulir.namaMenu,
          stok_tersedia: dataFormulir.kuantitas,
          kategori_tier: hasilKlasifikasi.kategoriEnum,
          harga_diskon: hasilKlasifikasi.nomorTier === 1 ? Number(dataFormulir.hargaTier1) : 0,
          tujuan_panti: hasilKlasifikasi.nomorTier === 2 ? 'Panti Asuhan Terdekat' : null,
          alamat_resto: dataFormulir.alamatResto,
          latitude: dataFormulir.lintang,
          longitude: dataFormulir.bujur,
          merchant_email: merchantEmail,
          merchant_id: merchantId,
          merchant_name: merchantName,
        },
      ]);
      if (error) throw error;

      kirimToast('sukses', 'Berhasil Disiarkan', `Data "${dataFormulir.namaResto}" tersimpan & akan muncul di dashboard merchant.`);
      
      // Bersihkan data makanan setelah berhasil, tetapi nama resto tetap dipertahankan.
      setDataFormulir((sebelumnya) => ({
        ...sebelumnya,
        namaMenu: '',
        kuantitas: 0,
        kualitas: '',
        catatan: '',
        hargaTier1: 0,
      }));
      setHasilKlasifikasi(null);
    } catch (galat: any) {
      kirimToast('error', 'Gagal Menyimpan', galat.message || 'Terjadi kesalahan saat menyimpan ke database.');
    } finally {
      setSedangMenyimpan(false);
    }
  };

  // Helper untuk memperbarui satu field tanpa menghapus isi field lainnya.
  const perbaruiFormulir = (namaKolom: keyof FormulirMakanan, nilaiBaru: any) => {
    setDataFormulir((sebelumnya) => ({ ...sebelumnya, [namaKolom]: nilaiBaru }));
  };

  const konfigurasiTierAktif = hasilKlasifikasi ? KONFIGURASI_TIER[hasilKlasifikasi.nomorTier as 1 | 2 | 3] : null;
  const kelengkapanFormulir = [
    dataFormulir.namaResto,
    dataFormulir.namaMenu,
    dataFormulir.kuantitas > 0,
    dataFormulir.kualitas,
    dataFormulir.alamatResto,
  ].filter(Boolean).length;
  const persenKelengkapan = Math.round((kelengkapanFormulir / 5) * 100);

  // Panel kanan berganti antara kondisi kosong, proses analisis, dan hasil akhir.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans p-4 sm:p-6 lg:p-8 transition-colors duration-300 relative overflow-hidden">
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideAtas { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideKanan { from { opacity: 0; transform: translateX(110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes skalaMasuk { from { opacity: 0; transform: scale(.9) translateY(12px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes denyutCincin { 0% { transform: scale(1); opacity: .6 } 100% { transform: scale(1.9); opacity: 0 } }
        @keyframes melayang { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
        @keyframes gembira { 0% { transform: scale(0) rotate(-12deg) } 60% { transform: scale(1.15) rotate(4deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes kilau { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes blob { 0%,100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40% } 50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60% } }
        .anim-fadeIn { animation: fadeIn .4s ease-out both }
        .anim-slideAtas { animation: slideAtas .6s cubic-bezier(.22,1,.36,1) both }
        .anim-slideKanan { animation: slideKanan .5s cubic-bezier(.22,1,.36,1) both }
        .anim-skalaMasuk { animation: skalaMasuk .55s cubic-bezier(.34,1.56,.64,1) both }
        .anim-melayang { animation: melayang 3.5s ease-in-out infinite }
        .anim-gembira { animation: gembira .7s cubic-bezier(.34,1.56,.64,1) both }
        .anim-blob { animation: blob 12s ease-in-out infinite }
        .efek-kilau { background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%); background-size: 200% 100%; animation: kilau 3s linear infinite }
      `}</style>

      {/* Hiasan latar halaman. */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-24 -left-20 w-96 h-96 bg-emerald-200/30 dark:bg-emerald-900/20 blur-3xl anim-blob" />
        <div className="absolute bottom-20 -right-20 w-96 h-96 bg-amber-200/30 dark:bg-amber-900/15 blur-3xl anim-blob" style={{ animationDelay: '-4s' }} />
        <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-teal-200/20 dark:bg-teal-900/10 blur-3xl anim-blob" style={{ animationDelay: '-8s' }} />
      </div>

      {/* Notifikasi singkat untuk memberi tahu hasil setiap tindakan. */}
      <div className="fixed top-5 right-5 z-[120] space-y-3 w-[min(92vw,380px)]">
        {daftarToast.map((toast) => {
          const konfigurasi = {
            sukses: { Icon: CheckCircle2, warna: 'text-emerald-500', border: 'border-emerald-300 dark:border-emerald-700' },
            error: { Icon: X, warna: 'text-rose-500', border: 'border-rose-300 dark:border-rose-700' },
            info: { Icon: Info, warna: 'text-blue-500', border: 'border-blue-300 dark:border-blue-700' },
          }[toast.tipe];
          return (
            <div key={toast.id} className={`anim-slideKanan bg-white dark:bg-slate-900 border ${konfigurasi.border} rounded-2xl p-4 shadow-2xl flex gap-3`}>
              <div className={`p-2 h-fit rounded-xl bg-slate-100 dark:bg-slate-800 ${konfigurasi.warna}`}><konfigurasi.Icon className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">{toast.judul}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{toast.pesan}</p>
              </div>
              <button onClick={() => setDaftarToast((s) => s.filter((t) => t.id !== toast.id))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white h-fit cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Judul halaman dan tombol kembali. */}
        <div className="mb-8 flex items-start justify-between gap-4 anim-slideAtas">
          <div className="space-y-3">
            <Link href="/" className="group inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors">
              <span className="p-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group-hover:border-emerald-400 group-hover:scale-110 transition-all">
                <ArrowLeft className="w-4 h-4" />
              </span>
              Kembali ke Beranda
            </Link>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-2xl blur-lg opacity-40" />
                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-amber-500 flex items-center justify-center text-white shadow-xl">
                  <ClipboardCheck className="w-6 h-6" />
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Klasifikasi Sisa Pangan</h1>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400 mt-0.5">AI-Powered Tiering Engine</p>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-400 max-w-2xl text-sm sm:text-base leading-relaxed">
              Laporkan sisa bahan baku atau menu hari ini. Sistem AI kami akan menentukan jalur distribusi terbaik & menyiarkan lokasi penjemputan secara real-time.
            </p>
          </div>
          <ThemeToggle ringkas={true} />
        </div>

        {/* Penjelasan singkat mengapa data sisa makanan perlu dicatat. */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 sm:p-6 mb-8 text-white shadow-xl shadow-emerald-500/25 anim-slideAtas" style={{ animationDelay: '0.1s' }}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative flex gap-4 items-start">
            <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-sm shrink-0 border border-white/30 anim-melayang">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-black text-sm flex items-center gap-2">
                Mengapa Input Ini Penting?
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">SDG 11 & 12</span>
              </h4>
              <p className="text-sm text-emerald-50 mt-1.5 leading-relaxed">
                Indonesia membuang sekitar <strong className="text-white">23–48 juta ton</strong> sampah makanan per tahun. Dengan mencatat sisa pangan di sini, Anda membantu relawan menemukan lokasi makanan surplus dengan presisi GPS.
              </p>
            </div>
          </div>
        </div>

        {/* Kolom kiri untuk input, kolom kanan untuk hasil klasifikasi. */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form data sisa makanan. */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none space-y-6 anim-slideAtas" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><Leaf className="w-5 h-5" /></span>
                Detail Sisa Makanan
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-700" style={{ width: `${persenKelengkapan}%` }} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 tabular-nums">{persenKelengkapan}%</span>
              </div>
            </div>

            <form onSubmit={prosesKlasifikasi} className="space-y-5">
              {/* Nama resto berasal dari profil merchant dan bisa terkunci. */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-emerald-500" /> Nama Restoran / Toko
                  {namaRestoTerkunci && <Lock className="w-3 h-3 text-emerald-500" />}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="Login sebagai merchant untuk auto-fill"
                    className={`w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 pr-10 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm placeholder:text-slate-400 ${namaRestoTerkunci ? 'cursor-not-allowed opacity-90' : ''}`}
                    value={dataFormulir.namaResto}
                    onChange={(e) => !namaRestoTerkunci && perbaruiFormulir('namaResto', e.target.value)}
                    readOnly={namaRestoTerkunci}
                  />
                  {namaRestoTerkunci && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md bg-emerald-100 dark:bg-emerald-500/20">
                      <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                </div>
                {namaRestoTerkunci && (
                  <p className="mt-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Otomatis dari profil merchant Anda
                  </p>
                )}
              </div>

              {/* NAMA MENU */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-emerald-500" /> Nama Menu / Bahan
                </label>
                <input type="text" required placeholder="Misal: Roti Gandum Sisa Etalase"
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm placeholder:text-slate-400"
                  value={dataFormulir.namaMenu} onChange={(e) => perbaruiFormulir('namaMenu', e.target.value)} />
              </div>

              {/* KUANTITAS */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-emerald-500" /> Perkiraan Kuantitas
                </label>
                <div className="relative">
                  <input type="number" required min="1" placeholder="Contoh: 15"
                    className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-emerald-500/10 transition-all text-sm placeholder:text-slate-400"
                    value={dataFormulir.kuantitas || ''} onChange={(e) => perbaruiFormulir('kuantitas', Number(e.target.value))} />
                  <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">Porsi / Kg</span>
                </div>
              </div>

              {/* Pilihan kualitas menentukan tier yang direkomendasikan. */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-emerald-500" /> Kondisi Fisik Makanan
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {OPSI_KUALITAS.map((opsi) => {
                    const terpilih = dataFormulir.kualitas === opsi.nilai;
                    const konfig = KONFIGURASI_TIER[opsi.tierTarget];
                    return (
                      <button key={opsi.nilai} type="button" onClick={() => perbaruiFormulir('kualitas', opsi.nilai)}
                        className={`group relative text-left p-4 rounded-2xl border-2 transition-all duration-300 cursor-pointer overflow-hidden ${
                          terpilih
                            ? `${konfig.warnaLatarLembut} ${konfig.warnaBorder} shadow-lg ${konfig.warnaGlow} scale-[1.01]`
                            : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:-translate-y-0.5'
                        }`}>
                        {terpilih && <div className={`absolute inset-0 bg-gradient-to-r ${konfig.warnaLatar} opacity-[0.06]`} />}
                        <div className="relative flex items-center gap-3.5">
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                            terpilih ? `bg-gradient-to-br ${konfig.warnaLatar} text-white shadow-lg scale-110` : 'bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600'
                          }`}>
                            <opsi.Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className={`text-sm font-black ${terpilih ? konfig.warnaTeks : 'text-slate-800 dark:text-slate-200'}`}>{opsi.judul}</p>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${
                                terpilih ? `bg-gradient-to-r ${konfig.warnaLatar} text-white` : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                              }`}>{konfig.label}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">{opsi.deskripsi}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            terpilih ? `bg-gradient-to-br ${konfig.warnaLatar} border-transparent` : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {terpilih && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* HARGA TIER 1 */}
              {hasilKlasifikasi?.nomorTier === 1 && (
                <div className="pt-1">
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-500" /> Harga Jual Tier 1
                  </label>
                  <div className="relative">
                    <input type="number" min="1" required placeholder="Contoh: 25000"
                      className="w-full bg-amber-50 dark:bg-amber-950/20 border-2 border-amber-200 dark:border-amber-800 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-amber-500/10 transition-all text-sm placeholder:text-slate-400"
                      value={dataFormulir.hargaTier1 || ''} onChange={(e) => perbaruiFormulir('hargaTier1', Number(e.target.value))} />
                    <span className="absolute right-4 top-3.5 text-xs text-slate-400 font-bold">Rp</span>
                  </div>
                  <p className="mt-2 text-[10px] text-slate-500 dark:text-slate-400">Harga ini akan disimpan ke database dan digunakan untuk listing marketplace tanpa perkiraan otomatis.</p>
                </div>
              )}

              {/* Lokasi dipakai untuk menentukan titik penjemputan. */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" /> Lokasi Penjemputan
                  </label>
                  <button type="button" onClick={ambilLokasiGPS} disabled={sedangMencariLokasi}
                    className="group text-[11px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 font-black px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800 active:scale-95 cursor-pointer disabled:opacity-60">
                    {sedangMencariLokasi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crosshair className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />}
                    {sedangMencariLokasi ? 'Mencari Lokasi...' : 'Gunakan GPS Saya'}
                  </button>
                </div>
                <input type="text" required placeholder="Alamat Resto / Toko..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-2.5 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm placeholder:text-slate-400"
                  value={dataFormulir.alamatResto} onChange={(e) => perbaruiFormulir('alamatResto', e.target.value)} />

                <div className="relative w-full h-52 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-inner group">
                  <iframe title="Peta Lokasi Restoran" width="100%" height="100%" frameBorder="0" scrolling="no"
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${dataFormulir.bujur - 0.01}%2C${dataFormulir.lintang - 0.01}%2C${dataFormulir.bujur + 0.01}%2C${dataFormulir.lintang + 0.01}&layer=mapnik&marker=${dataFormulir.lintang}%2C${dataFormulir.bujur}`} />
                  <div className="absolute top-2 left-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[9px] font-black text-slate-700 dark:text-slate-300 flex items-center gap-1.5 border border-slate-200 dark:border-slate-700">
                    <Navigation className="w-3 h-3 text-emerald-500" />
                    {dataFormulir.lintang.toFixed(4)}, {dataFormulir.bujur.toFixed(4)}
                  </div>
                </div>
              </div>

              {/* Mulai analisis setelah data utama terisi. */}
              <button type="submit" disabled={sedangMenganalisis || !dataFormulir.kualitas}
                className="group relative w-full mt-2 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black py-4 px-4 rounded-2xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/25 cursor-pointer overflow-hidden">
                <span className="absolute inset-0 efek-kilau" />
                {sedangMenganalisis ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Menganalisis...</>
                ) : (
                  <>
                    <Cpu className="w-5 h-5 group-hover:rotate-6 transition-transform" />
                    Analisis Jalur Pangan dengan AI
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Hasil analisis dan tombol untuk menyiarkannya ke sistem. */}
          <div className="flex flex-col h-full anim-slideAtas" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"><Sparkles className="w-5 h-5" /></span>
                Rekomendasi AI
              </h2>
              {hasilKlasifikasi && konfigurasiTierAktif && (
                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-r ${konfigurasiTierAktif.warnaLatar} text-white shadow-md`}>
                  {konfigurasiTierAktif.label} Terdeteksi
                </span>
              )}
            </div>

            <div className="flex-1 bg-white/60 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-800 p-5 flex flex-col relative overflow-hidden transition-all duration-500 min-h-[480px]">
              {!hasilKlasifikasi && !sedangMenganalisis && (
                <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 opacity-70">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-2xl" />
                    <div className="relative w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 rounded-3xl flex items-center justify-center text-slate-400 dark:text-slate-500 anim-melayang border border-slate-200 dark:border-slate-700">
                      <Cpu className="w-9 h-9" />
                    </div>
                  </div>
                  <div className="space-y-1.5 max-w-xs">
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Menunggu Data Pangan</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      Isi detail makanan & lokasi di formulir, lalu klik <span className="font-bold text-emerald-600 dark:text-emerald-400">Analisis Jalur Pangan</span> untuk melihat rekomendasi AI.
                    </p>
                  </div>
                  <div className="flex gap-1.5 pt-2">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce" style={{ animationDelay: `${n * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {sedangMenganalisis && (
                // Tampilkan tahapan proses agar pengguna tahu analisis sedang berjalan.
                <div className="flex-1 flex flex-col items-center justify-center space-y-6 px-4">
                  <div className="relative w-28 h-28">
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30" />
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40" style={{ animation: 'denyutCincin 1.8s ease-out infinite' }} />
                    <div className="absolute inset-0 rounded-full border-2 border-emerald-400/40" style={{ animation: 'denyutCincin 1.8s ease-out infinite', animationDelay: '0.6s' }} />
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40">
                      <Cpu className="w-9 h-9 animate-pulse" />
                    </div>
                  </div>

                  <div className="w-full max-w-xs space-y-2.5">
                    {TAHAPAN_ANALISIS.map((tahap, indeks) => {
                      const aktif = indeks === indeksTahapan;
                      const selesai = indeks < indeksTahapan;
                      return (
                        <div key={tahap.label} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all duration-300 ${
                          aktif ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800' :
                          selesai ? 'opacity-60' : 'opacity-30'
                        }`}>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                            selesai ? 'bg-emerald-500 text-white' :
                            aktif ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30' :
                            'bg-slate-200 dark:bg-slate-800 text-slate-400'
                          }`}>
                            {selesai ? <CheckCircle2 className="w-4 h-4" /> : aktif ? <Loader2 className="w-4 h-4 animate-spin" /> : <tahap.Icon className="w-4 h-4" />}
                          </div>
                          <p className={`text-xs font-bold ${aktif ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>{tahap.label}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="w-full max-w-xs">
                    <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500 relative" style={{ width: `${((indeksTahapan + 1) / TAHAPAN_ANALISIS.length) * 100}%` }}>
                        <div className="absolute inset-0 efek-kilau" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hasilKlasifikasi && !sedangMenganalisis && konfigurasiTierAktif && (
                // Hasil akhir berisi rekomendasi tier, estimasi dampak, dan aksi berikutnya.
                <div key={kunciAnimasiHasil} className="flex-1 flex flex-col anim-skalaMasuk">
                  <div className={`relative flex-1 rounded-2xl border-2 ${konfigurasiTierAktif.warnaBorder} ${konfigurasiTierAktif.warnaLatarLembut} p-6 sm:p-7 flex flex-col shadow-xl ${konfigurasiTierAktif.warnaGlow} overflow-hidden`}>
                    <div className={`absolute -top-16 -right-16 w-48 h-48 bg-gradient-to-br ${konfigurasiTierAktif.warnaLatar} opacity-10 rounded-full blur-2xl`} />
                    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                    <div className="relative flex-1 flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div className="relative">
                          <div className={`absolute inset-0 bg-gradient-to-br ${konfigurasiTierAktif.warnaLatar} rounded-2xl blur-lg opacity-40`} />
                          <div className={`relative p-3.5 rounded-2xl bg-gradient-to-br ${konfigurasiTierAktif.warnaLatar} text-white shadow-xl anim-gembira`}>
                            <hasilKlasifikasi.IconTier className="w-8 h-8" />
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="px-3 py-1 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm text-emerald-700 dark:text-emerald-300 text-[10px] font-black rounded-full uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3" /> Proses Selesai
                          </span>
                          <span className={`px-3 py-1 bg-gradient-to-r ${konfigurasiTierAktif.warnaLatar} text-white text-[10px] font-black rounded-full uppercase tracking-widest shadow-md`}>
                            {konfigurasiTierAktif.label} • {konfigurasiTierAktif.subJudul}
                          </span>
                        </div>
                      </div>

                      <h3 className={`text-3xl font-black mb-2 ${konfigurasiTierAktif.warnaTeks}`}>{hasilKlasifikasi.judul}</h3>
                      <p className="text-sm text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                        {hasilKlasifikasi.deskripsi}
                      </p>

                      <div className="mt-6 grid grid-cols-3 gap-2.5">
                        {hasilKlasifikasi.estimasiDampak.map((dampak, indeks) => (
                          <div key={dampak.label} className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-3 rounded-xl border border-white/60 dark:border-slate-800 text-center anim-slideAtas" style={{ animationDelay: `${0.15 + indeks * 0.1}s` }}>
                            <dampak.Icon className={`w-4 h-4 mx-auto mb-1.5 ${konfigurasiTierAktif.warnaTeks}`} />
                            <p className="text-xs font-black text-slate-900 dark:text-white leading-tight">{dampak.nilai}</p>
                            <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">{dampak.label}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm p-4 rounded-xl border border-white/60 dark:border-slate-800 space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <FileCheck2 className="w-3.5 h-3.5 text-emerald-500" /> Data Terhubung
                        </p>
                        <p className="font-black text-slate-900 dark:text-white text-sm">
                          {dataFormulir.namaResto || 'Restoran'} — {dataFormulir.kuantitas} Porsi/Kg {dataFormulir.namaMenu}
                        </p>
                        <p className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{dataFormulir.alamatResto}</span>
                        </p>
                      </div>

                      <button onClick={simpanKeSupabase} disabled={sedangMenyimpan}
                        className={`group relative w-full mt-6 bg-gradient-to-r ${konfigurasiTierAktif.warnaLatar} hover:brightness-110 text-white font-black py-4 rounded-2xl shadow-xl ${konfigurasiTierAktif.warnaGlow} transition-all active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer overflow-hidden`}>
                        <span className="absolute inset-0 efek-kilau" />
                        {sedangMenyimpan ? (
                          <><Loader2 className="w-5 h-5 animate-spin" /> Menyimpan & Menyiarkan Pin...</>
                        ) : (
                          <><Truck className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> {hasilKlasifikasi.namaAksi} <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Terenkripsi • Terverifikasi • Tersinkron Peta Realtime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}