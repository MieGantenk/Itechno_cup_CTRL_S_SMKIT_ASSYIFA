'use client';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import { calculateCourierPay } from '@/lib/courier';
import { useTheme } from '@/components/theme-provider';
import { QRCodeEnergy } from '@/components/QrCode';
import 'leaflet/dist/leaflet.css';
import {
  MapPin, Search, Zap, Clock, X, Navigation, Store,
  CheckCircle2, Loader2, AlertCircle, Package, Wind, Crosshair,
  LocateFixed, SearchCode, Truck, PackageCheck, Ban, Timer,
  ShieldCheck, Flame, Recycle, Factory, Bug, ChevronRight,
  ArrowRight, Info, Database, Camera
} from 'lucide-react';

const formatRupiah = (nilai: number) => new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
}).format(nilai);

// Tipe data ini dipakai untuk daftar limbah, jadwal pickup, dan tracking handover.
type StatusKlaim = 'dibayar' | 'sedang_diantar' | 'selesai' | 'dibatalkan';

export interface LokasiLimbah {
  id: string;
  namaMakanan: string;
  namaResto: string;
  alamat: string;
  stokTersedia: number;
  sisaDetik: number;
  lintang: number;
  bujur: number;
  rating: number;
  jarakKm: number;
  kategori: string;
}

type IkonStatus = React.ComponentType<{ className?: string }>;
type BarisJadwal = {
  id: string;
  makanan_id: string;
  konsumen_nama: string | null;
  jumlah?: number | null;
  status: StatusKlaim;
  created_at: string;
  makanan_surplus?: { nama_makanan?: string | null; nama_resto?: string | null } | null;
};

interface JadwalPickup {
  id: string;
  limbahId: string;
  namaLimbah: string;
  namaResto: string;
  beratKg: number;
  jumlahPcs: number;
  status: StatusKlaim;
  dibuatPada: string;
}

type StatusHandoverEnergi = 'menunggu' | 'dipindai' | 'sampai';

interface Notifikasi {
  id: number;
  tipe: 'sukses' | 'info' | 'error';
  judul: string;
  pesan: string;
}

// Label status pickup dan posisi langkahnya di progress bar.
const KONFIG_STATUS: Record<StatusKlaim, { label: string; warna: string; Icon: IkonStatus; langkah: number }> = {
  dibayar: { label: 'Menunggu Kurir', warna: 'text-blue-600 dark:text-blue-400', Icon: Timer, langkah: 1 },
  sedang_diantar: { label: 'Menuju Fasilitas', warna: 'text-cyan-600 dark:text-cyan-400', Icon: Truck, langkah: 2 },
  selesai: { label: 'Diterima & Diproses', warna: 'text-emerald-600 dark:text-emerald-400', Icon: PackageCheck, langkah: 3 },
  dibatalkan: { label: 'Dibatalkan', warna: 'text-rose-600 dark:text-rose-400', Icon: Ban, langkah: 0 },
};

// Fungsi bantuan untuk jarak, klasifikasi tier, dan perkiraan dampak energi.
const hitungJarakKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const adalahTier3 = (kategori: string): boolean => {
  const str = (kategori || '').toLowerCase();
  return str.includes('tier3') || str.includes('biogas');
};

// Perkiraan hasil olahan dihitung dari berat limbah dalam satuan kilogram.
const estimasiBiogas = (kg: number) => kg * 0.15;         // m³
const estimasiMaggot = (kg: number) => kg * 0.2;          // kg
const estimasiCo2 = (kg: number) => kg * 2.5;             // kg CO2e

