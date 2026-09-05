'use client';
import React, { useState, useEffect, useMemo, useCallback, useId } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { calculateCourierPay } from '@/lib/courier';
import { useTheme } from '@/components/theme-provider';
import { QRCodeMini, QRCodePremium } from '@/components/QrCode';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, ShoppingBag, HeartHandshake, Filter, Clock,
  Leaf, Heart, Zap, X, Navigation, ChevronRight, Store, Star,
  CheckCircle2, Loader2, AlertCircle, Package, Wind,
  Crosshair, LocateFixed, SearchCode, Wallet, CreditCard,
  Timer, Bike, PackageCheck, QrCode, ShieldCheck, TrendingUp,
  RefreshCw, Ban, Truck, ArrowRight, Info, Flame, Target,
  ScanLine
} from 'lucide-react';

// Tipe data ini dipakai bersama oleh daftar makanan, checkout, dan tracking pesanan.
// ============================================================
// TIPE DATA
// ============================================================
type TingkatKategori = 'tier1' | 'tier2' | 'tier3';
type StatusPesanan = 'menunggu_pembayaran' | 'dibayar' | 'sedang_diantar' | 'selesai' | 'dibatalkan';

export interface LokasiPangan {
  id: string;
  namaMakanan: string;
  namaResto: string;
  alamat: string;
  tier: TingkatKategori;
  hargaDiskon: number;
  hargaAsli: number;
  stokTersedia: number;
  sisaDetik: number;
  lintang: number;
  bujur: number;
  rating: number;
  jarakKm: number;
}

interface PesananSaya {
  id: string;
  makananId: string;
  namaMakanan: string;
  namaResto: string;
  jumlah: number;
  hargaProduk: number;
  upahKurir: number;
  totalHarga: number;
  status: StatusPesanan;
  waktuKunciHingga: string | null;
  dibuatPada: string;
}

interface Notifikasi {
  id: number;
  tipe: 'sukses' | 'info' | 'error';
  judul: string;
  pesan: string;
}

// Warna dan label tier membantu membedakan jalur makanan di halaman.
// ============================================================
const KONFIG_TIER: Record<TingkatKategori, {
  label: string; warnaTeks: string; warnaLatarLembut: string; warnaBorder: string;
  gradasi: string; glow: string; Icon: any;
}> = {
  tier1: { label: 'Tier 1', warnaTeks: 'text-amber-600 dark:text-amber-400', warnaLatarLembut: 'bg-amber-50 dark:bg-amber-950/30', warnaBorder: 'border-amber-200 dark:border-amber-700/40', gradasi: 'from-amber-500 to-orange-600', glow: 'shadow-amber-500/30', Icon: ShoppingBag },
  tier2: { label: 'Tier 2', warnaTeks: 'text-emerald-600 dark:text-emerald-400', warnaLatarLembut: 'bg-emerald-50 dark:bg-emerald-950/30', warnaBorder: 'border-emerald-200 dark:border-emerald-700/40', gradasi: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', Icon: HeartHandshake },
  tier3: { label: 'Tier 3', warnaTeks: 'text-cyan-600 dark:text-cyan-400', warnaLatarLembut: 'bg-cyan-50 dark:bg-cyan-950/30', warnaBorder: 'border-cyan-200 dark:border-cyan-700/40', gradasi: 'from-cyan-500 to-blue-600', glow: 'shadow-cyan-500/30', Icon: Zap },
};

// Label dan posisi status pesanan pada progress tracking.
const KONFIG_STATUS: Record<StatusPesanan, { label: string; warna: string; Icon: any; langkah: number }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', warna: 'text-amber-600 dark:text-amber-400', Icon: Timer, langkah: 1 },
  dibayar: { label: 'Mencari Kurir', warna: 'text-blue-600 dark:text-blue-400', Icon: Bike, langkah: 2 },
  sedang_diantar: { label: 'Sedang Diantar', warna: 'text-cyan-600 dark:text-cyan-400', Icon: Truck, langkah: 3 },
  selesai: { label: 'Selesai', warna: 'text-emerald-600 dark:text-emerald-400', Icon: PackageCheck, langkah: 4 },
  dibatalkan: { label: 'Dibatalkan', warna: 'text-rose-600 dark:text-rose-400', Icon: Ban, langkah: 0 },
};

const KONFIG_STEPPER = [
  { key: 'dibayar', label: 'Konfirmasi', Icon: CheckCircle2 },
  { key: 'mencari_kurir', label: 'Mencari Kurir', Icon: Bike },
  { key: 'sedang_diantar', label: 'Diantar', Icon: Truck },
  { key: 'selesai', label: 'Selesai', Icon: PackageCheck },
];

const getStepIndex = (status: string) => {
  if (status === 'selesai') return 4;
  if (status === 'sedang_diantar') return 3;
  if (status === 'dibayar' || status === 'mencari_kurir') return 2;
  return 1;
};

