'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { calculateCourierPay, calculateSocialPrice } from '@/lib/courier';
import { useTheme } from '@/components/theme-provider';
import { QRCodeMini, QRCodePremium } from '@/components/QrCode';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, HeartHandshake, ShieldCheck, Clock,
  Leaf, Heart, X, Navigation, ChevronRight, Bike, Store, Star,
  CheckCircle2, Loader2, AlertCircle, Package, Wind, Users,
  Crosshair, Info, LocateFixed, SearchCode, FileCheck2,
  Ban, Truck, PackageCheck, Timer, ArrowRight,
  ShoppingBag, Coins, Minus, Plus, Receipt, History,
  ScanLine
} from 'lucide-react';

// Tipe data ini menyamakan bentuk makanan, klaim, dan status pengiriman.
// ============================================================
// TIPE DATA
// ============================================================
export interface LokasiPangan {
  id: string | number;
  namaMakanan: string;
  namaResto: string;
  alamat: string;
  tier: 'tier1' | 'tier2' | 'tier3';
  hargaDiskon?: number;
  hargaAsli?: number;
  hargaSosial?: number; // Harga khusus panti untuk Tier 1
  stokTersedia: number;
  sisaDetik: number;
  kategori: string;
  lintang: number;
  bujur: number;
  rating: number;
  jarakKm: number;
}

type StatusKlaim = 'dibayar' | 'sedang_diantar' | 'selesai' | 'dibatalkan' | 'menunggu_pembayaran';

interface KlaimSaya {
  id: string;
  makananId: string;
  namaMakanan: string;
  namaResto: string;
  jumlahPenerima: number;
  totalHarga: number;
  tier: 'tier1' | 'tier2' | 'tier3';
  status: StatusKlaim;
  dibuatPada: string;
}

interface Notifikasi {
  id: number;
  tipe: 'sukses' | 'info' | 'error';
  judul: string;
  pesan: string;
}

const KONFIG_STATUS: Record<StatusKlaim, { label: string; warna: string; Icon: any; langkah: number }> = {
  menunggu_pembayaran: { label: 'Menunggu Pembayaran', warna: 'text-amber-600 dark:text-amber-400', Icon: Timer, langkah: 1 },
  dibayar: { label: 'Menunggu Relawan', warna: 'text-blue-600 dark:text-blue-400', Icon: Timer, langkah: 2 },
  sedang_diantar: { label: 'Sedang Diantar', warna: 'text-cyan-600 dark:text-cyan-400', Icon: Truck, langkah: 3 },
  selesai: { label: 'Selesai', warna: 'text-emerald-600 dark:text-emerald-400', Icon: PackageCheck, langkah: 4 },
  dibatalkan: { label: 'Dibatalkan', warna: 'text-rose-600 dark:text-rose-400', Icon: Ban, langkah: 0 },
};

// Urutan langkah yang dipakai untuk menampilkan progress klaim.
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

// Fungsi bantuan untuk jarak, harga, tanggal, dan nama area.
const hitungJarakKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const konversiTier = (kategori: string): 'tier1' | 'tier2' | 'tier3' => {
  const str = (kategori || '').toLowerCase();
  if (str.includes('tier2') || str.includes('donasi')) return 'tier2';
  if (str.includes('tier3') || str.includes('biogas')) return 'tier3';
  return 'tier1';
};

const formatRupiah = (n: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);