const buatMatriksQR = (nilai: string, ukuran = 25): boolean[][] => {
  let hash = 2166136261;
  for (let index = 0; index < nilai.length; index += 1) {
    hash ^= nilai.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  let seed = Math.abs(hash) || 12345;
  const acak = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const matriks = Array.from({ length: ukuran }, () => Array(ukuran).fill(false));
  const finder = (awalX: number, awalY: number) => {
    for (let y = 0; y < 7; y += 1) for (let x = 0; x < 7; x += 1) {
      matriks[awalY + y][awalX + x] = x === 0 || x === 6 || y === 0 || y === 6 || (x >= 2 && x <= 4 && y >= 2 && y <= 4);
    }
  };
  for (let y = 0; y < ukuran; y += 1) for (let x = 0; x < ukuran; x += 1) matriks[y][x] = acak() > 0.52;
  finder(0, 0); finder(ukuran - 7, 0); finder(0, ukuran - 7);
  return matriks;
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

function useCountUp(target: number, duration = 1400) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let raf: number; const start = performance.now();
    const step = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// Hitung mundur sampai batas waktu pickup berakhir.
function CountdownLimbah({ sisaDetik }: { sisaDetik: number }) {
  const [sisa, setSisa] = useState(sisaDetik);
  useEffect(() => {
    const t = setInterval(() => setSisa((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (sisa === 0) return <span className="text-[10px] font-black text-rose-500 flex items-center gap-1"><X className="w-3 h-3" /> Lewat</span>;
  const jam = Math.floor(sisa / 3600), menit = Math.floor((sisa % 3600) / 60), dtk = sisa % 60;
  const kritis = sisa < 3600;
  return (
    <span className={`flex items-center gap-1 font-mono tabular-nums font-black ${kritis ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
      <Clock className={`w-3 h-3 ${kritis ? 'animate-pulse' : ''}`} />
      {jam > 0 && `${String(jam).padStart(2, '0')}:`}{String(menit).padStart(2, '0')}:{String(dtk).padStart(2, '0')}
    </span>
  );
}

// Peta dimuat di browser karena Leaflet membutuhkan window.
const PetaEnergi = dynamic(() => import('./PetaEnergiCore'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[520px] flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-900 rounded-2xl">
      <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-3" />
      <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memuat peta jaringan limbah...</p>
    </div>
  ),
});

// Buat misi kurir setelah fasilitas energi memesan limbah.
const buatMisiKurir = async (
  item: { id: string | number; namaMakanan: string; namaResto: string; alamat: string;
          tier: 'tier1' | 'tier2' | 'tier3'; stok: number | string; lintang: number; bujur: number },
  peranPembeli: 'konsumen' | 'panti' | 'energi',
  lokasiPembeli: [number, number],
  pesananId: string,
) => {
  const { data: { user } } = await supabase.auth.getUser();
  const berat = typeof item.stok === 'number' ? item.stok : parseFloat(String(item.stok)) || 1;

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

// ============================================================
// MODAL KLAIM LIMBAH (Tier 3)
// ============================================================
function ModalKlaimLimbah({ item, lokasiFasilitas, onClose, onSukses, kirimToast }: {
  item: LokasiLimbah; onClose: () => void; onSukses: (item: LokasiLimbah) => void;
  lokasiFasilitas: [number, number];
  kirimToast: (t: Notifikasi['tipe'], j: string, p: string) => void;
}) {
  const [catatan, setCatatan] = useState('');
  const [sedangProses, setSedangProses] = useState(false);
  const [berhasil, setBerhasil] = useState(false);

  const berat = typeof item.stokTersedia === 'number' ? item.stokTersedia : 0;
  const [jumlahPcs, setJumlahPcs] = useState(1);
  const stokMaksimal = Math.max(1, Math.floor(berat));
  const upahKurir = calculateCourierPay('tier3', jumlahPcs, Math.max(0.5, Number(item.jarakKm) || 0.5));

  const prosesKlaim = async () => {
    setSedangProses(true);
    try {
      // Buat pesanan terlebih dahulu, lalu tawarkan pickup kepada kurir.
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi login tidak ditemukan.');
      const { data: pesanan, error: errorPesanan } = await supabase.from('pesanan').insert([{
        makanan_id: item.id,
        konsumen_id: user.id,
        konsumen_email: user.email,
        konsumen_nama: `Fasilitas Energi (${jumlahPcs} pcs)`,
        jumlah: jumlahPcs,
        upah_kurir: upahKurir,
        total_harga: upahKurir,
        status: 'dibayar',
      }]).select('id').single();
      if (errorPesanan) throw errorPesanan;
      await buatMisiKurir(
        { id: item.id, namaMakanan: item.namaMakanan, namaResto: item.namaResto,
          alamat: item.alamat, tier: 'tier3', stok: jumlahPcs,
          lintang: item.lintang, bujur: item.bujur },
        'energi',
        lokasiFasilitas,
        pesanan.id,
      );
      kirimToast('sukses', 'Pesanan Tercatat', `${jumlahPcs} pcs ${item.namaMakanan}. Upah kurir ${formatRupiah(upahKurir)}.`);
      onSukses(item);
      onClose();
    } catch (err: any) {
      kirimToast('error', 'Gagal Membuat Misi', err.message || 'Coba lagi.');
    } finally {
      setSedangProses(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={() => !sedangProses && onClose()}>
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        {/* Header cyan (energi) */}
        <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 p-6">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="relative flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><Factory className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Pickup Tier 3</p>
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
                <div className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-xl shadow-cyan-500/40 anim-gembira">
                  <Zap className="w-10 h-10" />
                </div>
              </div>
              <div>
                <p className="font-black text-xl text-slate-900 dark:text-white">Pesanan Tercatat!</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kurir mitra akan mengangkut limbah ke fasilitas Anda.</p>
              </div>
              <button onClick={onClose} className="w-full py-3.5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-sm transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2">
                Lihat di &quot;Riwayat Pemesanan&quot; <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Info resto sumber limbah */}
              <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300"><Store className="w-5 h-5" /></div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-sm text-slate-900 dark:text-white truncate">{item.namaResto}</p>
                  <p className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 font-bold"><Navigation className="w-3 h-3" />{item.jarakKm.toFixed(1)} km dari fasilitas Anda</p>
                </div>
              </div>

              {/* Pilih jumlah limbah yang akan dijadwalkan untuk pickup. */}
              <div className="rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-blue-50 dark:bg-blue-950/30 p-4">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Kuantitas Limbah</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Pilih jumlah yang akan diklaim</p>
                  </div>
                  <span className="text-sm font-black text-blue-700 dark:text-blue-300">Stok: {stokMaksimal} pcs</span>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setJumlahPcs((jumlah) => Math.max(1, jumlah - 1))} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 text-xl font-black text-blue-700 dark:text-blue-300">-</button>
                  <div className="flex-1 text-center rounded-xl bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-700 py-2"><span className="text-2xl font-black text-slate-900 dark:text-white">{jumlahPcs}</span> <span className="text-xs font-bold text-slate-500">pcs</span></div>
                  <button type="button" onClick={() => setJumlahPcs((jumlah) => Math.min(stokMaksimal, jumlah + 1))} className="w-10 h-10 rounded-xl bg-blue-600 text-white text-xl font-black">+</button>
                </div>
              </div>

              {/* Tampilkan perkiraan hasil pengolahan limbah. */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <Package className="w-4 h-4 text-slate-400 mb-1.5" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Berat Limbah</p>
                  <p className="text-base font-black text-slate-900 dark:text-white leading-none">{jumlahPcs} pcs</p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/50">
                  <Flame className="w-4 h-4 text-amber-500 mb-1.5" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Potensi Biogas</p>
                  <p className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">{estimasiBiogas(berat).toFixed(1)} m³</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-2xl border border-orange-200 dark:border-orange-800/50">
                  <Bug className="w-4 h-4 text-orange-500 mb-1.5" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">Potensi Maggot</p>
                  <p className="text-base font-black text-orange-600 dark:text-orange-400 leading-none">{estimasiMaggot(berat).toFixed(1)} kg</p>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50">
                  <Wind className="w-4 h-4 text-emerald-500 mb-1.5" />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-wider">CO2e Dicegah</p>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400 leading-none">{estimasiCo2(berat).toFixed(1)} kg</p>
                </div>
              </div>

              {/* Ringkasan biaya pickup dan upah kurir. */}
              <div className="space-y-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Jumlah pickup</span>
                  <span className="font-bold text-slate-900 dark:text-white">{jumlahPcs} pcs</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Upah kurir</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatRupiah(upahKurir)}</span>
                </div>
                <div className="border-t border-slate-200 dark:border-slate-700 pt-2 flex justify-between">
                  <span className="font-black text-slate-900 dark:text-white">Total</span>
                  <span className="font-black text-xl text-cyan-600 dark:text-cyan-400">{formatRupiah(upahKurir)}</span>
                </div>
              </div>

              {/* Catatan */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2">Catatan Pickup (Opsional)</label>
                <textarea value={catatan} onChange={(e) => setCatatan(e.target.value)} rows={2} placeholder="Misal: Akses masuk lewat pintu belakang gudang..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 text-sm transition-all resize-none" />
              </div>

              {/* Info alur */}
              <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/30 dark:to-blue-950/30 rounded-2xl border border-cyan-200 dark:border-cyan-800/50">
                <Truck className="w-4 h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                <p className="text-xs text-slate-700 dark:text-slate-300">Kurir mitra menjemput {jumlahPcs} pcs dari resto dan mengantar ke fasilitas Anda. <strong className="text-cyan-600 dark:text-cyan-400">Upah kurir {formatRupiah(upahKurir)}.</strong></p>
              </div>

              {/* Tombol klaim */}
              <button onClick={prosesKlaim} disabled={sedangProses}
                className="group relative w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-black text-sm shadow-xl shadow-cyan-500/30 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 overflow-hidden">
                <span className="absolute inset-0 efek-kilau" />
                {sedangProses ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Menjadwalkan Pickup...</>
                ) : (
                  <><Truck className="w-5 h-5 group-hover:scale-110 transition-transform" /> Jadwalkan Pickup <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL RIWAYAT PEMESANAN (riwayat & tracking)
// ============================================================
function ModalJadwalPickup({ daftarJadwal, onClose, statusHandover, onScan, kirimToast = () => {} }: { daftarJadwal: JadwalPickup[]; onClose: () => void; statusHandover: Record<string, StatusHandoverEnergi>; onScan: (jadwal: JadwalPickup) => void; kirimToast?: (tipe: Notifikasi['tipe'], judul: string, pesan: string) => void }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md anim-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden anim-skalaMasuk max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-cyan-600 to-blue-700 p-6">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 p-2.5 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><Database className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">Riwayat & Lacak</p>
                <h3 className="text-xl font-black text-white tracking-tight">Riwayat Pemesanan</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {daftarJadwal.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><Database className="w-8 h-8 text-slate-400" /></div>
              <p className="font-black text-slate-900 dark:text-white">Belum Ada Jadwal</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Klaim limbah Tier 3 pertama Anda akan muncul di sini.</p>
            </div>
          ) : (
            daftarJadwal.map((k, i) => {
              const cfg = KONFIG_STATUS[k.status];
              const kodeHandover = `ENERGI-HANDOVER-${k.id}`;
              const statusScan = statusHandover[k.id] || 'menunggu';
              return (
                <div key={k.id} className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 anim-slideAtas" style={{ animationDelay: `${i * 0.06}s` }}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white line-clamp-1">{k.namaLimbah}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">{k.namaResto} • {k.jumlahPcs} pcs</p>
                    </div>
                    <span className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black ${cfg.warna} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700`}>
                      <cfg.Icon className="w-3.5 h-3.5" />{cfg.label}
                    </span>
                  </div>
                  {k.status !== 'dibatalkan' && (
                    <div>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3].map((step) => (
                          <div key={step} className={`flex-1 h-1.5 rounded-full transition-all duration-500 ${step <= cfg.langkah ? 'bg-gradient-to-r from-cyan-500 to-blue-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                        ))}
                      </div>
                      <div className="flex justify-between text-[9px] font-bold text-slate-500 dark:text-slate-400">
                        <span className={cfg.langkah >= 1 ? 'text-cyan-600 dark:text-cyan-400' : ''}>Konfirmasi</span>
                        <span className={cfg.langkah >= 2 ? 'text-cyan-600 dark:text-cyan-400' : ''}>Diantar</span>
                        <span className={cfg.langkah >= 3 ? 'text-cyan-600 dark:text-cyan-400' : ''}>Diterima</span>
                      </div>
                    </div>
                  )}
                  {k.status !== 'dibatalkan' && (
                    <div className="mt-4 rounded-2xl border border-blue-200 dark:border-blue-800/60 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/40 dark:to-cyan-950/30 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-700 dark:text-blue-300">QR Handover Energi</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Kurir memindai saat limbah tiba di fasilitas</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-1 text-[9px] font-black uppercase text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700/50">{statusScan}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="rounded-2xl bg-white p-2 shadow-lg border border-blue-100"><QRCodeEnergy value={kodeHandover} size={150} /></div>
                        <div className="min-w-0 flex-1 w-full">
                          <p className="font-mono text-[10px] font-black text-slate-900 dark:text-white break-all">{kodeHandover}</p>
                          {k.status === 'dibayar' && (
                            <button type="button" onClick={() => onScan(k)} disabled={statusScan !== 'menunggu'} className="mt-3 w-full rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-2.5 text-[10px] font-black text-white shadow-lg shadow-blue-500/20 transition-all active:scale-[.98] disabled:opacity-50">
                              {statusScan === 'menunggu' ? <><Camera className="inline-block w-3.5 h-3.5 mr-1.5" /> Simulasikan Scan Kurir</> : <><CheckCircle2 className="inline-block w-3.5 h-3.5 mr-1.5" /> Handover Tercatat</>}
                            </button>
                          )}
                          {k.status !== 'dibayar' && (
                            <div className="mt-3 w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Handover Tercatat
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {['sedang_diantar', 'selesai'].includes(k.status) && (
                    <div className="mt-3 rounded-2xl border border-emerald-200 dark:border-emerald-700/40 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 p-4">
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-300">QR Verifikasi Penerimaan</p>
                          <p className="text-[11px] text-slate-600 dark:text-slate-400">Fasilitas memindai saat limbah diterima & diproses</p>
                        </div>
                        <span className="rounded-full bg-white dark:bg-slate-900 px-2 py-1 text-[9px] font-black text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700/50">
                          {k.status === 'selesai' ? 'terverifikasi' : 'menunggu'}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row items-center gap-4">
                        <div className="rounded-2xl bg-white p-2 shadow-lg border border-emerald-100"><QRCodeEnergy value={`EN-VERIFY-${k.id}`} size={150} /></div>
                        <div className="min-w-0 flex-1 w-full">
                          <p className="font-mono text-[10px] font-black text-slate-900 dark:text-white break-all">EN-VERIFY-{k.id}</p>
                          {k.status === 'sedang_diantar' && (
                            <button type="button" onClick={async () => {
                              try {
                                await supabase
                                  .from('pesanan')
                                  .update({ status: 'selesai' })
                                  .eq('makanan_id', k.limbahId);
                                
                                // Status misi kurir ikut diperbarui setelah limbah diterima.
                                await supabase
                                  .from('misi_kurir')
                                  .update({ status: 'selesai' })
                                  .eq('makanan_id', k.limbahId)
                                  .eq('status', 'sedang_diantar');
                                
                                kirimToast('sukses', 'Penerimaan Terverifikasi', `${k.namaLimbah} telah diterima dan diproses.`);
                              } catch (err) {
                                kirimToast('error', 'Gagal Update Status', 'Silakan coba lagi.');
                              }
                            }} className="mt-3 w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 px-3 py-2.5 text-[10px] font-black text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-[.98]">
                              <Camera className="inline-block w-3.5 h-3.5 mr-1.5" /> Simulasikan Scan Fasilitas
                            </button>
                          )}
                          {k.status === 'selesai' && (
                            <div className="mt-3 w-full rounded-xl bg-slate-100 dark:bg-slate-800 px-3 py-2.5 text-[10px] font-black text-slate-600 dark:text-slate-400 flex items-center justify-center gap-2">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Penerimaan Tercatat
                            </div>
                          )}
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
export default function DashboardEnergi() {
  const { resolvedTheme } = useTheme();

  // Lokasi fasilitas menjadi pusat dan acuan radius pencarian.
  const [lokasiFasilitas, setLokasiFasilitas] = useState<[number, number]>([-6.2088, 106.8456]);
  const [namaArea, setNamaArea] = useState('Jakarta Pusat');
  const [pusatPeta, setPusatPeta] = useState<[number, number]>([-6.2088, 106.8456]);
  const [zoomPeta, setZoomPeta] = useState(13);

  // State filter, data limbah, jadwal pickup, dan notifikasi.
  const [radiusKm, setRadiusKm] = useState<number>(3);
  const [kataKunci, setKataKunci] = useState('');
  const [teksLokasi, setTeksLokasi] = useState('');
  const [daftarLimbah, setDaftarLimbah] = useState<LokasiLimbah[]>([]);
  const [daftarJadwal, setDaftarJadwal] = useState<JadwalPickup[]>([]);
  const [sedangMemuat, setSedangMemuat] = useState(true);
  const [sedangMencariLokasi, setSedangMencariLokasi] = useState(false);
  const [itemKlaim, setItemKlaim] = useState<LokasiLimbah | null>(null);
  const [bukaJadwal, setBukaJadwal] = useState(false);
  const [daftarNotifikasi, setDaftarNotifikasi] = useState<Notifikasi[]>([]);
  const [statusHandover, setStatusHandover] = useState<Record<string, StatusHandoverEnergi>>({});

  const kirimToast = useCallback((tipe: Notifikasi['tipe'], judul: string, pesan: string) => {
    const id = Date.now() + Math.random();
    setDaftarNotifikasi((s) => [...s, { id, tipe, judul, pesan }]);
    setTimeout(() => setDaftarNotifikasi((s) => s.filter((t) => t.id !== id)), 4500);
  }, []);

  const tanganiScanHandover = useCallback(async (jadwal: JadwalPickup) => {
    setStatusHandover((sebelumnya) => ({ ...sebelumnya, [jadwal.id]: 'dipindai' }));
    
    // Saat QR dipindai, limbah dianggap sedang dibawa ke fasilitas.
    try {
      await supabase
        .from('pesanan')
        .update({ status: 'sedang_diantar' })
        .eq('makanan_id', jadwal.limbahId)
        .in('status', ['dibayar', 'sedang_diantar']);
      
      // Status misi kurir disamakan dengan status pesanan.
      await supabase
        .from('misi_kurir')
        .update({ status: 'sedang_diantar' })
        .eq('makanan_id', jadwal.limbahId)
        .eq('status', 'diambil');
    } catch (err) {
      console.error('Gagal update status pesanan:', err);
    }
    
    const channel = supabase.channel('handover-notifications');
    await channel.subscribe();
    await channel.send({
      type: 'broadcast',
      event: 'handover-scan',
      payload: {
        judul: 'Order Tiba di Fasilitas Energi',
        pesan: `${jadwal.namaLimbah} dari ${jadwal.namaResto} telah tiba dan QR handover dipindai kurir.`,
        makananId: jadwal.limbahId,
      },
    });
    await supabase.removeChannel(channel);
    setTimeout(() => setStatusHandover((sebelumnya) => ({ ...sebelumnya, [jadwal.id]: 'sampai' })), 1200);
    kirimToast('sukses', 'Handover Berhasil', 'Notifikasi order tiba telah dikirim ke merchant.');
  }, [kirimToast]);

  // Ambil hanya makanan Tier 3 yang punya koordinat dan masih aktif.
  const muatData = useCallback(async () => {
    setSedangMemuat(true);
    try {
      try { await supabase.rpc('batalkan_pesanan_expired'); } catch { /* opsional */ }
      const { data, error } = await supabase.from('makanan_surplus').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const valid = data
          .filter((d) => d.latitude && d.longitude && adalahTier3(d.kategori_tier) && d.status_aktif !== false)
          .map((d, i) => {
            const dibuat = new Date(d.created_at ?? Date.now()).getTime();
            const sisaMs = dibuat + 6 * 3600 * 1000 - Date.now();
            return {
              id: d.id,
              namaMakanan: d.nama_makanan || 'Limbah Organik',
              namaResto: d.nama_resto || d.merchant_name || 'Donatur Limbah',
              alamat: d.alamat_resto || 'Alamat tidak tersedia',
              stokTersedia: d.stok_tersedia ?? Number(d.berat_kg) ?? 0,
              sisaDetik: Math.max(0, Math.floor(sisaMs / 1000)),
              lintang: Number(d.latitude),
              bujur: Number(d.longitude),
              rating: 4.5 + (i % 5) * 0.1,
              jarakKm: 0,
              kategori: d.kategori_tier,
            };
          });
        setDaftarLimbah(valid);
      }
    } catch (err) {
      console.error('Gagal memuat data limbah:', err);
      kirimToast('error', 'Gagal Memuat Data', 'Periksa koneksi Anda.');
    } finally {
      setSedangMemuat(false);
    }
  }, [kirimToast]);

  // ----------------------------------------------------------
  // MUAT JADWAL PICKUP SAYA
  // ----------------------------------------------------------
  const muatJadwalSaya = useCallback(async () => {
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
        const jadwalEnergi = (data as unknown as BarisJadwal[]).filter((p) =>
          String(p.konsumen_nama || '').startsWith('Fasilitas Energi (')
        );
        setDaftarJadwal(jadwalEnergi.map((p) => ({
          id: p.id,
          limbahId: p.makanan_id,
          namaLimbah: p.makanan_surplus?.nama_makanan || 'Limbah',
          namaResto: p.makanan_surplus?.nama_resto || 'Donatur',
          beratKg: Number(p.jumlah || parseInt(String(p.konsumen_nama || '').match(/\d+/)?.[0] || '0')),
          jumlahPcs: Number(p.jumlah || parseInt(String(p.konsumen_nama || '').match(/\d+/)?.[0] || '0')),
          status: p.status,
          dibuatPada: p.created_at,
        })));
      }
    } catch (err) {
      console.error('Gagal memuat jadwal:', err);
    }
  }, []);

  useEffect(() => {
    muatData();
    muatJadwalSaya();
    const t = setInterval(() => { muatData(); muatJadwalSaya(); }, 30000);
    return () => clearInterval(t);
  }, [muatData, muatJadwalSaya]);

  // Realtime
  useEffect(() => {
    const channel = supabase.channel('energi-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'makanan_surplus' }, () => muatData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pesanan' }, () => { muatJadwalSaya(); muatData(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [muatData, muatJadwalSaya]);

  // Hitung jarak + filter radius + kata kunci + urutkan terdekat
  const daftarDenganJarak = useMemo(() => daftarLimbah.map((item) => ({
    ...item,
    jarakKm: hitungJarakKm(lokasiFasilitas[0], lokasiFasilitas[1], item.lintang, item.bujur),
  })), [daftarLimbah, lokasiFasilitas]);

  const daftarTersaring = useMemo(() => {
    const kata = kataKunci.toLowerCase();
    return daftarDenganJarak
      .filter((item) => item.jarakKm <= radiusKm)
      .filter((item) => item.namaMakanan.toLowerCase().includes(kata) || item.namaResto.toLowerCase().includes(kata))
      .sort((a, b) => a.jarakKm - b.jarakKm);
  }, [daftarDenganJarak, radiusKm, kataKunci]);

  const statistik = useMemo(() => {
    const totalKg = daftarTersaring.reduce((acc, i) => acc + (typeof i.stokTersedia === 'number' ? i.stokTersedia : 0), 0);
    return {
      total: daftarTersaring.length,
      totalKg: Math.round(totalKg * 10) / 10,
      biogas: estimasiBiogas(totalKg),
    };
  }, [daftarTersaring]);

  const kgAnim = useCountUp(Math.round(statistik.totalKg));

  // Lokasi fleksibel
  const terapkanLokasi = useCallback(async (lat: number, lng: number, sumber: string) => {
    setLokasiFasilitas([lat, lng]);
    setPusatPeta([lat, lng]);
    setZoomPeta(14);
    const nama = await ambilNamaArea(lat, lng);
    setNamaArea(nama);
    kirimToast('sukses', `Lokasi Diperbarui (${sumber})`, nama);
  }, [kirimToast]);

  const gunakanGPS = () => {
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

  const pilihItem = useCallback((item: LokasiLimbah) => {
    setPusatPeta([item.lintang, item.bujur]);
    setZoomPeta(16);
    setItemKlaim(item);
  }, []);

  const jadwalAktif = daftarJadwal.filter((k) => ['dibayar', 'sedang_diantar'].includes(k.status)).length;

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
        @keyframes denyutEnergi { 0%,100% { opacity: .4; transform: scale(1) } 50% { opacity: .9; transform: scale(1.06) } }
        .anim-fadeIn { animation: fadeIn .4s ease-out both }
        .anim-slideAtas { animation: slideAtas .5s cubic-bezier(.22,1,.36,1) both }
        .anim-slideKanan { animation: slideKanan .5s cubic-bezier(.22,1,.36,1) both }
        .anim-skalaMasuk { animation: skalaMasuk .45s cubic-bezier(.34,1.56,.64,1) both }
        .anim-gembira { animation: gembira .7s cubic-bezier(.34,1.56,.64,1) both }
        .anim-gelombang { animation: gelombang 2.5s ease-in-out infinite }
        .anim-denyutEnergi { animation: denyutEnergi 2.2s ease-in-out infinite }
        .efek-kilau { background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.3) 50%, transparent 60%); background-size: 200% 100%; animation: kilau 3s linear infinite }
        .scroll-tipis::-webkit-scrollbar { width: 6px }
        .scroll-tipis::-webkit-scrollbar-thumb { background: linear-gradient(#06b6d4,#2563eb); border-radius: 8px }
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

      {/* MODAL KLAIM */}
      {itemKlaim && (
        <ModalKlaimLimbah
          item={itemKlaim}
          lokasiFasilitas={lokasiFasilitas}
          onClose={() => setItemKlaim(null)}
          onSukses={(item) => {
            setDaftarJadwal((sebelumnya) => [{
              id: `energi-${item.id}-${Date.now()}`,
              limbahId: item.id,
              namaLimbah: item.namaMakanan,
              namaResto: item.namaResto,
              beratKg: item.stokTersedia,
              jumlahPcs: item.stokTersedia,
              status: 'dibayar',
              dibuatPada: new Date().toISOString(),
            }, ...sebelumnya]);
            muatData();
            muatJadwalSaya();
          }}
          kirimToast={kirimToast}
        />
      )}

      {/* MODAL JADWAL */}
      {bukaJadwal && <ModalJadwalPickup daftarJadwal={daftarJadwal} onClose={() => setBukaJadwal(false)} statusHandover={statusHandover} onScan={tanganiScanHandover} kirimToast={kirimToast} />}

      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6 anim-fadeIn">
        {/* HEADER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-700 p-6 rounded-3xl shadow-xl shadow-cyan-500/20">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
          <div className="absolute -top-20 -right-10 w-60 h-60 bg-white/10 rounded-full blur-3xl anim-denyutEnergi" />
          <div className="absolute -bottom-24 left-1/4 w-52 h-52 bg-cyan-300/20 rounded-full blur-3xl" />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/30 rounded-2xl blur-xl anim-gelombang" />
                <div className="relative w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white"><Factory className="w-7 h-7" /></div>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100 mb-1 flex items-center gap-1.5">
                  <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-white animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-white" /></span>
                  Live Waste-to-Energy Grid
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Waste-to-Energy Processing Hub</h1>
                <p className="text-xs text-cyan-50 mt-1 flex items-center gap-1.5"><Navigation className="w-3.5 h-3.5" />Lokasi Fasilitas: <strong className="text-white">{namaArea}</strong></p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto min-w-0">
              <div className="grid grid-cols-3 gap-2 flex-1 min-w-0 lg:flex-none">
                <div className="min-w-0 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{statistik.total}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-cyan-100">Sumber Limbah</p>
                </div>
                <div className="min-w-0 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white tabular-nums">{kgAnim}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-cyan-100">Kg Tersedia</p>
                </div>
                <div className="min-w-0 bg-white/15 backdrop-blur-sm border border-white/20 rounded-2xl p-3 text-center">
                  <p className="text-xl font-black text-white">{statistik.biogas.toFixed(1)}</p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-cyan-100">m³ Biogas</p>
                </div>
              </div>
              <button onClick={() => setBukaJadwal(true)} className="relative flex shrink-0 items-center gap-2 whitespace-nowrap bg-white/95 hover:bg-white text-slate-900 font-bold px-4 py-3 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer shadow-lg">
                <Database className="w-5 h-5 text-cyan-600" />
                <span className="hidden sm:inline">Riwayat Pemesanan</span>
                {jadwalAktif > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center animate-pulse">{jadwalAktif}</span>
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
              <input type="text" value={kataKunci} onChange={(e) => setKataKunci(e.target.value)} placeholder="Cari limbah atau sumber..."
                className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 text-sm transition-all" />
            </div>
            <form onSubmit={cariLokasiTeks} className="relative flex-1 flex gap-2">
              <div className="relative flex-1">
                <SearchCode className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                <input type="text" value={teksLokasi} onChange={(e) => setTeksLokasi(e.target.value)} placeholder="Pindah kota/area fasilitas..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-sm transition-all" />
              </div>
              <button type="submit" disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}<span className="hidden sm:inline">Cari</span>
              </button>
              <button type="button" onClick={gunakanGPS} disabled={sedangMencariLokasi} className="px-4 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white text-xs font-black transition-all active:scale-95 cursor-pointer disabled:opacity-60 flex items-center gap-1.5">
                {sedangMencariLokasi ? <Loader2 className="w-4 h-4 animate-spin" /> : <LocateFixed className="w-4 h-4" />}<span className="hidden sm:inline">GPS Saya</span>
              </button>
            </form>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 w-fit">
              <Crosshair className="w-4 h-4 text-cyan-500 ml-2 shrink-0" />
              <span className="text-xs font-black text-slate-600 dark:text-slate-400 shrink-0">RADIUS:</span>
              {[1, 3, 5, 10].map((r) => (
                <button key={r} onClick={() => setRadiusKm(r)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${radiusKm === r ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md shadow-cyan-500/30' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-700'}`}>{r} KM</button>
              ))}
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/50 w-fit">
              <Zap className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span className="text-xs font-black text-cyan-700 dark:text-cyan-300 uppercase tracking-wider">Khusus Limbah Organik (Tier 3)</span>
            </div>
          </div>
        </div>

        {/* GRID: PETA + LIST */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* PETA */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl relative overflow-hidden shadow-sm h-[520px] lg:h-[640px]">
            <div className="absolute top-4 left-4 right-4 z-20 flex items-start justify-between pointer-events-none">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2 pointer-events-auto shadow-lg">
                <span className="relative flex w-2 h-2"><span className="absolute inline-flex w-full h-full rounded-full bg-cyan-400 animate-ping" /><span className="relative inline-flex w-2 h-2 rounded-full bg-cyan-500" /></span>
                {sedangMemuat ? 'Memuat...' : `${statistik.total} sumber limbah dalam ${radiusKm} km`}
              </div>
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-2 pointer-events-auto shadow-lg">
                <Zap className="w-3 h-3" /> Tier 3 • Bio-Energi
              </div>
            </div>
            <PetaEnergi
              daftarLimbah={daftarTersaring}
              lokasiFasilitas={lokasiFasilitas}
              radiusKm={radiusKm}
              pusatPeta={pusatPeta}
              zoomPeta={zoomPeta}
              onPilihItem={pilihItem}
              onKlikPeta={(lat, lng) => terapkanLokasi(lat, lng, 'Klik Peta')}
              theme={resolvedTheme}
            />
            <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex justify-center">
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 px-4 py-2 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 shadow-lg">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />Klik peta untuk memindahkan lokasi fasilitas Anda
              </div>
            </div>
          </div>

          {/* LIST LIMBAH */}
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2"><Database className="w-4 h-4 text-cyan-500" />Limbah Terdekat</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Diurutkan dari yang paling dekat</p>
              </div>
              <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/30 px-2.5 py-1 rounded-full border border-cyan-200 dark:border-cyan-800/50">{daftarTersaring.length} sumber</span>
            </div>
            <div className="flex-1 overflow-y-auto scroll-tipis space-y-3 pr-1 -mr-1 max-h-[560px] lg:max-h-[580px]">
              {sedangMemuat ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-10 text-center">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Memindai jaringan limbah organik...</p>
                </div>
              ) : daftarTersaring.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3"><AlertCircle className="w-8 h-8 text-slate-400" /></div>
                  <p className="font-black text-sm text-slate-900 dark:text-white mb-1">Tidak ada limbah dalam radius ini</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Perluas radius atau tunggu merchant menambahkan limbah Tier 3.</p>
                  <button onClick={() => setRadiusKm(10)} className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-black cursor-pointer active:scale-95 transition-all">Perluas ke 10 KM</button>
                </div>
              ) : (
                daftarTersaring.map((item, index) => {
                  const habis = item.stokTersedia <= 0;
                  return (
                    <button key={item.id} onClick={() => !habis && pilihItem(item)} disabled={habis}
                      className={`w-full text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 hover:border-cyan-400 dark:hover:border-cyan-600 hover:shadow-xl hover:shadow-cyan-500/10 transition-all cursor-pointer group anim-slideAtas ${habis ? 'opacity-50 cursor-not-allowed' : ''}`}
                      style={{ animationDelay: `${Math.min(index * 0.05, 0.4)}s` }}>
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-md"><Zap className="w-5 h-5" /></div>
                          <div className="min-w-0">
                            <h4 className="font-black text-sm text-slate-900 dark:text-white line-clamp-1 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">{item.namaMakanan}</h4>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5"><Store className="w-3 h-3" /><span className="truncate">{item.namaResto}</span></p>
                          </div>
                        </div>
                        {habis ? (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-700/40">HABIS</span>
                        ) : (
                          <span className="shrink-0 px-2 py-0.5 rounded-md text-[9px] font-black bg-cyan-50 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-700/40">TIER 3</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-black text-cyan-600 dark:text-cyan-400"><Navigation className="w-3 h-3" />{item.jarakKm.toFixed(1)} km</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="flex items-center gap-1"><Package className="w-3 h-3" /><span className="font-bold">{item.stokTersedia} kg</span></span>
                        <div className="ml-auto"><CountdownLimbah sisaDetik={item.sisaDetik} /></div>
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-amber-500" />
                          <p className="text-sm font-black text-cyan-600 dark:text-cyan-400">{estimasiBiogas(typeof item.stokTersedia === 'number' ? item.stokTersedia : 0).toFixed(1)} m³ Biogas</p>
                        </div>
                        <span className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[10px] font-black shadow-md shadow-cyan-500/30 ${habis ? 'opacity-50' : ''}`}>
                          <Truck className="w-3 h-3" /> {habis ? 'Habis' : 'Klaim Limbah'}
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
            { Icon: ShieldCheck, judul: 'Mitra Pengolah Terverifikasi', deskripsi: 'Fasilitas Anda tercatat resmi di ledger ESG', warna: 'bg-cyan-100 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400' },
            { Icon: Truck, judul: 'Armada Pickup Terjadwal', deskripsi: 'Kurir mitra mengangkut limbah tepat waktu', warna: 'bg-blue-100 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400' },
            { Icon: Recycle, judul: 'Konversi Energi Terukur', deskripsi: 'Biogas & maggot tercatat per kilogram limbah', warna: 'bg-teal-100 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400' },
          ].map((item, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex items-center gap-3 hover:border-cyan-300 dark:hover:border-cyan-700 transition-all">
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