// ============================================================
// UTIL
// ============================================================
const hitungJarakKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// Buat misi kurir setelah konsumen menyelesaikan pemesanan.
const buatMisiKurir = async (
  item: { id: string | number; namaMakanan: string; namaResto: string; alamat: string;
          tier: 'tier1' | 'tier2' | 'tier3'; stok?: number | string; stokTersedia?: number; lintang: number; bujur: number },
  peranPembeli: 'konsumen' | 'panti' | 'energi',
  lokasiPembeli: [number, number],
  pesananId: string,
) => {
  const { data: { user } } = await supabase.auth.getUser();
  const stok = item.stok ?? item.stokTersedia ?? 1;
  const berat = typeof stok === 'number' ? stok : parseFloat(String(stok)) || 1;

  const haversine = (la1: number, lo1: number, la2: number, lo2: number) => {
    const R = 6371, dLa = ((la2 - la1) * Math.PI) / 180, dLo = ((lo2 - lo1) * Math.PI) / 180;
    const a = Math.sin(dLa / 2) ** 2 + Math.cos((la1 * Math.PI) / 180) * Math.cos((la2 * Math.PI) / 180) * Math.sin(dLo / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const kategori = item.tier === 'tier3' ? 'Ubah Limbah ke Energi' : 'Penyelamatan Pangan';
  const alamatAntar =
    peranPembeli === 'panti' ? 'Panti Asuhan (Penerima Donasi)'
    : peranPembeli === 'energi' ? 'Fasilitas Pengolahan Bio-Energi'
    : 'Alamat Konsumen';
  const jarakKm = Math.max(0.5, haversine(lokasiPembeli[0], lokasiPembeli[1], item.lintang, item.bujur));
  const imbalan = calculateCourierPay(item.tier, berat, jarakKm);

  // Misi menyimpan lokasi jemput, tujuan, jarak, dan imbalan kurir.
  const { error } = await supabase.from('misi_kurir').insert([{
    pesanan_id: pesananId,
    makanan_id: item.id,
    nama_makanan: item.namaMakanan,
    resto_asal: item.namaResto,
    alamat_jemput: item.alamat,
    alamat_antar: alamatAntar,
    lat_jemput: item.lintang,
    lng_jemput: item.bujur,
    lat_antar: lokasiPembeli[0],
    lng_antar: lokasiPembeli[1],
    kategori,
    tipe: item.namaMakanan,
    dampak_sosial: `Menyelamatkan ${berat.toFixed(1)} kg ${item.namaMakanan}`,
    jarak: `${jarakKm.toFixed(1)} km`,
    estimasi_waktu: `${Math.max(12, Math.min(40, Math.round(berat * 1.7 + 10)))} Menit`,
    imbalan,
    status: 'terbuka',
    dibuat_oleh_id: user?.id ?? null,
    dibuat_oleh_role: peranPembeli,
  }]);
  if (error) throw error;
};

const konversiTier = (kategori: string): TingkatKategori => {
  const str = (kategori || '').toLowerCase();
  if (str.includes('tier2') || str.includes('donasi')) return 'tier2';
  if (str.includes('tier3') || str.includes('biogas')) return 'tier3';
  return 'tier1';
};

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
const normalisasiJumlah = (value: number | string | null | undefined): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};



async function ambilNamaArea(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=14&accept-language=id`);
    const json = await res.json();
    if (json?.address) {
      const a = json.address;
      const bagian = [a.suburb || a.neighbourhood || a.village, a.city_district || a.city || a.town, a.state].filter(Boolean);
      if (bagian.length) return bagian.join(', ');
    }
    return json?.display_name?.split(',').slice(0, 3).join(',') || `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  } catch {
    return `(${lat.toFixed(4)}, ${lng.toFixed(4)})`;
  }
}

// Countdown ini menunjukkan batas waktu pembayaran setelah stok dikunci.
function CountdownPembayaran({ waktuHingga, onSelesai }: { waktuHingga: string; onSelesai?: () => void }) {
  const [sisaDetik, setSisaDetik] = useState(0);
  useEffect(() => {
    const hitung = () => {
      const selisih = Math.max(0, Math.floor((new Date(waktuHingga).getTime() - Date.now()) / 1000));
      setSisaDetik(selisih);
      if (selisih === 0 && onSelesai) onSelesai();
    };
    hitung();
    const t = setInterval(hitung, 1000);
    return () => clearInterval(t);
  }, [waktuHingga]);
  const m = Math.floor(sisaDetik / 60), d = sisaDetik % 60;
  const kritis = sisaDetik < 120;
  return (
    <span className={`font-mono tabular-nums font-black ${kritis ? 'text-rose-500 animate-pulse' : 'text-amber-600 dark:text-amber-400'}`}>
      {String(m).padStart(2, '0')}:{String(d).padStart(2, '0')}
    </span>
  );
}