const dapatkanAwalMinggu = (): Date => {
  const sekarang = new Date();
  const hari = sekarang.getDay();
  const selisih = hari === 0 ? -6 : 1 - hari;
  sekarang.setDate(sekarang.getDate() + selisih);
  sekarang.setHours(0, 0, 0, 0);
  return sekarang;
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

// Hitung mundur memberi tahu kapan waktu klaim makanan berakhir.
function TampilanCountdown({ sisaDetik }: { sisaDetik: number }) {
  const [sisa, setSisa] = useState(sisaDetik);
  useEffect(() => {
    const t = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (sisa === 0) return <span className="text-[10px] font-black text-rose-500 flex items-center gap-1"><X className="w-3 h-3" /> Berakhir</span>;
  const jam = Math.floor(sisa / 3600), menit = Math.floor((sisa % 3600) / 60), dtk = sisa % 60;
  const kritis = sisa < 3600;
  return (
    <span className={`flex items-center gap-1 font-mono tabular-nums font-black ${kritis ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
      <Clock className={`w-3 h-3 ${kritis ? 'animate-pulse' : ''}`} />
      {jam > 0 && `${String(jam).padStart(2, '0')}:`}{String(menit).padStart(2, '0')}:{String(dtk).padStart(2, '0')}
    </span>
  );
}

// Leaflet hanya dimuat di browser agar aman saat proses SSR.
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
// MODAL KLAIM DONASI (TIER 2 - GRATIS) — DIPERBAIKI
// ============================================================
function ModalKlaimDonasi({ item, sisaKuota, onClose, onSukses, kirimToast }: {
  item: LokasiPangan;
  sisaKuota: number;
  onClose: () => void;
  onSukses: () => void;
  kirimToast: (t: Notifikasi['tipe'], j: string, p: string) => void;
}) {
  // Klaim dimulai dari satu dan dibatasi oleh kuota mingguan.
  const [jumlahPenerima, setJumlahPenerima] = useState(1);
  const [catatan, setCatatan] = useState('');
  const [sedangProses, setSedangProses] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  const kuotaHabis = sisaKuota <= 0;
  const upahKurir = calculateCourierPay('tier2', 1, item.jarakKm);

  const prosesKlaim = async () => {
    if (kuotaHabis) {
      kirimToast('error', 'Kuota Mingguan Habis', 'Anda telah mencapai batas klaim minggu ini.');
      return;
    }
    setSedangProses(true);
    try {
      // Stok dikunci dulu agar tidak diklaim oleh panti lain secara bersamaan.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        kirimToast('error', 'Belum Login', 'Silakan login sebagai panti.');
        setSedangProses(false);
        return;
      }
      await supabase.rpc('batalkan_pesanan_expired');
      const { data: berhasilKunci, error: errKunci } = await supabase.rpc('kunci_stok_makanan', {
        p_makanan_id: item.id,
        p_jumlah: 1,
      });
      if (errKunci || !berhasilKunci) {
        kirimToast('error', 'Stok Habis', 'Maaf, donasi ini baru saja diklaim panti lain.');
        setSedangProses(false);
        return;
      }
      const { data: pesanan, error: errPesanan } = await supabase
        .from('pesanan')
        .insert([{
          makanan_id: item.id,
          konsumen_id: user.id,
          konsumen_email: user.email,
          konsumen_nama: `Panti (${jumlahPenerima} penerima)`,
          jumlah: 1,
          upah_kurir: upahKurir,
          total_harga: upahKurir,
          status: 'dibayar',
          waktu_kunci_hingga: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        }])
        .select()
        .single();
      if (errPesanan) throw errPesanan;
      // Pesanan yang sudah dibuat ditawarkan kepada kurir.
      const { error: errMisi } = await supabase.from('misi_kurir').insert([{
        pesanan_id: pesanan.id,
        makanan_id: item.id,
        nama_makanan: item.namaMakanan,
        resto_asal: item.namaResto,
        alamat_jemput: item.alamat,
        alamat_antar: 'Alamat Panti (terverifikasi)',
        lat_jemput: item.lintang,
        lng_jemput: item.bujur,
        imbalan: calculateCourierPay('tier2', 1, item.jarakKm),
        status: 'terbuka',
        waktu_ditawarkan_hingga: new Date(Date.now() + 30 * 1000).toISOString(),
      }]);
      if (errMisi) console.error('Gagal buat misi kurir:', errMisi);
      setBerhasil(true);
      kirimToast('sukses', 'Donasi Berhasil Diklaim', 'Relawan sedang dicari untuk mengantar donasi.');
      onSukses();
    } catch (err: any) {
      kirimToast('error', 'Terjadi Kesalahan', err.message || 'Gagal memproses klaim donasi.');
    } finally {
      setSedangProses(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={() => !sedangProses && onClose()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 p-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><HeartHandshake className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Klaim Donasi Tier 2</p>
                <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">{item.namaMakanan}</h3>
              </div>
            </div>
            <button onClick={onClose} disabled={sedangProses} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer disabled:opacity-50"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {berhasil ? (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 anim-gembira">
                  <HeartHandshake className="w-10 h-10" />
                </div>
              </div>
              <div>
                <p className="font-black text-xl text-slate-900 dark:text-white">Donasi Terkonfirmasi!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Relawan akan segera mengantar ke panti Anda.</p>
              </div>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                Lihat di "Log Klaim" <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {kuotaHabis && (
                <div className="flex items-start gap-3 p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 rounded-2xl">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-black text-sm text-slate-900 dark:text-white">Kuota Mingguan Habis</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Batas klaim minggu ini telah tercapai.</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Store className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{item.namaResto}</p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"><Navigation className="w-3 h-3" /> {item.jarakKm.toFixed(1)} km dari panti</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"><FileCheck2 className="w-4 h-4 text-emerald-500" /> Sisa Kuota</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">{sisaKuota}x</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300"><Package className="w-4 h-4 text-slate-400" /> Stok</span>
                  <span className="font-black text-slate-900 dark:text-white">{item.stokTersedia}</span>
                </div>
              </div>

              {/* ✅ FIX: Increment 1 per klik, max = sisaKuota */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-emerald-500" /> Jumlah Penerima di Panti
                  <span className="ml-auto text-[9px] text-slate-400 font-normal normal-case">Maks: {sisaKuota} klaim</span>
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setJumlahPenerima((j) => Math.max(1, j - 1))}
                    disabled={jumlahPenerima <= 1}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-lg transition-all active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                  <span className="text-3xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{jumlahPenerima}</span>
                  <button
                    onClick={() => setJumlahPenerima((j) => Math.min(sisaKuota, j + 1))}
                    disabled={jumlahPenerima >= sisaKuota}
                    className="w-11 h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg transition-all active:scale-90 cursor-pointer shadow-lg shadow-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                {jumlahPenerima >= sisaKuota && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 text-center font-bold">
                    ⚠️ Mencapai batas kuota mingguan ({sisaKuota}x)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Catatan (Opsional)</label>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Misal: Mohon diantar sebelum jam 12 siang..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm transition-all resize-none" />
              </div>
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                <Leaf className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300">Klaim ini menyelamatkan <strong className="text-emerald-600 dark:text-emerald-400">{((typeof item.stokTersedia === 'number' ? item.stokTersedia : 1) * 2.5).toFixed(1)} kg CO₂e</strong> dari limbah pangan.</p>
              </div>
              <div className="flex justify-between items-center p-4 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                <span className="text-sm font-black text-slate-700 dark:text-slate-300">Upah kurir (produk gratis)</span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(upahKurir)}</span>
              </div>
              <button onClick={prosesKlaim} disabled={sedangProses || kuotaHabis}
                className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden">
                <span className="absolute inset-0 efek-kilau" />
                {sedangProses ? (<><Loader2 className="w-5 h-5 animate-spin" /> Memproses Klaim...</>) : (<><HeartHandshake className="w-5 h-5 group-hover:scale-110 transition-transform" /> Klaim Donasi Sekarang <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>)}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL BELI TIER 1 (HARGA SOSIAL PANTI) — BARU
// ============================================================
function ModalBeliHargaSosial({ item, sisaKuota, onClose, onSukses, kirimToast }: {
  item: LokasiPangan;
  sisaKuota: number;
  onClose: () => void;
  onSukses: () => void;
  kirimToast: (t: Notifikasi['tipe'], j: string, p: string) => void;
}) {
  const [jumlah, setJumlah] = useState(1);
  const [tahap, setTahap] = useState<'konfirmasi' | 'membayar' | 'berhasil'>('konfirmasi');
  const [sedangProses, setSedangProses] = useState(false);

  const kuotaHabis = sisaKuota <= 0;
  // Gunakan harga khusus panti, atau hitung 10% dari harga asli sebagai cadangan.
  const hargaSosial = item.hargaSosial || calculateSocialPrice(item.hargaAsli || 25000);
  const totalHargaMakanan = hargaSosial * jumlah;
  const upahKurir = calculateCourierPay('tier1', jumlah, item.jarakKm);
  const totalHarga = totalHargaMakanan + upahKurir;

  const kunciDanBayar = async () => {
    if (kuotaHabis) {
      kirimToast('error', 'Kuota Mingguan Habis', 'Batas pembelian harga sosial minggu ini tercapai.');
      return;
    }
    setSedangProses(true);
    setTahap('membayar');
    try {
      // Kunci stok sebelum proses pembayaran dimulai.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        kirimToast('error', 'Belum Login', 'Silakan login sebagai panti.');
        setTahap('konfirmasi');
        setSedangProses(false);
        return;
      }
      try { await supabase.rpc('batalkan_pesanan_expired'); } catch {}
      const { data: berhasilKunci, error: errKunci } = await supabase.rpc('kunci_stok_makanan', {
        p_makanan_id: item.id,
        p_jumlah: jumlah,
      });
      if (errKunci || !berhasilKunci) {
        kirimToast('error', 'Stok Tidak Cukup', 'Maaf, stok baru saja habis dipesan panti lain.');
        setTahap('konfirmasi');
        setSedangProses(false);
        return;
      }
      const waktuKunci = new Date(Date.now() + 10 * 60 * 1000).toISOString();
      const { data: pesanan, error: errPesanan } = await supabase
        .from('pesanan')
        .insert([{
          makanan_id: item.id,
          konsumen_id: user.id,
          konsumen_email: user.email,
          konsumen_nama: `Panti (Harga Sosial - ${jumlah} porsi)`,
          jumlah,
          upah_kurir: upahKurir,
          total_harga: totalHarga,
          status: 'menunggu_pembayaran',
          waktu_kunci_hingga: waktuKunci,
        }])
        .select()
        .single();
      if (errPesanan) throw errPesanan;
      // Simulasi pembayaran sebelum status pesanan diubah menjadi dibayar.
      await new Promise((r) => setTimeout(r, 2000));
      const { error: errUpdate } = await supabase
        .from('pesanan')
        .update({ status: 'dibayar', updated_at: new Date().toISOString() })
        .eq('id', pesanan.id);
      if (errUpdate) throw errUpdate;
      // Setelah pembayaran berhasil, buat misi untuk kurir.
      const { error: errMisi } = await supabase.from('misi_kurir').insert([{
        pesanan_id: pesanan.id,
        makanan_id: item.id,
        nama_makanan: item.namaMakanan,
        resto_asal: item.namaResto,
        alamat_jemput: item.alamat,
        alamat_antar: 'Alamat Panti (Harga Sosial)',
        lat_jemput: item.lintang,
        lng_jemput: item.bujur,
        imbalan: calculateCourierPay('tier1', jumlah, item.jarakKm),
        status: 'terbuka',
        waktu_ditawarkan_hingga: new Date(Date.now() + 15 * 1000).toISOString(),
      }]);
      if (errMisi) console.error('Gagal buat misi kurir:', errMisi);
      setTahap('berhasil');
      setSedangProses(false);
      kirimToast('sukses', 'Pembayaran Harga Sosial Berhasil', `Total ${formatRupiah(totalHarga)} - Kurir sedang dicari.`);
      onSukses();
    } catch (err: any) {
      kirimToast('error', 'Terjadi Kesalahan', err.message || 'Gagal memproses pesanan.');
      setTahap('konfirmasi');
      setSedangProses(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={() => !sedangProses && onClose()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-amber-500 to-orange-600 p-6">
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><ShoppingBag className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Harga Sosial Panti • Tier 1</p>
                <h3 className="text-xl font-black text-white tracking-tight line-clamp-1">{item.namaMakanan}</h3>
              </div>
            </div>
            <button onClick={onClose} disabled={sedangProses} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer disabled:opacity-50"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-5">
          {tahap === 'konfirmasi' && (
            <>
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Store className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{item.namaResto}</p>
                  <p className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold"><Navigation className="w-3 h-3" /> {item.jarakKm.toFixed(1)} km</p>
                </div>
              </div>

              {/* Harga Sosial Info */}
              <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800/50 rounded-2xl">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-400">Harga Normal (Konsumen Umum)</span>
                  <span className="text-sm text-slate-400 line-through">{formatRupiah(item.hargaAsli || 25000)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-amber-700 dark:text-amber-400 flex items-center gap-1"><Heart className="w-3 h-3" /> Harga Sosial Panti</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{formatRupiah(hargaSosial)}</span>
                </div>
                <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-1 font-bold">
                  Diskon {Math.round((1 - hargaSosial / (item.hargaAsli || 25000)) * 100)}% untuk panti
                </p>
              </div>

              {/* ✅ FIX: Increment 1, max = sisaKuota */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-amber-500" /> Jumlah Porsi
                  <span className="ml-auto text-[9px] text-slate-400 font-normal normal-case">Maks: {sisaKuota} porsi</span>
                </label>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={() => setJumlah((j) => Math.max(1, j - 1))}
                    disabled={jumlah <= 1}
                    className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-black text-lg transition-all active:scale-90 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Minus className="w-4 h-4 mx-auto" />
                  </button>
                  <span className="text-3xl font-black text-slate-900 dark:text-white w-16 text-center tabular-nums">{jumlah}</span>
                  <button
                    onClick={() => setJumlah((j) => Math.min(sisaKuota, j + 1))}
                    disabled={jumlah >= sisaKuota}
                    className="w-11 h-11 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-lg transition-all active:scale-90 cursor-pointer shadow-lg shadow-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Plus className="w-4 h-4 mx-auto" />
                  </button>
                </div>
                {jumlah >= sisaKuota && (
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-2 text-center font-bold">⚠️ Mencapai batas kuota ({sisaKuota}x)</p>
                )}
              </div>

              {/* Ringkasan harga */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Harga sosial/porsi</span><span className="font-bold text-slate-900 dark:text-white">{formatRupiah(hargaSosial)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Jumlah</span><span className="font-bold text-slate-900 dark:text-white">× {jumlah}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600 dark:text-slate-400">Upah kurir</span><span className="font-bold text-slate-900 dark:text-white">{formatRupiah(upahKurir)}</span></div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="font-black text-slate-900 dark:text-white">Total</span>
                  <span className="font-black text-xl text-amber-600 dark:text-amber-400">{formatRupiah(totalHarga)}</span>
                </div>
              </div>

              <button onClick={kunciDanBayar} disabled={sedangProses || kuotaHabis}
                className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black text-sm shadow-xl shadow-amber-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 overflow-hidden">
                <span className="absolute inset-0 efek-kilau" />
                {sedangProses ? (<><Loader2 className="w-5 h-5 animate-spin" /> Memproses...</>) : (<><Coins className="w-5 h-5 group-hover:scale-110 transition-transform" /> Bayar Harga Sosial <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>)}
              </button>
            </>
          )}
          {tahap === 'membayar' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-amber-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-xl shadow-amber-500/40">
                  <Loader2 className="w-10 h-10 animate-spin" />
                </div>
              </div>
              <div>
                <p className="font-black text-lg text-slate-900 dark:text-white">Memproses Pembayaran Harga Sosial</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Mengunci stok & menghubungkan payment...</p>
              </div>
              <div className="w-full max-w-xs bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full animate-pulse" style={{ width: '70%' }} />
              </div>
            </div>
          )}
          {tahap === 'berhasil' && (
            <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-xl shadow-emerald-500/40 anim-gembira">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              </div>
              <div>
                <p className="font-black text-xl text-slate-900 dark:text-white">Pesanan Harga Sosial Dibuat!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kurir akan segera mengambil pesanan Anda.</p>
              </div>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                Lacak di "Log Klaim" <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL LOG KLAIM (riwayat & tracking) — DIPERBAIKI
// ============================================================
function ModalKlaimSaya({ daftarKlaim, onClose, kirimToast = () => {} }: { daftarKlaim: KlaimSaya[]; onClose: () => void; kirimToast?: (tipe: Notifikasi['tipe'], judul: string, pesan: string) => void }) {
  const [statusHandover, setStatusHandover] = useState<Record<string, 'menunggu' | 'diambil' | 'terverifikasi'>>({});
  
  const ambilKodeHandover = (id: string) => {
    if (typeof window === 'undefined') return `PA-HANDOVER-${id}`;
    return window.sessionStorage.getItem(`pa-handover-${id}`) || `PA-HANDOVER-${id}`;
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 p-6">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><History className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Riwayat & Lacak</p>
                <h3 className="text-xl font-black text-white tracking-tight">Log Klaim & Pembelian Panti</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          {daftarKlaim.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Receipt className="w-8 h-8 text-slate-400" /></div>
              <p className="font-black text-slate-900 dark:text-white">Belum Ada Riwayat</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Klaim donasi atau pembelian harga sosial pertama Anda akan muncul di sini.</p>
            </div>
          ) : (
            daftarKlaim.map((k, i) => {
              const cfg = KONFIG_STATUS[k.status];
              const isTier1 = k.tier === 'tier1';
              return (
                <div key={k.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 anim-slideAtas space-y-3" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase ${isTier1 ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400'}`}>
                          {isTier1 ? 'Harga Sosial' : 'Donasi Gratis'}
                        </span>
                      </div>
                      <p className="font-black text-slate-900 dark:text-white line-clamp-1">{k.namaMakanan}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {k.namaResto} • {k.jumlahPenerima} porsi{isTier1 ? ` • ${formatRupiah(k.totalHarga)}` : ' • Gratis'}
                      </p>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
                        {new Date(k.dibuatPada).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.warna} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`}>
                      <cfg.Icon className="w-3.5 h-3.5" /> {cfg.label}
                    </span>
                  </div>
                  {k.status !== 'dibatalkan' && (
                    <div className="flex items-center justify-between mb-4 px-2">
                      {KONFIG_STEPPER.map((step, i) => {
                        const isActive = i < getStepIndex(k.status) - 1;
                        const isCurrent = i === getStepIndex(k.status) - 1;
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

                  {['dibayar', 'sedang_diantar', 'selesai'].includes(k.status) && (
                    <div className="mt-3 space-y-2 rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-emerald-50 dark:bg-emerald-950/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">QR Kurir</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400">Dipindai saat kurir mengambil</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-0.5 text-[8px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                          {statusHandover[k.id] || 'menunggu'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm border border-emerald-100 dark:border-emerald-800/60">
                        <QRCodeMini value={`PANTI-HANDOVER-${k.id}`} size={84} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[9px] font-black text-slate-700 dark:text-slate-300 break-all">PANTI-HANDOVER-{k.id}</p>
                        </div>
                      </div>

                      {k.status === 'dibayar' && (
                        <button
                          type="button"
                          onClick={() => {
                            setStatusHandover((prev) => ({ ...prev, [k.id]: 'diambil' }));
                            kirimToast('sukses', 'Makanan Diambil Kurir', `${k.namaMakanan} telah diambil oleh kurir.`);
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <Bike className="w-3 h-3" /> Simulasikan Scan Kurir
                        </button>
                      )}
                    </div>
                  )}

                  {k.status === 'sedang_diantar' && (
                    <div className="mt-2 p-3 rounded-2xl border border-amber-200 bg-amber-50 text-center">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-800 mb-2">QR Penerima</p>
                      <p className="text-[10px] text-amber-800 font-bold mb-3">Kurir telah menjemput dari Merchant. Tunjukkan QR ini ke Kurir untuk menyelesaikan misi.</p>
                      <div className="flex justify-center bg-white p-3 rounded-xl shadow-inner mb-3">
                        <QRCodePremium value={`PANTI-RECEIVE-${k.id}`} size={170} />
                      </div>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await supabase
                              .from('pesanan')
                              .update({ status: 'selesai' })
                              .eq('makanan_id', k.makananId);

                            await supabase
                              .from('misi_kurir')
                              .update({ status: 'selesai' })
                              .eq('makanan_id', k.makananId)
                              .eq('status', 'sedang_diantar');

                            setStatusHandover((prev) => ({ ...prev, [k.id]: 'terverifikasi' }));
                            kirimToast('sukses', 'Misi Selesai!', 'Pangan telah diterima. Dampak ESG tercatat.');
                          } catch (err) {
                            kirimToast('error', 'Gagal', 'Silakan coba lagi.');
                          }
                        }}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-[10px] font-black text-white shadow-md shadow-emerald-500/20 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <ScanLine className="w-3 h-3" /> Simulasikan Kurir Scan QR Saya
                      </button>
                    </div>
                  )}

                  {k.status === 'selesai' && (
                    <div className="mt-2 space-y-2 rounded-2xl border border-blue-200 dark:border-blue-700/40 bg-blue-50 dark:bg-blue-950/20 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">QR Penerima</p>
                          <p className="text-[10px] text-slate-600 dark:text-slate-400">Dipindai saat makanan diterima</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-0.5 text-[8px] font-black text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">
                          terverifikasi
                        </span>
                      </div>

                      <div className="flex items-center gap-3 rounded-xl bg-white p-2 shadow-sm border border-blue-100 dark:border-blue-800/60">
                        <QRCodeMini value={`PANTI-VERIFY-${k.id}`} size={84} />
                        <div className="min-w-0 flex-1">
                          <p className="font-mono text-[9px] font-black text-slate-700 dark:text-slate-300 break-all">PANTI-VERIFY-{k.id}</p>
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
export default function DashboardPanti() {
  // Dashboard panti menggabungkan makanan, kuota, lokasi, dan riwayat klaim.
  const { resolvedTheme } = useTheme();
  const [lokasiKonsumen, setLokasiKonsumen] = useState<[number, number]>([-6.2088, 106.8456]);
  const [namaArea, setNamaArea] = useState('Jakarta Pusat');
  const [pusatPeta, setPusatPeta] = useState<[number, number]>([-6.2088, 106.8456]);
  const [zoomPeta, setZoomPeta] = useState(13);
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [kataKunci, setKataKunci] = useState('');
  const [teksLokasi, setTeksLokasi] = useState('');
  // ✅ FIX: filter sekarang termasuk tier1
  const [filterTier, setFilterTier] = useState<'semua' | 'tier1' | 'tier2'>('semua');
  const [daftarPangan, setDaftarPangan] = useState<LokasiPangan[]>([]);
  const [daftarKlaim, setDaftarKlaim] = useState<KlaimSaya[]>([]);
  const [sedangMemuatData, setSedangMemuatData] = useState(true);
  const [sedangMencariLokasi, setSedangMencariLokasi] = useState(false);
  const [itemTerpilih, setItemTerpilih] = useState<LokasiPangan | null>(null);
  const [bukaKlaimSaya, setBukaKlaimSaya] = useState(false);
  const [daftarNotifikasi, setDaftarNotifikasi] = useState<Notifikasi[]>([]);
  const [kuotaMingguan, setKuotaMingguan] = useState(3);
  const [klaimMingguIni, setKlaimMingguIni] = useState(0);
  const sisaKuota = Math.max(0, kuotaMingguan - klaimMingguIni);

  const kirimToast = useCallback((tipe: Notifikasi['tipe'], judul: string, pesan: string) => {
    const id = Date.now() + Math.random();
    setDaftarNotifikasi((s) => [...s, { id, tipe, judul, pesan }]);
    setTimeout(() => setDaftarNotifikasi((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);

  const muatKuotaPanti = useCallback(async () => {
    // Kuota dihitung dari jumlah klaim yang dibuat pada minggu berjalan.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profil } = await supabase
        .from('profiles')
        .select('kuota_mingguan')
        .eq('id', user.id)
        .single();
      if (profil) setKuotaMingguan(profil.kuota_mingguan || 3);
    } catch (err) {
      console.error('Gagal memuat kuota panti:', err);
    }
  }, []);

  // ✅ FIX: Muat data Tier 1 & Tier 2 untuk panti
  const muatData = useCallback(async () => {
    try {
      await supabase.rpc('batalkan_pesanan_expired');
      const { data, error } = await supabase
        .from('makanan_surplus')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        // Ubah data database menjadi bentuk yang dipakai kartu dan peta.
        const mappedData: LokasiPangan[] = data
          .filter((d: any) => d.latitude && d.longitude)
          .filter((d: any) => {
            const tier = konversiTier(d.kategori_tier);
            return (tier === 'tier1' || tier === 'tier2') && (Number(d.stok_tersedia ?? d.berat_kg ?? 0) || 0) > 0;
          })
          .map((d: any, i: number) => {
            const dibuat = new Date(d.created_at ?? Date.now()).getTime();
            const sisaMs = dibuat + 6 * 3600 * 1000 - Date.now();
            const hargaDiskon = Number(d.harga_diskon) || 0;
            const hargaAsli = hargaDiskon ? Math.round(hargaDiskon * 2) : 25000;
            // ✅ Harga sosial panti = 10% dari harga asli (~Rp 2.500)
            const hargaSosial = calculateSocialPrice(hargaAsli);
            return {
              id: d.id,
              namaMakanan: d.nama_makanan || 'Paket Pangan',
              namaResto: d.nama_resto || d.merchant_name || 'Donatur',
              alamat: d.alamat_resto || 'Alamat tidak tersedia',
              tier: konversiTier(d.kategori_tier),
              hargaDiskon,
              hargaAsli,
              hargaSosial,
              stokTersedia: d.stok_tersedia ?? Number(d.berat_kg) ?? 0,
              sisaDetik: Math.max(0, Math.floor(sisaMs / 1000)),
              kategori: d.kategori_tier,
              lintang: Number(d.latitude),
              bujur: Number(d.longitude),
              rating: 4.5 + (i % 5) * 0.1,
              jarakKm: 0,
            };
          });
        setDaftarPangan(mappedData);
      }
    } catch (err) {
      console.error('Gagal memuat data:', err);
    } finally {
      setSedangMemuatData(false);
    }
  }, []);

  // ✅ FIX: Muat klaim termasuk tier info
  const muatKlaimSaya = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('pesanan')
        .select(`*, makanan_surplus(nama_makanan, nama_resto, kategori_tier)`)
        .eq('konsumen_id', user.id)
        .order('created_at', { ascending: false });
      if (error) return;
      if (data) {
        // Ambil hanya klaim yang dibuat dari alur panti.
        const klaimPanti = data.filter((p: any) => String(p.konsumen_nama || '').startsWith('Panti ('));
        const daftar = klaimPanti.map((p: any) => ({
          id: p.id,
          makananId: p.makanan_id,
          namaMakanan: p.makanan_surplus?.nama_makanan || 'Pesanan',
          namaResto: p.makanan_surplus?.nama_resto || 'Restoran',
          jumlahPenerima: parseInt(String(p.konsumen_nama || '').match(/\d+/)?.[0] || '1'),
          totalHarga: p.total_harga || 0,
          tier: konversiTier(p.makanan_surplus?.kategori_tier || ''),
          status: p.status,
          dibuatPada: p.created_at,
        }));
        setDaftarKlaim(daftar);
        const awalMinggu = dapatkanAwalMinggu().toISOString();
        const klaimAktif = klaimPanti.filter((p: any) => p.status !== 'dibatalkan' && new Date(p.created_at) >= new Date(awalMinggu));
        setKlaimMingguIni(klaimAktif.length);
      }
    } catch (err) {
      console.error('Gagal memuat klaim:', err);
    }
  }, []);

  useEffect(() => {
    // Refresh berkala menjaga stok dan status klaim tetap terbaru.
    muatKuotaPanti();
    muatData();
    muatKlaimSaya();
    const t = setInterval(() => { muatData(); muatKlaimSaya(); }, 30000);
    return () => clearInterval(t);
  }, [muatKuotaPanti, muatData, muatKlaimSaya]);

  useEffect(() => {
    // Perubahan makanan atau pesanan diterima tanpa perlu refresh manual.
    const channel = supabase.channel('panti-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'makanan_surplus' }, () => muatData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' }, () => { muatKlaimSaya(); muatData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [muatData, muatKlaimSaya]);

  const daftarDenganJarak = useMemo(() => daftarPangan.map((item) => ({
    ...item,
    jarakKm: hitungJarakKm(lokasiKonsumen[0], lokasiKonsumen[1], item.lintang, item.bujur),
  })), [daftarPangan, lokasiKonsumen]);

  // ✅ FIX: Filter sekarang mendukung tier1 & tier2
  const daftarTersaring = useMemo(() => {
    // Tampilkan makanan yang cocok dengan kata kunci dan filter tier.
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
    const t2 = daftarTersaring.filter((i) => i.tier === 'tier2').length;
    const totalKg = daftarTersaring.reduce((acc, i) => acc + (typeof i.stokTersedia === 'number' ? i.stokTersedia : 0), 0);
    return { total: daftarTersaring.length, totalKg: Math.round(totalKg * 10) / 10, t1, t2 };
  }, [daftarTersaring]);

  const terapkanLokasi = useCallback(async (lat: number, lng: number, sumber: string) => {
    setLokasiKonsumen([lat, lng]);
    setPusatPeta([lat, lng]);
    setZoomPeta(14);
    const nama = await ambilNamaArea(lat, lng);
    setNamaArea(nama);
    kirimToast('sukses', `Lokasi Diperbarui (${sumber})`, nama);
  }, [kirimToast]);

  const gunakanGPS = () => {
    // Lokasi GPS dipakai sebagai pusat pencarian makanan terdekat.
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

  const pilihItem = useCallback((item: LokasiPangan) => {
    setPusatPeta([item.lintang, item.bujur]);
    setZoomPeta(16);
    setItemTerpilih(item);
  }, []);

  const klaimAktif = daftarKlaim.filter((k) => ['menunggu_pembayaran', 'dibayar', 'sedang_diantar'].includes(k.status)).length;

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

      {/* ✅ MODAL KLAIM DONASI (TIER 2) */}
      {itemTerpilih && itemTerpilih.tier === 'tier2' && (
        <ModalKlaimDonasi
          item={itemTerpilih}
          sisaKuota={sisaKuota}
          onClose={() => setItemTerpilih(null)}
          onSukses={() => { muatData(); muatKlaimSaya(); }}
          kirimToast={kirimToast}
        />
      )}

      {/* ✅ MODAL BELI HARGA SOSIAL (TIER 1) */}
      {itemTerpilih && itemTerpilih.tier === 'tier1' && (
        <ModalBeliHargaSosial
          item={itemTerpilih}
          sisaKuota={sisaKuota}
          onClose={() => setItemTerpilih(null)}
          onSukses={() => { muatData(); muatKlaimSaya(); }}
          kirimToast={kirimToast}
        />
      )}

      {/* MODAL LOG KLAIM */}
      {bukaKlaimSaya && <ModalKlaimSaya daftarKlaim={daftarKlaim} onClose={() => setBukaKlaimSaya(false)} kirimToast={kirimToast} />}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 anim-fadeIn">
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 rounded-3xl shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute -top-20 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl anim-gelombang" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white"><HeartHandshake className="w-7 h-7" /></div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-100 mb-1 flex items-center gap-1.5">
                  <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-white animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-white" /></span>
                  Portal Panti Asuhan
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Peta Pangan Panti</h1>
                <p className="text-xs text-emerald-50 mt-1 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" /> Lokasi Panti: <strong className="text-white">{namaArea}</strong></p>
              </div>
            </div>
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <div className="grid grid-cols-3 gap-2 flex-1 lg:flex-none">
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{statistik.total}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100">Pangan Dekat</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{sisaKuota}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100">Sisa Kuota</p>
                </div>
                <div className="bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{radiusKm}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-emerald-100">KM Radius</p>
                </div>
              </div>
              <button onClick={() => setBukaKlaimSaya(true)} className="relative flex items-center gap-2 bg-white/95 hover:bg-white text-slate-900 font-bold px-4 py-3 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer shadow-lg">
                <History className="w-5 h-5 text-emerald-600" />
                <span className="hidden sm:inline">Log Klaim</span>
                {klaimAktif > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">{klaimAktif}</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ✅ BANNER HARGA SOSIAL INFO */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 flex items-center gap-4 text-white shadow-lg shadow-amber-500/20 anim-slideAtas">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="font-black text-sm flex items-center gap-2">
              Harga Sosial Panti Aktif
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-[8px] font-black uppercase">Tier 1 Khusus</span>
            </p>
            <p className="text-xs text-white/80 mt-1">Panti bisa beli makanan Tier 1 dengan <strong>diskon 90%</strong> (±Rp 2.500/porsi). Sisa kuota: <strong>{sisaKuota}x minggu ini</strong>.</p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-4">
          <div className="flex flex-col xl:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="text" value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} placeholder="Cari donasi atau resto..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-sm transition-all" />
            </div>
            <form onSubmit={cariLokasiTeks} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="text" value={teksLokasi} onChange={(e) => setTeksLokasi(e.target.value)} placeholder="Pindah kota/daerah panti..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all" />
              </div>
              <button type="submit" disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} <span className="hidden sm:inline">Cari</span>
              </button>
              <button type="button" onClick={gunakanGPS} disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />} <span className="hidden sm:inline">GPS</span>
              </button>
            </form>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              <Crosshair className="w-4 h-4 text-emerald-500 ml-2 shrink-0" />
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 shrink-0">RADIUS:</span>
              {[1, 3, 5, 10].map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${radiusKm === r ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>{r} KM</button>
              ))}
            </div>
            {/* ✅ FIX: Filter Tier - sekarang termasuk Tier 1 (Harga Sosial) & Tier 2 (Donasi) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">Filter:</span>
              <button onClick={() => setFilterTier('semua')} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer ${filterTier === 'semua' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}>
                Semua ({statistik.total})
              </button>
              <button onClick={() => setFilterTier('tier1')} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${filterTier === 'tier1' ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-md shadow-amber-500/30' : 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700/40'}`}>
                <ShoppingBag className="w-3 h-3" /> Harga Sosial ({statistik.t1})
              </button>
              <button onClick={() => setFilterTier('tier2')} className={`px-3.5 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${filterTier === 'tier2' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/30' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-700/40'}`}>
                <HeartHandshake className="w-3 h-3" /> Donasi Gratis ({statistik.t2})
              </button>
            </div>
          </div>
        </div>

        {/* GRID: PETA + LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-sm h-[520px] lg:h-[640px]">
            <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 pointer-events-auto shadow-lg">
                <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" /></span>
                {sedangMemuatData ? 'Memuat...' : `${statistik.total} pangan dalam ${radiusKm} km`}
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold text-slate-700 dark:text-slate-200 flex items-center gap-3 pointer-events-auto shadow-lg">
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Harga Sosial</span>
                <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Donasi</span>
              </div>
            </div>
            <PetaKonsumen daftarPangan={daftarTersaring} lokasiKonsumen={lokasiKonsumen} radiusKm={radiusKm} pusatPeta={pusatPeta} zoomPeta={zoomPeta} itemTerpilih={itemTerpilih} onPilihItem={(item) => pilihItem(item as LokasiPangan)} onKlikPeta={(lat: number, lng: number) => terapkanLokasi(lat, lng, 'Klik Peta')} theme={resolvedTheme} />
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-blue-500" /> Klik peta untuk memindahkan lokasi panti
              </div>
            </div>
          </div>

          {/* LIST */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><HeartHandshake className="w-4 h-4 text-emerald-500" /> Pangan Terdekat</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Harga sosial & donasi gratis</p>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/50">{daftarTersaring.length} item</span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-tipis space-y-3 pr-1 -mr-1 max-h-[560px] lg:max-h-[580px]">
              {sedangMemuatData ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                  <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Mengambil pangan dari donatur sekitar...</p>
                </div>
              ) : daftarTersaring.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-8 h-8 text-slate-400" /></div>
                  <p className="font-black text-sm text-slate-900 dark:text-white mb-1">Belum ada pangan di radius ini</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Perluas radius atau tunggu donatur menambahkan pangan.</p>
                  <button onClick={() => setRadiusKm(10)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-black cursor-pointer active:scale-95 transition-all">Perluas ke 10 KM</button>
                </div>
              ) : (
                daftarTersaring.map((item, index) => {
                  const habis = item.stokTersedia <= 0;
                  const isTier1 = item.tier === 'tier1';
                  return (
                    <button key={item.id} onClick={() => !habis && pilihItem(item)} disabled={habis}
                      className={`w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer group anim-slideAtas ${habis ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${isTier1 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'} flex items-center justify-center text-white shrink-0 shadow-md`}>
                            {isTier1 ? <ShoppingBag className="w-5 h-5" /> : <HeartHandshake className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{item.namaMakanan}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5"><Store className="w-3 h-3" /><span className="truncate">{item.namaResto}</span></p>
                          </div>
                        </div>
                        {habis ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40">HABIS</span>
                        ) : (
                          <span className={`shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black border ${isTier1 ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-700/40' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-700/40'}`}>
                            {isTier1 ? 'HARGA SOSIAL' : 'DONASI'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400"><Navigation className="w-3 h-3" /> {item.jarakKm.toFixed(1)} km</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="font-bold">{item.rating.toFixed(1)}</span></span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /><span className="font-bold">{item.stokTersedia}</span></span>
                        <div className="ml-auto"><TampilanCountdown sisaDetik={item.sisaDetik} /></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        {isTier1 ? (
                          <div>
                            <span className="text-[10px] line-through text-slate-400">{formatRupiah(item.hargaAsli || 25000)}</span>
                            <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">{formatRupiah(item.hargaSosial || 2500)}</p>
                            <p className="text-[8px] text-amber-500 font-bold">Harga Sosial Panti</p>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5"><Heart className="w-4 h-4 text-emerald-500" /><p className="text-sm font-black text-emerald-600 dark:text-emerald-400">Gratis</p></div>
                        )}
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r ${isTier1 ? 'from-amber-500 to-orange-600' : 'from-emerald-500 to-teal-600'} text-white text-[10px] font-black shadow-md ${habis ? 'opacity-50' : ''}`}>
                          {isTier1 ? <ShoppingBag className="w-3 h-3" /> : <HeartHandshake className="w-3 h-3" />} {habis ? 'Habis' : isTier1 ? 'Beli Sosial' : 'Klaim Donasi'}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* TRUST SIGNALS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { Icon: ShieldCheck, judul: 'Akses Panti Terbuka', deskripsi: 'Akses donasi & harga sosial', warna: 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' },
            { Icon: Bike, judul: 'Relawan Terpercaya', deskripsi: 'Tim terlatih & terverifikasi', warna: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
            { Icon: Leaf, judul: 'Dampak Terukur', deskripsi: 'Tercatat di ledger ESG', warna: 'bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all">
              <div className={`w-11 h-11 rounded-xl ${item.warna} flex items-center justify-center shrink-0`}><item.Icon className="w-5 h-5" /></div>
              <div>
                <p className="text-sm font-black text-slate-900 dark:text-white">{item.judul}</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{item.deskripsi}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}