function CountdownSisaMakanan({ sisaDetik }: { sisaDetik: number }) {
  const [sisa, setSisa] = useState(sisaDetik);
  useEffect(() => {
    const t = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (sisa === 0) return <span className="text-[10px] font-black text-rose-500 flex items-center gap-1"><X className="w-3 h-3" />Habis</span>;
  const jam = Math.floor(sisa / 3600), menit = Math.floor((sisa % 3600) / 60), dtk = sisa % 60;
  const kritis = sisa < 3600;
  return (
    <span className={`flex items-center gap-1 font-mono tabular-nums font-black ${kritis ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
      <Clock className={`w-3 h-3 ${kritis ? 'animate-pulse' : ''}`} />
      {jam > 0 && `${String(jam).padStart(2, '0')}:`}{String(menit).padStart(2, '0')}:{String(dtk).padStart(2, '0')}
    </span>
  );
}

// ============================================================
// Peta dimuat di browser agar Leaflet tidak berjalan saat SSR.
// ============================================================
const PetaKonsumen = dynamic(() => import('@/components/PetaKonsumenCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl">
      <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mb-3" />
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat peta interaktif...</p>
    </div>
  ),
});

// ============================================================
// MODAL CHECKOUT (dengan kunci stok)
// ============================================================
function ModalCheckout({ item, onClose, onProses }: {
  item: LokasiPangan; onClose: () => void; onProses: (jumlah: number) => void;
}) {
  const [jumlah, setJumlah] = useState(1);
  const [tahap, setTahap] = useState<'konfirmasi' | 'membayar' | 'berhasil'>('konfirmasi');
  const [sedangProses, setSedangProses] = useState(false);
  const [pesananBaru, setPesananBaru] = useState<PesananSaya | null>(null);

  const totalHarga = item.hargaDiskon * jumlah;
  const upahKurir = calculateCourierPay(item.tier, jumlah, item.jarakKm);
  const totalPembayaran = totalHarga + upahKurir;

  // Teruskan jumlah porsi yang dipilih ke proses checkout utama.
  const prosesAksi = () => onProses(jumlah);

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={() => !sedangProses && onClose()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        {/* Ringkasan makanan yang akan dibeli. */}
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-6">
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><ShoppingBag className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Checkout Tier 1</p>
                <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">{item.namaMakanan}</h3>
              </div>
            </div>
            <button onClick={onClose} disabled={sedangProses} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer disabled:opacity-50"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* TAHAP: KONFIRMASI */}
          {tahap === 'konfirmasi' && (
            <>
              {/* Info resto */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Store className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{item.namaResto}</p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"><Navigation className="w-3 h-3" />{item.jarakKm.toFixed(1)} km dari Anda</p>
                </div>
              </div>

              {/* Stok info */}
              <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                <span className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300"><Package className="w-4 h-4 text-amber-500" />Stok Tersedia</span>
                <span className="font-black text-amber-600 dark:text-amber-400">{item.stokTersedia} porsi</span>
              </div>

              {/* Pilih jumlah */}
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Jumlah Porsi</p>
                <div className="flex items-center justify-center gap-4">
                  <button onClick={() => setJumlah((j) => Math.max(1, j - 1))} className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-lg transition-all active:scale-90 cursor-pointer">-</button>
                  <span className="text-3xl font-black text-slate-900 dark:text-white w-12 text-center tabular-nums">{jumlah}</span>
                  <button onClick={() => setJumlah((j) => Math.min(item.stokTersedia, j + 1))} className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg transition-all active:scale-90 cursor-pointer shadow-lg shadow-emerald-500/30">+</button>
                </div>
              </div>

              {/* Ringkasan harga */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Harga per porsi</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(item.hargaDiskon)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jumlah</span>
                  <span className="font-bold text-slate-900 dark:text-white">x {jumlah}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Upah kurir</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(upahKurir)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="font-black text-slate-900 dark:text-white">Total</span>
                  <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">{formatRupiah(totalPembayaran)}</span>
                </div>
              </div>

              <button onClick={prosesAksi} disabled={sedangProses} className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 overflow-hidden disabled:opacity-50">
                <span className="absolute inset-0 efek-kilau" />
                <CreditCard className="w-5 h-5 group-hover:scale-110 transition-transform" />
                Terbitkan Misi
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </>
          )}

          {/* TAHAP: MEMBAYAR (loading) */}
          {tahap === 'membayar' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              </div>
              <div>
                <p className="font-black text-lg text-slate-900 dark:text-white">Memproses Pembayaran</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Menerbitkan misi dan mencari kurir terdekat...</p>
              </div>
              <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}

          {/* TAHAP: BERHASIL */}
          {tahap === 'berhasil' && pesananBaru && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 anim-gembira">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>
              <div>
                <p className="font-black text-xl text-slate-900 dark:text-white">Pesanan Dibuat!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kurir akan segera mengambil pesanan Anda.</p>
              </div>
              <div className="w-full p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2 text-left">
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Kode Pesanan</span><span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{pesananBaru.id.slice(0, 8).toUpperCase()}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Status</span><span className="font-bold text-blue-600 dark:text-blue-400">Mencari Kurir...</span></div>
              </div>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                Lacak di "Pesanan Saya"
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL LACAK PESANAN (Pesanan Saya)
// ============================================================
function ModalPesananSaya({ daftarPesanan, onClose, kirimToast, onMuatUlang }: {
  daftarPesanan: PesananSaya[]; onClose: () => void; kirimToast: (t: Notifikasi['tipe'], j: string, p: string) => void; onMuatUlang: () => void;
}) {
  const [statusHandover, setStatusHandover] = useState<Record<string, 'menunggu' | 'diambil' | 'terkirim' | 'terverifikasi'>>({});
  const ambilKodeHandover = (id: string) => {
    if (typeof window === 'undefined') return `PC-HANDOVER-${id}`;
    return window.sessionStorage.getItem(`pc-handover-${id}`) || `PC-HANDOVER-${id}`;
  };

  const batalkanPesanan = async (pesanan: PesananSaya) => {
    if (pesanan.status !== 'menunggu_pembayaran') return;
    const { error: errorPesanan } = await supabase
      .from('pesanan')
      .update({ status: 'dibatalkan' })
      .eq('id', pesanan.id);
    if (errorPesanan) {
      kirimToast('error', 'Gagal Membatalkan', errorPesanan.message);
      return;
    }

    const { data: makanan, error: errorMakanan } = await supabase
      .from('makanan_surplus')
      .select('stok_tersedia')
      .eq('id', pesanan.makananId)
      .single();
    if (errorMakanan || !makanan) {
      kirimToast('error', 'Gagal Mengembalikan Stok', errorMakanan?.message || 'Data makanan tidak ditemukan.');
      return;
    }

    const { error: errorStok } = await supabase
      .from('makanan_surplus')
      .update({ stok_tersedia: (Number(makanan.stok_tersedia) || 0) + pesanan.jumlah })
      .eq('id', pesanan.makananId);
    if (errorStok) {
      kirimToast('error', 'Gagal Mengembalikan Stok', errorStok.message);
      return;
    }

    kirimToast('info', 'Pesanan Dibatalkan', 'Stok telah dikembalikan.');
    onMuatUlang();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><Package className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Riwayat & Lacak</p>
                <h3 className="text-xl font-black text-white tracking-tight">Pesanan Saya</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {daftarPesanan.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Package className="w-8 h-8 text-slate-400" /></div>
              <p className="font-black text-slate-900 dark:text-white">Belum Ada Pesanan</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Yuk mulai belanja makanan surplus!</p>
            </div>
          ) : (
            daftarPesanan.map((p, i) => {
              const cfg = KONFIG_STATUS[p.status];
              const langkahAktif = cfg.langkah;
              return (
                <div key={p.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 anim-slideAtas" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white line-clamp-1">{p.namaMakanan}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{p.namaResto} • {p.jumlah} porsi • Produk {formatRupiah(p.hargaProduk)} • Kurir {formatRupiah(p.upahKurir)}</p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.warna} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`}>
                      <cfg.Icon className="w-3.5 h-3.5" />{cfg.label}
                    </span>
                  </div>

                  {/* Stepper tracking */}
                  {p.status !== 'dibatalkan' && (
                    <div className="flex items-center justify-between mb-4 px-2">
                      {KONFIG_STEPPER.map((step, i) => {
                        const isActive = i < getStepIndex(p.status) - 1;
                        const isCurrent = i === getStepIndex(p.status) - 1;
                        return (
                          <div key={step.key} className="flex-1 flex flex-col items-center relative">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${isActive ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white border-slate-300 text-slate-400'} ${isCurrent ? 'ring-4 ring-emerald-500/30 scale-110' : ''}`}>
                              <step.Icon className="w-4 h-4" />
                            </div>
                            <p className={`text-[9px] font-black mt-2 text-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>{step.label}</p>
                            {i < KONFIG_STEPPER.length - 1 && (
                              <div className={`absolute top-4 left-[60%] w-[80%] h-1 ${isActive ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Countdown pembayaran */}
                  {p.status === 'menunggu_pembayaran' && p.waktuKunciHingga && (
                    <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/50 mb-3">
                      <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"><Timer className="w-4 h-4 text-amber-500" />Selesaikan pembayaran dalam</span>
                      <CountdownPembayaran waktuHingga={p.waktuKunciHingga} onSelesai={onMuatUlang} />
                    </div>
                  )}

                  {p.status === 'menunggu_pembayaran' && (
                    <div className="flex gap-2">
                      <button onClick={() => batalkanPesanan(p)} className="flex-1 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-black transition-all active:scale-[0.98] cursor-pointer">Batalkan</button>
                      <button className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-xs font-black transition-all active:scale-[0.98] cursor-pointer shadow-lg shadow-emerald-500/30">Terbitkan Misi</button>
                    </div>
                  )}

                  {['dibayar', 'sedang_diantar', 'selesai'].includes(p.status) && (
                    <div className="mt-4 space-y-3 rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">QR Handover (Kurir Ambil)</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Tunjukkan QR ini ke Kurir untuk menyelesaikan misi</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                          {statusHandover[p.id] || 'menunggu'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-2">
                          <QRCodeMini value={ambilKodeHandover(p.id)} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] font-black text-slate-900 dark:text-white break-all">{ambilKodeHandover(p.id)}</p>
                          {p.status === 'dibayar' && (
                            <button
                              type="button"
                              onClick={() => {
                                setStatusHandover((prev) => ({ ...prev, [p.id]: 'diambil' }));
                                kirimToast('sukses', 'Makanan Sudah Diambil Kurir', `${p.namaMakanan} telah diambil oleh kurir.`);
                              }}
                              className="mt-2 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <Bike className="w-3.5 h-3.5" /> Simulasikan Scan Kurir
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {p.status === 'sedang_diantar' && (
                    <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-center">
                      <p className="text-xs text-amber-800 font-bold mb-3">Kurir telah menjemput dari Merchant. Tunjukkan QR ini ke Kurir untuk menyelesaikan misi.</p>
                      <div className="flex justify-center bg-white p-4 rounded-xl shadow-inner mb-4">
                        <QRCodePremium value={`PC-RECEIVE-${p.id}`} size={180} />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await supabase
                              .from('pesanan')
                              .update({ status: 'selesai' })
                              .eq('id', p.id);

                            await supabase
                              .from('misi_kurir')
                              .update({ status: 'selesai' })
                              .eq('makanan_id', p.makananId)
                              .eq('status', 'sedang_diantar');

                            setStatusHandover((prev) => ({ ...prev, [p.id]: 'terverifikasi' }));
                            kirimToast('sukses', 'Misi Selesai!', 'Pangan telah diterima. Dampak ESG tercatat.');
                            onMuatUlang();
                          } catch (err) {
                            kirimToast('error', 'Gagal Update Status', 'Silakan coba lagi.');
                          }
                        }}
                        className="w-full py-3 bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center gap-2"
                      >
                        <ScanLine className="w-5 h-5" /> Simulasikan Kurir Scan QR Saya
                      </button>
                    </div>
                  )}

                  {p.status === 'selesai' && (
                    <div className="mt-3 space-y-3 rounded-2xl border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-950/20 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">QR Verifikasi (Pelanggan)</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Pindai kode ini untuk verifikasi penerimaan makanan</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-1 text-[9px] font-black text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                          terverifikasi
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="rounded-2xl bg-white p-2">
                          <QRCodeMini value={`PC-DELIVERY-${p.id}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[10px] font-black text-slate-900 dark:text-white break-all">PC-DELIVERY-{p.id}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// KOMPONEN UTAMA
// ============================================================
export default function DashboardKonsumenUmum() {
  // Dashboard ini mengatur katalog makanan, lokasi konsumen, dan pesanan.
  const { resolvedTheme } = useTheme();
  const [lokasiKonsumen, setLokasiKonsumen] = useState<[number, number]>([-6.2088, 106.8456]);
  const [namaArea, setNamaArea] = useState('Jakarta Pusat');
  const [pusatPeta, setPusatPeta] = useState<[number, number]>([-6.2088, 106.8456]);
  const [zoomPeta, setZoomPeta] = useState(13);
  const [radiusKm, setRadiusKm] = useState(3);
  const [kataKunci, setKataKunci] = useState('');
  const [teksLokasi, setTeksLokasi] = useState('');
  const [filterTier, setFilterTier] = useState<'semua' | 'tier1'>('semua');
  const [daftarPangan, setDaftarPangan] = useState<LokasiPangan[]>([]);
  const [daftarPesanan, setDaftarPesanan] = useState<PesananSaya[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMencariLokasi, setSedangMencariLokasi] = useState(false);
  const [sedangMemproses, setSedangMemproses] = useState(false);
  const [itemCheckout, setItemCheckout] = useState<LokasiPangan | null>(null);
  const [bukaPesananSaya, setBukaPesananSaya] = useState(false);
  const [daftarNotifikasi, setDaftarNotifikasi] = useState<Notifikasi[]>([]);

  const kirimToast = useCallback((tipe: Notifikasi['tipe'], judul: string, pesan: string) => {
    const id = Date.now() + Math.random();
    setDaftarNotifikasi((s) => [...s, { id, tipe, judul, pesan }]);
    setTimeout(() => setDaftarNotifikasi((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);

  // ----------------------------------------------------------
// MUAT DATA MAKANAN (dengan bersihkan pesanan expired)
// ----------------------------------------------------------
const muatData = useCallback(async () => {
  // Ambil makanan yang masih tersedia untuk ditampilkan di katalog.
  setSedangMemuat(true);
  try {
    // Bersihkan pesanan expired & kembalikan stok
    try {
      await supabase.rpc('batalkan_pesanan_expired');
    } catch (rpcError) {
      // Ignore error jika fungsi RPC tidak ada
      console.warn('RPC batalkan_pesanan_expired tidak tersedia:', rpcError);
    }

    const { data, error } = await supabase.from('makanan_surplus').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (data) {
      const valid = data
        .filter((d) => d.latitude && d.longitude && d.status_aktif !== false)
        .filter((d) => konversiTier(d.kategori_tier) === 'tier1')
        .filter((d) => normalisasiJumlah(d.stok_tersedia ?? d.stok ?? d.berat_kg ?? 0) > 0)
        .map((d, i) => {
          const dibuat = new Date(d.created_at ?? Date.now()).getTime();
          const sisaMs = dibuat + 6 * 3600 * 1000 - Date.now();
          const hargaDiskon = Number(d.harga_diskon) || 0;
          return {
            id: d.id,
            namaMakanan: d.nama_makanan || 'Paket Pangan',
            namaResto: d.nama_resto || d.merchant_name || 'Restoran Mitra',
            alamat: d.alamat_resto || 'Alamat tidak tersedia',
            tier: konversiTier(d.kategori_tier),
            hargaDiskon,
            hargaAsli: hargaDiskon ? Math.round(hargaDiskon * 2) : 0,
            stokTersedia: normalisasiJumlah(d.stok_tersedia ?? d.stok ?? d.berat_kg ?? 1),
            sisaDetik: Math.max(0, Math.floor(sisaMs / 1000)),
            lintang: Number(d.latitude),
            bujur: Number(d.longitude),
            rating: 4.5 + (i % 5) * 0.1,
            jarakKm: 0,
          };
        });
      setDaftarPangan(valid);
    }
  } catch (err) {
    console.error('Gagal memuat data:', err);
    kirimToast('error', 'Gagal Memuat Data', 'Periksa koneksi Anda.');
  } finally {
    setSedangMemuat(false);
  }
}, [kirimToast]);

  // ----------------------------------------------------------
  // MUAT PESANAN SAYA
  // ----------------------------------------------------------
  const muatPesananSaya = useCallback(async () => {
    // Ambil riwayat pesanan milik konsumen yang sedang login.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('pesanan')
        .select(`*, makanan_surplus(nama_makanan, nama_resto)`)
        .eq('konsumen_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        setDaftarPesanan(data.map((p: any) => ({
          id: p.id,
          makananId: p.makanan_id,
          namaMakanan: p.makanan_surplus?.nama_makanan || 'Pesanan',
          namaResto: p.makanan_surplus?.nama_resto || 'Restoran',
          jumlah: p.jumlah,
          hargaProduk: Number(p.harga_produk) || 0,
          upahKurir: Number(p.upah_kurir) || 0,
          totalHarga: p.total_harga,
          status: p.status,
          waktuKunciHingga: p.waktu_kunci_hingga,
          dibuatPada: p.created_at,
        })));
      }
    } catch (err) {
      console.error('Gagal memuat pesanan:', err);
    }
  }, []);

  useEffect(() => {
    // Refresh berkala menjaga stok dan status pesanan tetap terbaru.
    muatData();
    muatPesananSaya();
    // Refresh berkala untuk bersihkan expired
    const t = setInterval(() => { muatData(); muatPesananSaya(); }, 30000);
    return () => clearInterval(t);
  }, [muatData, muatPesananSaya]);

  // Realtime: pesanan/misi berubah -> refresh
  useEffect(() => {
    // Perubahan stok atau pesanan diterima langsung dari Supabase.
    const channel = supabase.channel('konsumen-umum-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'makanan_surplus' }, () => muatData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' }, () => { muatPesananSaya(); muatData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [muatData, muatPesananSaya]);

  // Filter + hitung jarak + urutkan terdekat (design: prioritas terdekat)
  const daftarDenganJarak = useMemo(() => daftarPangan.map((item) => ({
    ...item,
    jarakKm: hitungJarakKm(lokasiKonsumen[0], lokasiKonsumen[1], item.lintang, item.bujur),
  })), [daftarPangan, lokasiKonsumen]);

  const daftarTersaring = useMemo(() => {
    // Filter berdasarkan nama makanan, alamat, dan tier yang dipilih.
    const kata = kataKunci.toLowerCase();
    return daftarDenganJarak
      .filter((item) => item.stokTersedia > 0)
      .filter((item) => item.jarakKm <= radiusKm)
      .filter((item) => item.namaMakanan.toLowerCase().includes(kata) || item.namaResto.toLowerCase().includes(kata))
      .filter((item) => filterTier === 'semua' || item.tier === filterTier)
      .sort((a, b) => a.jarakKm - b.jarakKm);
  }, [daftarDenganJarak, radiusKm, kataKunci, filterTier]);

  const statistik = useMemo(() => {
    const t1 = daftarTersaring.filter((i) => i.tier === 'tier1').length;
    const totalHemat = daftarTersaring.reduce((acc, i) => acc + (i.hargaAsli - i.hargaDiskon), 0);
    return { total: daftarTersaring.length, t1, totalHemat };
  }, [daftarTersaring]);

  // Lokasi fleksibel
  const terapkanLokasi = useCallback(async (lat: number, lng: number, sumber: string) => {
    setLokasiKonsumen([lat, lng]);
    setPusatPeta([lat, lng]);
    setZoomPeta(14);
    const nama = await ambilNamaArea(lat, lng);
    setNamaArea(nama);
    kirimToast('sukses', `Lokasi Diperbarui (${sumber})`, nama);
  }, [kirimToast]);

  const gunakanGPS = () => {
    // Lokasi perangkat dipakai untuk mengurutkan makanan berdasarkan jarak.
    if (!navigator.geolocation) return kirimToast('error', 'Tidak Didukung', 'Browser tidak mendukung GPS.');
    setSedangMencariLokasi(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { terapkanLokasi(pos.coords.latitude, pos.coords.longitude, 'GPS'); setSedangMencariLokasi(false); },
      () => { kirimToast('error', 'GPS Gagal', 'Izin lokasi ditolak.'); setSedangMencariLokasi(false); }
    );
  };

  const cariLokasiTeks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teksLokasi.trim()) return;
    setSedangMencariLokasi(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&accept-language=id&q=${encodeURIComponent(teksLokasi)}`);
      const json = await res.json();
      if (json.length > 0) { await terapkanLokasi(parseFloat(json[0].lat), parseFloat(json[0].lon), 'Pencarian'); setTeksLokasi(''); }
      else kirimToast('error', 'Tidak Ditemukan', `Tidak ada hasil untuk "${teksLokasi}".`);
    } catch { kirimToast('error', 'Pencarian Gagal', 'Periksa koneksi internet.'); }
    finally { setSedangMencariLokasi(false); }
  };

  const prosesAksi = async (item: LokasiPangan, jumlah: number) => {
    // Kunci stok, buat pesanan, lalu siapkan misi untuk kurir.
    setSedangMemproses(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        kirimToast('error', 'Belum Login', 'Silakan login untuk membeli produk.');
        return;
      }
      if (jumlah <= 0 || jumlah > item.stokTersedia) {
        kirimToast('error', 'Stok Tidak Cukup', `Jumlah yang diminta melebihi stok yang tersedia (${item.stokTersedia} pcs).`);
        return;
      }

      const { data: berhasilKunci, error: errKunci } = await supabase.rpc('kunci_stok_makanan', {
        p_makanan_id: item.id,
        p_jumlah: jumlah,
      });
      if (errKunci || !berhasilKunci) {
        throw new Error('Stok baru saja habis. Silakan pilih jumlah lain.');
      }

      const totalHarga = item.hargaDiskon * jumlah;
      const upahKurir = calculateCourierPay(item.tier, jumlah, item.jarakKm);
      const { data: pesanan, error: errPesanan } = await supabase
        .from('pesanan')
        .insert([{
          makanan_id: item.id,
          konsumen_id: user.id,
          konsumen_email: user.email,
          konsumen_nama: user.user_metadata?.full_name || 'Konsumen Umum',
          jumlah,
          harga_produk: totalHarga,
          upah_kurir: upahKurir,
          total_harga: totalHarga + upahKurir,
          status: 'dibayar',
          waktu_kunci_hingga: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();
      if (errPesanan) throw errPesanan;

      const kodeHandover = `PC-HANDOVER-${item.id}-${Date.now().toString(36).toUpperCase()}`;
      if (typeof window !== 'undefined') window.sessionStorage.setItem(`pc-handover-${pesanan.id}`, kodeHandover);

      await buatMisiKurir({ ...item, stok: jumlah }, 'konsumen', lokasiKonsumen, pesanan.id);
      kirimToast('sukses', 'Misi Diterbitkan', `Misi "${item.namaMakanan}" berhasil dibuat untuk ${jumlah} pcs.`);
      setDaftarPangan((s) => s.map((p) => p.id === item.id ? { ...p, stokTersedia: Math.max(0, p.stokTersedia - jumlah) } : p).filter((p) => p.stokTersedia > 0));
      setItemCheckout(null);
    } catch (err: any) {
      kirimToast('error', 'Gagal Membuat Misi', err.message || 'Coba lagi.');
    } finally {
      setSedangMemproses(false);
    }
  };

  const pilihItem = useCallback((item: LokasiPangan) => {
    setPusatPeta([item.lintang, item.bujur]);
    setZoomPeta(16);
    setItemCheckout(item);
  }, []);

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideAtas { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
        @keyframes slideKanan { from { opacity: 0; transform: translateX(110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes skalaMasuk { from { opacity: 0; transform: scale(.94) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes kilau { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        @keyframes gembira { 0% { transform: scale(0) rotate(-12deg) } 60% { transform: scale(1.15) rotate(4deg) } 100% { transform: scale(1) rotate(0) } }
        @keyframes gelombang { 0%,100% { transform: scale(1); opacity: .5 } 50% { transform: scale(1.05); opacity: 1 } }
        .anim-fadeIn { animation: fadeIn .4s ease-out both }
        .anim-slideAtas { animation: slideAtas .5s cubic-bezier(.22,1,.36,1) both }
        .anim-slideKanan { animation: slideKanan .5s cubic-bezier(.22,1,.36,1) both }
        .anim-skalaMasuk { animation: skalaMasuk .45s cubic-bezier(.34,1.56,.64,1) both }
        .anim-gembira { animation: gembira .7s cubic-bezier(.34,1.56,.64,1) both }
        .anim-gelombang { animation: gelombang 2.5s ease-in-out infinite }
        .efek-kilau { background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.3) 50%, transparent 60%); background-size: 200% 100%; animation: kilau 3s linear infinite }
        .scroll-tipis::-webkit-scrollbar { width: 6px }
        .scroll-tipis::-webkit-scrollbar-thumb { background: linear-gradient(#10b981,#14b8a6); border-radius: 8px }
        .scroll-tipis::-webkit-scrollbar-track { background: transparent }
      `}</style>

      {/* TOAST */}
      <div className="fixed top-5 right-5 z-[200] space-y-3 w-[min(92vw,380px)] pointer-events-none">
        {daftarNotifikasi.map((n) => {
          const cfg = {
            sukses: { Icon: CheckCircle2, warna: 'text-emerald-500', border: 'border-emerald-300 dark:border-emerald-700' },
            info: { Icon: Info, warna: 'text-blue-500', border: 'border-blue-300 dark:border-blue-700' },
            error: { Icon: AlertCircle, warna: 'text-rose-500', border: 'border-rose-300 dark:border-rose-700' },
          }[n.tipe];
          return (
            <div key={n.id} className={`anim-slideKanan bg-white dark:bg-slate-900 border ${cfg.border} rounded-2xl p-4 shadow-2xl flex gap-3 pointer-events-auto`}>
              <div className={`p-2 h-fit rounded-xl bg-slate-100 dark:bg-slate-800 ${cfg.warna}`}><cfg.Icon className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-slate-900 dark:text-white">{n.judul}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{n.pesan}</p>
              </div>
              <button onClick={() => setDaftarNotifikasi((s) => s.filter((t) => t.id !== n.id))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white h-fit cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>

      {/* MODAL CHECKOUT */}
      {itemCheckout && (
        <ModalCheckout
          item={itemCheckout}
          onClose={() => setItemCheckout(null)}
          onProses={(jumlah) => prosesAksi(itemCheckout, jumlah)}
        />
      )}

      {/* MODAL PESANAN SAYA */}
      {bukaPesananSaya && (
        <ModalPesananSaya
          daftarPesanan={daftarPesanan}
          onClose={() => setBukaPesananSaya(false)}
          kirimToast={kirimToast}
          onMuatUlang={() => { muatPesananSaya(); muatData(); }}
        />
      )}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 anim-fadeIn">
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 rounded-3xl shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute -top-20 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl anim-gelombang" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white"><ShoppingBag className="w-7 h-7" /></div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 mb-1 flex items-center gap-1.5">
                  <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-white animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-white" /></span>
                  Marketplace Surplus
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Belanja Hemat, Selamatkan Pangan</h1>
                <p className="text-xs text-emerald-50 mt-1 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" />Lokasi Anda: <strong className="text-white">{namaArea}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="grid grid-cols-2 gap-2 flex-1 lg:flex-none">
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{statistik.total}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100">Item Dekat</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{statistik.t1}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100">Bisa Dibeli</p>
                </div>
              </div>
              <button onClick={() => setBukaPesananSaya(true)} className="relative flex items-center gap-2 bg-white/95 hover:bg-white text-slate-900 font-bold px-4 py-3 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer shadow-lg">
                <Package className="w-5 h-5 text-emerald-600" />
                <span className="hidden sm:inline">Pesanan Saya</span>
                {daftarPesanan.filter((p) => p.status === 'menunggu_pembayaran' || p.status === 'dibayar' || p.status === 'sedang_diantar').length > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">
                    {daftarPesanan.filter((p) => ['menunggu_pembayaran', 'dibayar', 'sedang_diantar'].includes(p.status)).length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} placeholder="Cari makanan atau resto..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm transition-all" />
            </div>
            <form onSubmit={cariLokasiTeks} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="text" value={teksLokasi} onChange={(e) => setTeksLokasi(e.target.value)} placeholder="Pindah kota/daerah..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all" />
              </div>
              <button type="submit" disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}<span className="hidden sm:inline">Cari</span>
              </button>
              <button type="button" onClick={gunakanGPS} disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}<span className="hidden sm:inline">GPS Saya</span>
              </button>
            </form>
          </div>
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              <Crosshair className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 shrink-0">RADIUS:</span>
              {[1, 3, 5, 10].map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${radiusKm === r ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>{r} KM</button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <button onClick={() => setFilterTier('semua')} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterTier === 'semua' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>Semua</button>
              {(['semua', 'tier1'] as const).map((t) => {
                const konfig = t === 'semua' ? { gradasi: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/30', warnaLatarLembut: 'bg-emerald-50 dark:bg-emerald-950/30', warnaTeks: 'text-emerald-600 dark:text-emerald-400', warnaBorder: 'border-emerald-200 dark:border-emerald-700/40', Icon: ShoppingBag, label: 'Semua' } : KONFIG_TIER[t];
                const aktif = filterTier === t;
                return (
                  <button key={t} onClick={() => setFilterTier(t)} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${aktif ? `bg-gradient-to-r ${konfig.gradasi} text-white shadow-md ${konfig.glow}` : `${konfig.warnaLatarLembut} ${konfig.warnaTeks} border ${konfig.warnaBorder}`}`}>
                    <konfig.Icon className="w-3 h-3" />{konfig.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* GRID: PETA + LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-sm h-[520px] lg:h-[640px]">
            <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 pointer-events-auto shadow-lg">
                <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" /></span>
                {sedangMemuat ? 'Memuat...' : `${statistik.total} pangan dalam ${radiusKm} km`}
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 pointer-events-auto shadow-lg">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" />Diskon</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />Donasi</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-cyan-500" />Biogas</span>
              </div>
            </div>
            <PetaKonsumen daftarPangan={daftarTersaring} lokasiKonsumen={lokasiKonsumen} radiusKm={radiusKm} pusatPeta={pusatPeta} zoomPeta={zoomPeta} itemTerpilih={null} onPilihItem={(item) => pilihItem(item as LokasiPangan)} onKlikPeta={(lat, lng) => terapkanLokasi(lat, lng, 'Klik Peta')} theme={resolvedTheme} />
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />Klik titik mana pun di peta untuk memindahkan lokasi Anda
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" />Terdekat dari Anda</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diurutkan dari yang paling dekat</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">{daftarTersaring.length} item</span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-tipis space-y-3 pr-1 -mr-1 max-h-[560px] lg:max-h-[580px]">
              {sedangMemuat ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Mengambil pangan dari merchant sekitar...</p>
                </div>
              ) : daftarTersaring.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-8 h-8 text-slate-400" /></div>
                  <p className="font-black text-sm text-slate-900 dark:text-white mb-1">Tidak ada pangan dalam radius ini</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Perluas radius atau pindah lokasi.</p>
                  <button onClick={() => setRadiusKm(10)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black cursor-pointer active:scale-95 transition-all">Perluas ke 10 KM</button>
                </div>
              ) : (
                daftarTersaring.map((item, index) => {
                  const konfig = KONFIG_TIER[item.tier];
                  const habis = item.stokTersedia <= 0;
                  return (
                    <div key={item.id} className={`w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer group anim-slideAtas ${habis ? 'opacity-50' : ''}`} style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }} onClick={() => !habis && pilihItem(item)}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${konfig.gradasi} flex items-center justify-center text-white shrink-0 shadow-md`}><konfig.Icon className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.namaMakanan}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5"><Store className="w-3 h-3" /><span className="truncate">{item.namaResto}</span></p>
                          </div>
                        </div>
                        {habis ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40">HABIS</span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40">SISA {item.stokTersedia}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400"><Navigation className="w-3 h-3" />{item.jarakKm.toFixed(1)} km</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="font-bold">{item.rating.toFixed(1)}</span></span>
                        <div className="ml-auto"><CountdownSisaMakanan sisaDetik={item.sisaDetik} /></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        {item.tier === 'tier1' ? (
                          <div>
                            {item.hargaAsli > 0 && <span className="text-[10px] line-through text-slate-400">{formatRupiah(item.hargaAsli)}</span>}
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">{formatRupiah(item.hargaDiskon)}</p>
                          </div>
                        ) : item.tier === 'tier2' ? (
                          <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5"><Heart className="w-4 h-4" />Gratis</p>
                        ) : (
                          <p className="text-sm font-black text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5"><Zap className="w-4 h-4" />Free Pickup</p>
                        )}
                        {item.tier === 'tier1' ? (
                          <button onClick={(e) => { e.stopPropagation(); !habis && pilihItem(item); }} disabled={habis} className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${konfig.gradasi} text-white text-[10px] font-black shadow-md ${konfig.glow} transition-all active:scale-95 ${habis ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}`}>
                            <ShoppingBag className="w-3 h-3" />Beli Sekarang
                          </button>
                        ) : (
                          <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${konfig.gradasi} text-white text-[10px] font-black shadow-md ${konfig.glow}`}>
                            <konfig.Icon className="w-3 h-3" />{item.tier === 'tier2' ? 'Klaim' : 'Info'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}