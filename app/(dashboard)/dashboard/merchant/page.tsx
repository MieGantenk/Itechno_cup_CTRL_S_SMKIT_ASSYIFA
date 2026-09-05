'use client';
import React, { useState, useEffect, useMemo, useCallback, useId, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import {
  PlusCircle, QrCode, FileText, TrendingUp, Leaf, Award,
  AlertTriangle, ArrowUpRight, BarChart3, ChevronRight,
  X, Check, CheckCircle2, Copy, Download, Bike, Bell,
  Sparkles, Shield, Zap, Recycle, Users, Printer, Package,
  Link2, Timer, ScanLine, Store, BadgeCheck, Heart, Flame,
  Camera, Activity, Target, Globe, Wind, MapPin, Loader2
} from 'lucide-react';

// Ikon kecil diletakkan terpisah supaya bagian dashboard tidak terlalu padat.
// ============================================================
// IKON SOSIAL MEDIA CUSTOM
// ============================================================
const IkonInstagram = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);
const IkonFacebook = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);
const IkonTwitter = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

// ============================================================
// QR CODE GENERATOR (SVG murni, jadi tidak perlu library tambahan)
// ============================================================
const generateQRMatrix = (data: string, size: number = 25): boolean[][] => {
  let hash = 2166136261;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  let seed = Math.abs(hash) || 12345;
  const rand = () => {
    seed = (Math.imul(seed, 1103515245) + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const matrix: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));
  // Tiga pola sudut membuat QR lebih mudah dikenali oleh kamera.
  const drawFinder = (sx: number, sy: number) => {
    for (let y = -1; y < 8; y++) {
      for (let x = -1; x < 8; x++) {
        const gx = sx + x, gy = sy + y;
        if (gx < 0 || gy < 0 || gx >= size || gy >= size) continue;
        const inOuter = x >= 0 && x <= 6 && y >= 0 && y <= 6;
        if (!inOuter) { matrix[gy][gx] = false; continue; }
        const isRing = x === 0 || x === 6 || y === 0 || y === 6;
        const isCore = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        matrix[gy][gx] = isRing || isCore;
      }
    }
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) matrix[y][x] = rand() > 0.52;
  drawFinder(0, 0); drawFinder(size - 7, 0); drawFinder(0, size - 7);
  for (let i = 8; i < size - 8; i++) { matrix[6][i] = i % 2 === 0; matrix[i][6] = i % 2 === 0; }
  for (let y = size - 9; y < size - 4; y++)
    for (let x = size - 9; x < size - 4; x++) {
      const lx = x - (size - 9), ly = y - (size - 9);
      matrix[y][x] = lx === 0 || lx === 4 || ly === 0 || ly === 4 || (lx === 2 && ly === 2);
    }
  return matrix;
};

function QRCodeSVG({ value, size = 220, className = '' }: { value: string; size?: number; className?: string }) {
  // Hitung ulang pola hanya jika isi QR berubah.
  const matrix = useMemo(() => generateQRMatrix(value), [value]);
  const n = matrix.length;
  const cell = size / n;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <rect width={size} height={size} fill="#ffffff" rx={8} />
      {matrix.map((row, y) => row.map((filled, x) => filled ? (
        <rect key={`${x}-${y}`} x={x * cell + cell * 0.08} y={y * cell + cell * 0.08} width={cell * 0.84} height={cell * 0.84} rx={cell * 0.18} fill="#0f172a" />
      ) : null))}
      <g transform={`translate(${size / 2 - size * 0.09}, ${size / 2 - size * 0.09})`}>
        <rect width={size * 0.18} height={size * 0.18} rx={size * 0.03} fill="#10b981" />
        <g transform={`scale(${(size * 0.18) / 24})`} stroke="#ffffff" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </g>
      </g>
    </svg>
  );
}

// ============================================================
// PROGRESS RING
// ============================================================
function ProgressRing({ percent, size = 54, stroke = 5, color = '#10b981', trackColor, children }: {
  percent: number; size?: number; stroke?: number; color?: string; trackColor?: string; children?: React.ReactNode;
}) {
  // Animasi membuat perubahan persentase terlihat lebih halus.
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(percent), 200); return () => clearTimeout(t); }, [percent]);
  const r = (size - stroke) / 2; const c = 2 * Math.PI * r;
  const finalTrack = trackColor || 'rgba(148,163,184,0.18)';
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke={finalTrack} strokeWidth={stroke} fill="none" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (animated / 100) * c}
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// ============================================================
// SPARKLINE
// ============================================================
function Sparkline({ data, color = '#10b981', width = 120, height = 36 }: { data: number[]; color?: string; width?: number; height?: number }) {
  // Data diubah menjadi titik yang kemudian digambar sebagai garis SVG.
  const id = useId();
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * (height - 6) - 3;
    return `${x},${y}`;
  });
  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts.join(' ')} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 400, strokeDashoffset: 400, animation: 'drawLine 1.8s ease-out forwards' }} />
      <circle cx={width} cy={height - ((data[data.length - 1] - min) / (max - min || 1)) * (height - 6) - 3} r="3.5" fill={color} />
    </svg>
  );
}

// ============================================================
// COUNT-UP HOOK
// ============================================================
function useCountUp(target: number, duration = 1600) {
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

// ============================================================
// TIPE DATA
// ============================================================
type TierKey = 'tier1' | 'tier2' | 'tier3';
type HandoverStatus = 'active' | 'scanned' | 'taken' | 'delivered';

interface ProdukSurplus {
  id: number; nama: string; tier: TierKey; status: string; prep: string;
  sisaDetik: number; harga: string; stok: number | string; kategori: string;
  darurat?: boolean; merchantEmail?: string; merchantName?: string; merchantId?: string;
  namaResto?: string; alamatResto?: string; createdAt?: string;
}

interface Notifikasi { id: number; tipe: 'kurir' | 'konsumen' | 'sistem'; judul: string; pesan: string; }

interface StatistikESG {
  totalKg: number;
  totalPorsi: number;
  totalCo2Kg: number;
  totalBiogasM3: number;
  totalRevenue: number;
  jumlahTransaksi: number;
  jumlahTier1: number;
  jumlahTier2: number;
  jumlahTier3: number;
  grade: 'A+' | 'A' | 'B+' | 'B' | 'C';
  targetKg: number;
  persenTarget: number;
}

const getTierFromKategori = (kategori: string): TierKey => {
  if (!kategori) return 'tier1';
  const str = kategori.toLowerCase();
  if (str.includes('tier1') || str.includes('tier 1') || str === '1') return 'tier1';
  if (str.includes('tier2') || str.includes('tier 2') || str === '2') return 'tier2';
  if (str.includes('tier3') || str.includes('tier 3') || str === '3') return 'tier3';
  return 'tier1';
};

const TIER_CONFIG: Record<TierKey, {
  label: string; warna: string; warnaLight: string; bg: string; bgLight: string; border: string; borderLight: string;
  glow: string; gradasi: string; Icon: any; deskripsi: string;
}> = {
  tier1: {
    label: 'Tier 1', warna: 'text-amber-600 dark:text-amber-400', warnaLight: 'text-amber-700',
    bg: 'dark:bg-amber-500/10', bgLight: 'bg-amber-50',
    border: 'dark:border-amber-500/30', borderLight: 'border-amber-200',
    glow: 'shadow-amber-500/20', gradasi: 'from-amber-500 to-orange-600', Icon: Store,
    deskripsi: 'Surplus Marketplace — Diskon 50-70%',
  },
  tier2: {
    label: 'Tier 2', warna: 'text-emerald-600 dark:text-emerald-400', warnaLight: 'text-emerald-700',
    bg: 'dark:bg-emerald-500/10', bgLight: 'bg-emerald-50',
    border: 'dark:border-emerald-500/30', borderLight: 'border-emerald-200',
    glow: 'shadow-emerald-500/20', gradasi: 'from-emerald-500 to-teal-600', Icon: Heart,
    deskripsi: 'Donasi Panti & Warga Rentan',
  },
  tier3: {
    label: 'Tier 3', warna: 'text-cyan-600 dark:text-cyan-400', warnaLight: 'text-cyan-700',
    bg: 'dark:bg-cyan-500/10', bgLight: 'bg-cyan-50',
    border: 'dark:border-cyan-500/30', borderLight: 'border-cyan-200',
    glow: 'shadow-cyan-500/20', gradasi: 'from-cyan-500 to-blue-600', Icon: Zap,
    deskripsi: 'Konversi Biogas & Maggot BSF',
  },
};

// Modal ini menampilkan QR dan alur serah terima makanan.
// ============================================================
// MODAL QR HANDOVER
// ============================================================
function ModalQRHandover({ produk, onClose, onKirimNotifikasi }: {
  produk: ProdukSurplus; onClose: () => void; onKirimNotifikasi: (n: Omit<Notifikasi, 'id'>) => void;
}) {
  const [status, setStatus] = useState<HandoverStatus>('active');
  const [salin, setSalin] = useState(false);
  const kodeQR = `PC-HANDOVER-${produk.id}-${produk.nama.slice(0, 6).toUpperCase()}-2026`;
  const cfg = TIER_CONFIG[produk.tier];
  const langkahAlur = [
    { key: 'active', label: 'QR Aktif', Icon: QrCode, desc: 'Kode siap dipindai kurir' },
    { key: 'scanned', label: 'Dipindai', Icon: ScanLine, desc: 'Kurir memindai kode' },
    { key: 'taken', label: 'Diambil', Icon: Bike, desc: 'Makanan di tangan kurir' },
    { key: 'delivered', label: 'Terkirim', Icon: CheckCircle2, desc: 'Diterima penerima' },
  ];
  const idxStatus = langkahAlur.findIndex((l) => l.key === status);
  const simulasikanScanKurir = async () => {
    if (status !== 'active') return;
    setStatus('scanned');
    
    // Saat QR dipindai, pesanan mulai masuk tahap pengantaran.
    try {
      await supabase
        .from('pesanan')
        .update({ status: 'sedang_diantar' })
        .eq('makanan_id', produk.id)
        .in('status', ['dibayar', 'sedang_diantar']); // Update only pending orders
      
      // Status misi kurir disamakan agar progress tampil konsisten di halaman lain.
      await supabase
        .from('misi_kurir')
        .update({ status: 'sedang_diantar' })
        .eq('makanan_id', produk.id)
        .eq('status', 'diambil');
    } catch (err) {
      console.error('Gagal update status pesanan:', err);
    }
    
    onKirimNotifikasi({ tipe: 'kurir', judul: 'QR Dipindai Kurir', pesan: 'Kurir Budi S. memindai QR handover. Verifikasi identitas berhasil.' });
    setTimeout(() => {
      setStatus('taken');
      onKirimNotifikasi({ tipe: 'konsumen', judul: 'Notifikasi ke Penerima Terkirim', pesan: `"${produk.nama}" telah diambil oleh kurir. Estimasi tiba 15 menit.` });
    }, 2200);
    setTimeout(() => {
      setStatus('delivered');
      onKirimNotifikasi({ tipe: 'sistem', judul: 'Handover Selesai', pesan: 'Serah terima tercatat di ledger ESG. +2 poin dampak ditambahkan.' });
    }, 4800);
  };
  const salinKode = () => { navigator.clipboard?.writeText(kodeQR).catch(() => {}); setSalin(true); setTimeout(() => setSalin(false), 1800); };
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn max-h-[92vh] overflow-y-auto scroll-tipis" onClick={(e) => e.stopPropagation()}>
        <div className={`absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none bg-gradient-to-br ${cfg.gradasi}`} />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-10 pointer-events-none bg-gradient-to-tr from-emerald-500 to-teal-600" />
        <div className={`relative bg-gradient-to-r ${cfg.gradasi} p-6 sm:p-7 overflow-hidden`}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 p-3 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 text-white"><QrCode className="w-7 h-7" /></div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70">QR Handover Protocol</p>
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">Serah Terima {cfg.label}</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-2.5 rounded-xl bg-white/15 hover:bg-white/30 text-white transition-all active:scale-90 cursor-pointer"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="relative grid md:grid-cols-2 gap-6 p-6 sm:p-7">
          <div className="flex flex-col items-center">
            <div className="relative group">
              <div className={`p-3 bg-white rounded-2xl shadow-xl border border-slate-200 transition-all duration-500 ${status === 'delivered' ? 'opacity-40 grayscale' : ''} ${status === 'scanned' ? 'ring-4 ring-emerald-400/60 scale-[1.02]' : ''}`}>
                {/* QR CODE SVG (OPSI 2) */}
                <QRCodeSVG value={kodeQR} size={210} />
              </div>
              {status === 'delivered' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-emerald-500 text-white rounded-2xl px-5 py-3 shadow-2xl shadow-emerald-500/50 animate-scaleIn flex items-center gap-2 rotate-[-6deg]">
                    <CheckCircle2 className="w-6 h-6" /><span className="font-black text-sm">TERKIRIM</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 w-full">
              <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
                <code className="text-[11px] font-mono text-emerald-700 dark:text-emerald-300 truncate pr-2">{kodeQR}</code>
                <button onClick={salinKode} className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-white transition-colors shrink-0 cursor-pointer">
                  {salin ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {salin ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 text-center mt-2.5 flex items-center justify-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-500" /> Terenkripsi • Sekali pakai • Terverifikasi ledger ESG
              </p>
            </div>
          </div>
          <div className="space-y-5">
            <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.gradasi} flex items-center justify-center text-white shadow-lg shrink-0`}>
                  <cfg.Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{produk.nama}</p>
                  <p className={`text-[11px] font-semibold ${cfg.warna}`}>{produk.status} • Stok: {produk.stok}</p>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-3">Alur Pelacakan Realtime</p>
              <div className="space-y-1">
                {langkahAlur.map((langkah, i) => {
                  const aktif = i === idxStatus; const selesai = i < idxStatus;
                  return (
                    <div key={langkah.key} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`relative w-9 h-9 rounded-xl flex items-center justify-center border-2 transition-all duration-500 shrink-0 ${
                          selesai ? 'bg-emerald-500 border-emerald-500 text-white' :
                          aktif ? `bg-gradient-to-br ${cfg.gradasi} border-transparent text-white shadow-lg ${cfg.glow}` :
                          'bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500'
                        }`}>
                          {aktif && <span className="absolute inset-0 rounded-xl bg-emerald-400/40 animate-ping" />}
                          <langkah.Icon className="w-4 h-4 relative" />
                        </div>
                        {i < langkahAlur.length - 1 && (
                          <div className={`w-0.5 h-5 transition-all duration-500 ${selesai ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-800'}`} />
                        )}
                      </div>
                      <div className={`pb-3 transition-all duration-500 ${aktif || selesai ? '' : 'opacity-50'}`}>
                        <p className={`text-xs font-bold ${aktif ? 'text-slate-900 dark:text-white' : selesai ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>{langkah.label}</p>
                        <p className="text-[10px] text-slate-500">{langkah.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {status === 'active' ? (
              <button onClick={simulasikanScanKurir} className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/25 active:scale-[0.98] cursor-pointer group overflow-hidden relative">
                <span className="absolute inset-0 efek-kilau" />
                <Camera className="w-5 h-5 group-hover:rotate-6 transition-transform" /> Simulasikan Scan Kurir Sekarang
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm flex items-center justify-center gap-2.5">
                <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
                {status === 'scanned' ? 'Memverifikasi identitas kurir...' : status === 'taken' ? 'Kurir menuju lokasi penerima...' : 'Transaksi selesai & tercatat'}
              </div>
            )}
            <p className="text-[10px] text-slate-500 text-center leading-relaxed">Saat kurir memindai QR, sistem otomatis mengirim notifikasi push ke konsumen/panti bahwa makanan telah diambil.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MODAL SERTIFIKAT ESG
// ============================================================
function ModalSertifikatESG({ onClose, statistik, namaResto }: { onClose: () => void; statistik: StatistikESG; namaResto: string }) {
  const [tabLaporan, setTabLaporan] = useState<'sertifikat' | 'laporan'>('sertifikat');
  const [tersalin, setTersalin] = useState(false);
  const sertifikatRef = useRef<HTMLDivElement>(null);

  const kodeVerifikasi = `ESG-${new Date().getFullYear()}-${statistik.grade}-${String(statistik.jumlahTransaksi).padStart(4, '0')}`;
  const tanggalTerbit = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  const tanggalExpired = new Date();
  tanggalExpired.setFullYear(tanggalExpired.getFullYear() + 1);
  const tanggalExpiredStr = tanggalExpired.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const dataBulanan = [
    { bulan: 'Mar', t1: 38, t2: 22, t3: 15 },
    { bulan: 'Apr', t1: 45, t2: 30, t3: 20 },
    { bulan: 'Mei', t1: 52, t2: 34, t3: 26 },
    { bulan: 'Jun', t1: 48, t2: 41, t3: 31 },
    { bulan: 'Jul', t1: 61, t2: 45, t3: 38 },
    { bulan: 'Agu', t1: statistik.jumlahTier1, t2: statistik.jumlahTier2, t3: statistik.jumlahTier3 },
  ];
  const maksGrafik = 90;

  // Browser akan membuka dialog print yang bisa dipilih sebagai PDF.
  const unduhSertifikat = () => {
    window.print();
  };

  const salinLink = () => {
    navigator.clipboard?.writeText(`https://pangancerdas.id/verify/${kodeVerifikasi}`).catch(() => {});
    setTersalin(true);
    setTimeout(() => setTersalin(false), 1800);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/85 backdrop-blur-md animate-fadeIn" onClick={onClose}>
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/60 rounded-[2rem] shadow-2xl overflow-hidden animate-scaleIn max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* HEADER MODAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">Pusat Sertifikasi & Laporan ESG</h3>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-widest">Periode {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer"><X className="w-5 h-5" /></button>
        </div>
        {/* TAB SWITCHER */}
        <div className="flex gap-1.5 px-6 pt-4 shrink-0 print:hidden bg-white dark:bg-slate-900">
          {(['sertifikat', 'laporan'] as const).map((tab) => (
            <button key={tab} onClick={() => setTabLaporan(tab)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                tabLaporan === tab ? 'bg-gradient-to-r from-purple-500 to-fuchsia-600 text-white shadow-lg shadow-purple-500/30' : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}>
              {tab === 'sertifikat' ? 'Sertifikat Hijau' : 'Laporan Bulanan'}
            </button>
          ))}
        </div>
        {/* KONTEN */}
        <div className="flex-1 overflow-y-auto p-6 scroll-tipis bg-white dark:bg-slate-900">
          {/* TAB SERTIFIKAT */}
          {tabLaporan === 'sertifikat' && (
            <div className="flex flex-col items-center gap-4">
              <div
                id="area-sertifikat"
                ref={sertifikatRef}
                className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200"
                style={{ aspectRatio: '1.414 / 1' }}
              >
                <div className="relative w-full h-full bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-8 sm:p-12 flex flex-col">
                  <div className="absolute inset-4 border-2 border-emerald-600/30 rounded-xl pointer-events-none" />
                  <div className="absolute inset-6 border border-emerald-600/20 rounded-lg pointer-events-none" />

                  <div className="absolute top-8 left-8 w-16 h-16 border-t-4 border-l-4 border-emerald-600 rounded-tl-lg" />
                  <div className="absolute top-8 right-8 w-16 h-16 border-t-4 border-r-4 border-emerald-600 rounded-tr-lg" />
                  <div className="absolute bottom-8 left-8 w-16 h-16 border-b-4 border-l-4 border-emerald-600 rounded-bl-lg" />
                  <div className="absolute bottom-8 right-8 w-16 h-16 border-b-4 border-r-4 border-emerald-600 rounded-br-lg" />

                  <div className="relative text-center mb-6">
                    <div className="inline-flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                        <Leaf className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-xl font-black text-slate-900">Pangan<span className="text-emerald-600">Cerdas</span></p>
                        <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-emerald-700">Green Business Certification</p>
                      </div>
                    </div>
                    <div className="w-24 h-0.5 bg-emerald-600 mx-auto mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-amber-600 mb-2">Certificate of Excellence</p>
                    <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
                      Sertifikat Mitra Ramah Lingkungan
                    </h1>
                  </div>

                  <div className="relative flex-1 flex flex-col items-center justify-center text-center px-4">
                    <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold mb-2">Dengan bangga diberikan kepada</p>
                    <h2 className="text-3xl sm:text-5xl font-black text-emerald-700 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                      {namaResto || 'Merchant PanganCerdas'}
                    </h2>
                    <div className="w-32 h-0.5 bg-gradient-to-r from-transparent via-emerald-600 to-transparent mb-4" />
                    <p className="text-sm text-slate-700 max-w-2xl leading-relaxed mb-6">
                      Atas dedikasi dan kontribusi luar biasa dalam mengurangi limbah pangan melalui
                      ekosistem <strong className="text-emerald-700">3-Tier PanganCerdas</strong>, mendukung pencapaian
                      SDG 12 (Konsumsi & Produksi Bertanggung Jawab) dan SDG 13 (Penanganan Perubahan Iklim).
                    </p>

                    <div className="grid grid-cols-4 gap-3 w-full max-w-3xl mb-6">
                      <div className="bg-white/80 backdrop-blur-sm border border-emerald-200 rounded-xl p-3">
                        <Recycle className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                        <p className="text-xl font-black text-slate-900">{statistik.totalKg.toFixed(0)}</p>
                        <p className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">Kg Sampah Dicegah</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm border border-amber-200 rounded-xl p-3">
                        <Users className="w-5 h-5 text-amber-600 mx-auto mb-1" />
                        <p className="text-xl font-black text-slate-900">{statistik.totalPorsi}</p>
                        <p className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">Porsi Tersalurkan</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm border border-cyan-200 rounded-xl p-3">
                        <Wind className="w-5 h-5 text-cyan-600 mx-auto mb-1" />
                        <p className="text-xl font-black text-slate-900">{(statistik.totalCo2Kg / 1000).toFixed(2)}</p>
                        <p className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">Ton CO₂e Dihindari</p>
                      </div>
                      <div className="bg-white/80 backdrop-blur-sm border border-purple-200 rounded-xl p-3">
                        <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                        <p className="text-xl font-black text-slate-900">{statistik.totalBiogasM3.toFixed(1)}</p>
                        <p className="text-[8px] text-slate-600 uppercase tracking-wider font-bold">m³ Biogas Dihasilkan</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center gap-8 mb-4">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-400/30 blur-xl rounded-full" />
                        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex flex-col items-center justify-center shadow-2xl border-4 border-amber-200">
                          <p className="text-[8px] font-black text-amber-900 uppercase tracking-widest">Grade</p>
                          <p className="text-4xl font-black text-amber-950 leading-none" style={{ fontFamily: 'Georgia, serif' }}>{statistik.grade}</p>
                          <BadgeCheck className="w-3 h-3 text-amber-900 mt-0.5" />
                        </div>
                      </div>
                      <div className="text-left">
                        <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Kode Verifikasi</p>
                        <p className="font-mono font-bold text-slate-900 text-sm">{kodeVerifikasi}</p>
                        <p className="text-[9px] text-slate-500 mt-1">Terbit: {tanggalTerbit}</p>
                        <p className="text-[9px] text-slate-500">Berlaku s/d: {tanggalExpiredStr}</p>
                      </div>
                      <div className="bg-white p-2 rounded-lg shadow-md border border-slate-200">
                        {/* QR CODE SVG (OPSI 2) */}
                        <QRCodeSVG value={`https://pangancerdas.id/verify/${kodeVerifikasi}`} size={80} />
                        <p className="text-[7px] text-slate-500 text-center mt-1 font-bold">Scan untuk verifikasi</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-end justify-between mt-4 pt-4 border-t border-emerald-200">
                    <div className="text-center">
                      <p className="font-serif italic text-lg text-slate-800" style={{ fontFamily: 'Georgia, serif' }}>D. Prasetyo</p>
                      <div className="w-32 border-t border-slate-400 pt-1">
                        <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Direktur PanganCerdas</p>
                      </div>
                    </div>
                    <div className="text-center">
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Doc ID</p>
                      <p className="font-mono text-[9px] text-slate-700">{kodeVerifikasi}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold">Halaman</p>
                      <p className="text-[9px] text-slate-700">1 dari 1</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="w-full max-w-4xl p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl print:hidden">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200">
                    <p className="font-black mb-1">💡 Tips:</p>
                    <ul className="list-disc list-inside space-y-0.5 text-blue-800 dark:text-blue-300">
                      <li>Klik tombol <strong>&quot;Unduh PDF&quot;</strong> untuk menyimpan sertifikat sebagai file PDF</li>
                      <li>QR Code dapat di-scan menggunakan kamera HP untuk verifikasi online</li>
                      <li>Pajang di media sosial atau toko fisik sebagai bukti Green Business</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB LAPORAN BULANAN */}
          {tabLaporan === 'laporan' && (
            <div id="area-laporan" className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Total Pcs Diselamatkan', nilai: `${statistik.totalKg.toFixed(0)} Pcs`, delta: `+${statistik.persenTarget.toFixed(0)}%`, Icon: Recycle, warna: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                  { label: 'Total Porsi', nilai: `${statistik.totalPorsi}`, delta: `${statistik.jumlahTransaksi} trans.`, Icon: Users, warna: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                  { label: 'CO₂e Dihindari', nilai: `${(statistik.totalCo2Kg / 1000).toFixed(2)} T`, delta: 'Bulan ini', Icon: Wind, warna: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
                  { label: 'Revenue Surplus', nilai: `Rp ${(statistik.totalRevenue / 1000).toFixed(1)}rb`, delta: 'Tier 1', Icon: TrendingUp, warna: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                ].map((k) => (
                  <div key={k.label} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4">
                    <div className={`w-8 h-8 rounded-lg ${k.bg} ${k.warna} flex items-center justify-center mb-2.5`}><k.Icon className="w-4 h-4" /></div>
                    <p className="text-slate-900 dark:text-white font-black text-base leading-none">{k.nilai}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1.5">{k.label}</p>
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1">{k.delta}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { tier: 'Tier 1', jumlah: statistik.jumlahTier1, Icon: Store, gradasi: 'from-amber-500 to-orange-600', bg: 'bg-amber-50 dark:bg-amber-950/30', teks: 'text-amber-600 dark:text-amber-400', desc: 'Marketplace' },
                  { tier: 'Tier 2', jumlah: statistik.jumlahTier2, Icon: Heart, gradasi: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50 dark:bg-emerald-950/30', teks: 'text-emerald-600 dark:text-emerald-400', desc: 'Donasi' },
                  { tier: 'Tier 3', jumlah: statistik.jumlahTier3, Icon: Zap, gradasi: 'from-cyan-500 to-blue-600', bg: 'bg-cyan-50 dark:bg-cyan-950/30', teks: 'text-cyan-600 dark:text-cyan-400', desc: 'Biogas' },
                ].map((t) => (
                  <div key={t.tier} className={`${t.bg} border border-slate-200 dark:border-slate-800 rounded-2xl p-4`}>
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradasi} flex items-center justify-center text-white shadow-lg mb-3`}>
                      <t.Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-2xl font-black ${t.teks}`}>{t.jumlah}</p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{t.tier} • {t.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">Tren Kontribusi 6 Bulan Terakhir</p>
                    <p className="text-[10px] text-slate-500">Distribusi volume per tier (Kg)</p>
                  </div>
                  <div className="flex gap-3">
                    {[{ c: 'bg-amber-400', l: 'Tier 1' }, { c: 'bg-emerald-400', l: 'Tier 2' }, { c: 'bg-cyan-400', l: 'Tier 3' }].map((lg) => (
                      <span key={lg.l} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-semibold"><span className={`w-2 h-2 rounded-full ${lg.c}`} />{lg.l}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2 sm:gap-4 h-44">
                  {dataBulanan.map((d) => (
                    <div key={d.bulan} className="flex-1 flex flex-col items-center gap-2 group">
                      <div className="w-full flex items-end justify-center gap-1 h-36">
                        {[
                          { v: d.t1, c: 'from-amber-400 to-orange-500' },
                          { v: d.t2, c: 'from-emerald-400 to-teal-500' },
                          { v: d.t3, c: 'from-cyan-400 to-blue-500' },
                        ].map((bar, j) => (
                          <div key={j} className="flex-1 max-w-[14px] rounded-t-md bg-gradient-to-t relative overflow-hidden group-hover:brightness-110 transition-all"
                            style={{ height: `${(bar.v / maksGrafik) * 100}%`, transitionDelay: `${j * 60}ms` }}>
                            <div className={`absolute inset-0 bg-gradient-to-t ${bar.c}`} />
                          </div>
                        ))}
                      </div>
                      <span className="text-[9px] font-bold text-slate-500 uppercase">{d.bulan}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/10 border border-emerald-200 dark:border-emerald-500/25 rounded-2xl p-5 flex items-start gap-3.5">
                <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0"><Sparkles className="w-5 h-5" /></div>
                <div>
                  <p className="text-sm font-black text-slate-900 dark:text-white mb-1">Insight Otomatis AI PanganCerdas</p>
                  <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    Kinerja bulan ini mencapai grade <strong className="text-emerald-600 dark:text-emerald-400">{statistik.grade}</strong> dengan {statistik.jumlahTransaksi} transaksi.
                    {statistik.persenTarget >= 100
                      ? ' 🎉 Target ESG terlampaui! Pertahankan momentum ini.'
                      : ` Untuk mencapai target ${statistik.targetKg} Kg, diperlukan tambahan ${(statistik.targetKg - statistik.totalKg).toFixed(0)} Kg bulan ini.`}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        {/* FOOTER AKSI */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 shrink-0 print:hidden">
          <div className="flex flex-col sm:flex-row items-center gap-3 justify-between">
            <div className="flex gap-2">
              {[
                { Icon: IkonInstagram, label: 'Instagram', hover: 'hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10' },
                { Icon: IkonFacebook, label: 'Facebook', hover: 'hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10' },
                { Icon: IkonTwitter, label: 'Twitter / X', hover: 'hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-600' },
              ].map((s) => (
                <button key={s.label} title={`Bagikan ke ${s.label}`}
                  className={`p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-all active:scale-90 cursor-pointer ${s.hover}`}
                  onClick={() => {
                    const pesan = encodeURIComponent(`${namaResto} meraih Grade ${statistik.grade} Sertifikat Hijau dari PanganCerdas! 🌱 #ZeroFoodWaste #GreenBusiness`);
                    const url = encodeURIComponent(`https://pangancerdas.id/verify/${kodeVerifikasi}`);
                    let shareUrl = '#';
                    if (s.label === 'Facebook') shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${pesan}`;
                    if (s.label === 'Twitter / X') shareUrl = `https://twitter.com/intent/tweet?text=${pesan}&url=${url}`;
                    if (s.label === 'Instagram') shareUrl = `https://www.instagram.com/`;
                    window.open(shareUrl, '_blank', 'width=600,height=600');
                  }}>
                  <s.Icon className="w-4 h-4" />
                </button>
              ))}
              <button onClick={salinLink} title="Salin link verifikasi"
                className="p-2.5 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90 cursor-pointer flex items-center gap-1.5">
                {tersalin ? <Check className="w-4 h-4 text-emerald-500" /> : <Link2 className="w-4 h-4" />}
                <span className="text-[10px] font-bold hidden sm:inline">{tersalin ? 'Tersalin' : 'Link Verifikasi'}</span>
              </button>
            </div>
            <button onClick={unduhSertifikat}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:from-purple-400 hover:to-fuchsia-500 text-white font-black text-sm shadow-xl shadow-purple-500/30 transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden group">
              <span className="absolute inset-0 efek-kilau" />
              <Download className="w-4 h-4" /> Unduh PDF {tabLaporan === 'sertifikat' ? 'Sertifikat' : 'Laporan'}
            </button>
          </div>
          <p className="text-[9px] text-slate-500 text-center mt-3">
            ✨ Sertifikat ini dilengkapi QR Code yang dapat di-scan untuk verifikasi keaslian secara online
          </p>
        </div>
      </div>
    </div>
  );
}

// Helper Info icon
function Info({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

// Dashboard utama menggabungkan data produk, statistik, notifikasi, dan modal.
// ============================================================
// KOMPONEN UTAMA DASHBOARD
// ============================================================
export default function MerchantDashboard() {
  // State ini mengatur filter produk, timer, modal, dan data merchant.
  const [activeTab, setActiveTab] = useState<'all' | TierKey>('all');
  const [modalQR, setModalQR] = useState<ProdukSurplus | null>(null);
  const [modalSertifikat, setModalSertifikat] = useState(false);
  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>([]);
  const [detik, setDetik] = useState(0);
  const [produkAwal, setProdukAwal] = useState<ProdukSurplus[]>([]);
  const [namaResto, setNamaResto] = useState<string>('Merchant PanganCerdas');
  const [statistik, setStatistik] = useState<StatistikESG>({
    totalKg: 0, totalPorsi: 0, totalCo2Kg: 0, totalBiogasM3: 0,
    totalRevenue: 0, jumlahTransaksi: 0,
    jumlahTier1: 0, jumlahTier2: 0, jumlahTier3: 0,
    grade: 'C', targetKg: 550, persenTarget: 0,
  });
  const [sedangMemuat, setSedangMemuat] = useState(true);
  // Notifikasi dihapus otomatis setelah beberapa detik.
  const kirimNotifikasi = useCallback((n: Omit<Notifikasi, 'id'>) => {
    const id = Date.now() + Math.random();
    setNotifikasi((prev) => [...prev, { ...n, id }]);
    setTimeout(() => setNotifikasi((prev) => prev.filter((x) => x.id !== id)), 6000);
  }, []);

  useEffect(() => {
    const muatDataMerchant = async () => {
      setSedangMemuat(true);
      try {
        // Data merchant diambil dari user yang sedang login.
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSedangMemuat(false); return; }
        const { data: profil } = await supabase
          .from('profiles').select('nama_lengkap, nama_instansi').eq('id', user.id).single();
        const namaRestoAktif = profil?.nama_instansi || profil?.nama_lengkap || user.user_metadata?.full_name || 'Merchant PanganCerdas';
        setNamaResto(namaRestoAktif);
        const { data, error } = await supabase
          .from('makanan_surplus').select('*')
          .or(`merchant_email.eq.${user.email},merchant_id.eq.${user.id}`)
          .order('created_at', { ascending: false });
        if (error) throw error;
        // Produk tanpa stok tidak ditampilkan di daftar yang siap diproses.
        const dataTersedia = (data || []).filter((item: any) => {
          const stok = Number(item.stok_tersedia ?? item.berat_kg ?? 0) || 0;
          return stok > 0;
        });
        const { data: pesanan, error: errPesanan } = await supabase
          .from('pesanan')
          .select('id, makanan_id, jumlah, total_harga, status')
          .in('status', ['dibayar', 'sedang_diantar', 'selesai']);
        if (errPesanan) console.warn('Gagal memuat pendapatan pesanan:', errPesanan);

        if (dataTersedia.length > 0) {
          // Ubah bentuk data database menjadi bentuk yang dipakai komponen dashboard.
          const produk: ProdukSurplus[] = dataTersedia.map((item: any, idx) => ({
            id: idx + 1, nama: item.nama_makanan, tier: getTierFromKategori(item.kategori_tier),
            status: 'Siap Diproses', prep: new Date(item.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            sisaDetik: 18000 + (idx * 3600),
            harga: item.kategori_tier === 'tier1_marketplace' ? `Rp ${item.harga_diskon || 0}` : 'Gratis',
            stok: item.stok_tersedia ?? item.berat_kg, kategori: item.kategori_tier,
            merchantEmail: item.merchant_email, merchantName: item.merchant_name, merchantId: item.merchant_id,
            namaResto: item.nama_resto, alamatResto: item.alamat_resto, createdAt: item.created_at,
          }));
          setProdukAwal(produk);
          let totalKg = 0, totalPorsi = 0, totalCo2Kg = 0, totalBiogasM3 = 0, totalRevenue = 0;
          let jmlT1 = 0, jmlT2 = 0, jmlT3 = 0;
          dataTersedia.forEach((item) => {
            const stok = Number(item.stok_tersedia ?? item.berat_kg ?? 0) || 0;
            const tier = getTierFromKategori(item.kategori_tier);
            totalKg += stok;
            totalPorsi += stok;
            totalCo2Kg += stok * 2.5;
            if (tier === 'tier1') { jmlT1++; totalRevenue += Number(item.harga_diskon) || 0; }
            else if (tier === 'tier2') { jmlT2++; }
            else { jmlT3++; totalBiogasM3 += stok * 0.15; }
          });
          if (pesanan) {
            // Jika ada pesanan, angka pendapatan dan porsi mengikuti transaksi nyata.
            const pendapatanDariPesanan = pesanan.reduce((sum, p) => sum + (Number(p.total_harga) || 0), 0);
            totalRevenue = pendapatanDariPesanan;
            totalPorsi = pesanan.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);
            totalKg = pesanan.reduce((sum, p) => sum + (Number(p.jumlah) || 0), 0);
          }
          const targetKg = 550; const persenTarget = (totalKg / targetKg) * 100;
          let grade: StatistikESG['grade'] = 'C';
          if (totalKg >= 500) grade = 'A+';
          else if (totalKg >= 400) grade = 'A';
          else if (totalKg >= 300) grade = 'B+';
          else if (totalKg >= 200) grade = 'B';
          setStatistik({ totalKg, totalPorsi, totalCo2Kg, totalBiogasM3, totalRevenue, jumlahTransaksi: data.length, jumlahTier1: jmlT1, jumlahTier2: jmlT2, jumlahTier3: jmlT3, grade, targetKg, persenTarget });
        }
      } catch (err) { console.error('Gagal memuat data merchant:', err); }
      finally { setSedangMemuat(false); }
    };
    muatDataMerchant();
    // Perbarui dashboard saat produk berubah atau ada scan handover baru.
    const channel = supabase.channel('dashboard-merchant-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'makanan_surplus' }, () => { muatDataMerchant(); })
      .on('broadcast', { event: 'handover-scan' }, ({ payload }) => {
        kirimNotifikasi({
          tipe: 'kurir',
          judul: payload?.judul || 'Handover Order Tiba',
          pesan: payload?.pesan || 'Kurir telah memindai QR handover dan order sudah tiba di fasilitas energi.',
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [kirimNotifikasi]);

  useEffect(() => {
    // Timer ini dipakai untuk menghitung mundur waktu persiapan produk.
    const t = setInterval(() => setDetik((d) => d + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Terapkan tab tier setelah produk yang stoknya masih tersedia disaring.
  const produkTampil = useMemo(() => {
    const tersedia = produkAwal.filter((p) => Number(p.stok || 0) > 0);
    return activeTab === 'all' ? tersedia : tersedia.filter((p) => p.tier === activeTab);
  }, [activeTab, produkAwal, detik]);
  const sisaProduk = (p: ProdukSurplus) => Math.max(0, p.sisaDetik - detik);
  const formatSisa = (s: number) => {
    const j = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), d = s % 60;
    return `${j.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${d.toString().padStart(2, '0')}`;
  };
  const kgDicegah = useCountUp(statistik.totalKg);
  const co2Dicegah = useCountUp(statistik.totalCo2Kg);
  const revenue = useCountUp(statistik.totalRevenue);
  const porsiTier1 = useCountUp(statistik.totalPorsi);

  // Ikon dan warna notifikasi disesuaikan dengan sumber pesannya.
  const KONFIG_NOTIF: Record<Notifikasi['tipe'], { Icon: any; warna: string; border: string }> = {
    kurir: { Icon: Bike, warna: 'text-blue-500', border: 'border-blue-200 dark:border-blue-500/40' },
    konsumen: { Icon: Bell, warna: 'text-emerald-500', border: 'border-emerald-200 dark:border-emerald-500/40' },
    sistem: { Icon: Shield, warna: 'text-purple-500', border: 'border-purple-200 dark:border-purple-500/40' },
  };

  return (
    <>
      <style jsx global>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(.94) translateY(10px) } to { opacity: 1; transform: scale(1) translateY(0) } }
        @keyframes slideKanan { from { opacity: 0; transform: translateX(110%) } to { opacity: 1; transform: translateX(0) } }
        @keyframes scanline { 0% { top: 2% } 50% { top: 96% } 100% { top: 2% } }
        @keyframes melayang { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        @keyframes drawLine { to { stroke-dashoffset: 0 } }
        @keyframes kilau { 0% { background-position: -200% center } 100% { background-position: 200% center } }
        .animate-fadeIn { animation: fadeIn .35s ease-out both }
        .animate-scaleIn { animation: scaleIn .45s cubic-bezier(.22,1,.36,1) both }
        .animate-slideKanan { animation: slideKanan .5s cubic-bezier(.22,1,.36,1) both }
        .animate-scanline { animation: scanline 2.6s ease-in-out infinite }
        .animate-melayang { animation: melayang 3.5s ease-in-out infinite }
        .efek-kilau { background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,.35) 50%, transparent 60%); background-size: 200% 100%; animation: kilau 3s linear infinite }
        .scroll-tipis::-webkit-scrollbar { width: 6px; height: 6px }
        .scroll-tipis::-webkit-scrollbar-thumb { background: linear-gradient(#10b981,#14b8a6); border-radius: 8px }
        .scroll-tipis::-webkit-scrollbar-track { background: transparent }
        
        /* CSS OPISI 2: Native Print PDF */
        /* Letakkan DI LUAR @media print agar Safari menghormati orientasi lanskap */
          @page {
            size: A4 landscape;
            margin: 0;
          }

          @media print {
            html, body {
              width: 100% !important;
              height: auto !important;
              overflow: visible !important;
              background: #ffffff !important;
            }

            /* 1) Sembunyikan semua elemen SEKALIGUS lepaskan semua
              constraint layout (fixed/overflow/transform/max-height)
              agar sertifikat TIDAK ter-clip oleh modal.
              Kecuali sertifikat & isinya — mereka bebas. */
            body *:not(#area-sertifikat):not(#area-sertifikat *) {
              visibility: hidden;
              position: static !important;
              transform: none !important;
              overflow: visible !important;
              max-height: none !important;
              min-height: 0 !important;
              box-shadow: none !important;
              backdrop-filter: none !important;
            }

            /* 2) Munculkan sertifikat saja, tempel di pojok kiri-atas halaman */
            #area-sertifikat {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 128% !important;   /* dikompensasi zoom di bawah */
              height: auto !important;
              margin: 0 !important;
              padding: 0 !important;
              border: 0 !important;
              border-radius: 0 !important;
              zoom: 0.78;              /* skala agar muat 1 halaman A4 lanskap */
            }

            /* 3) Paksa Safari mencetak background gradient/warna
              walau checkbox "Cetak latar belakang" TIDAK dicentang */
            #area-sertifikat,
            #area-sertifikat * {
              visibility: visible !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
          }
      `}</style>
      {/* NOTIFIKASI */}
      <div className="fixed top-5 right-5 z-[120] space-y-3 w-[min(92vw,360px)] print:hidden">
        {notifikasi.map((n) => {
          const cfg = KONFIG_NOTIF[n.tipe];
          return (
            <div key={n.id} className={`animate-slideKanan bg-white dark:bg-slate-900/95 backdrop-blur-xl border ${cfg.border} rounded-2xl p-4 shadow-2xl flex gap-3`}>
              <div className={`p-2 h-fit rounded-xl bg-slate-100 dark:bg-slate-800 ${cfg.warna} shrink-0`}><cfg.Icon className="w-5 h-5" /></div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black text-slate-900 dark:text-white">{n.judul}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug mt-0.5">{n.pesan}</p>
              </div>
              <button onClick={() => setNotifikasi((prev) => prev.filter((x) => x.id !== n.id))} className="text-slate-400 hover:text-slate-900 dark:hover:text-white h-fit cursor-pointer"><X className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 print:hidden">
        {/* HEADER BANNER */}
        <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-6 sm:p-8 rounded-3xl shadow-xl shadow-emerald-500/20">
          <div className="absolute -top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-24 left-1/3 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.15) 0%, transparent 50%)' }} />
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white text-xs font-bold mb-3.5">
                <span className="relative flex w-2 h-2">
                  <span className="absolute inline-flex w-full h-full rounded-full bg-white animate-ping" />
                  <span className="relative inline-flex w-2 h-2 rounded-full bg-white" />
                </span>
                Verified Green Merchant • Grade {statistik.grade}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{namaResto}</h1>
              <p className="text-sm text-white/80 mt-1.5 max-w-xl leading-relaxed">
                Pantau siklus makanan surplus, konversi tiering otomatis, dan realisasi dampak ESG toko Anda secara realtime.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button onClick={() => setModalSertifikat(true)}
                className="flex items-center justify-center gap-2 bg-white/95 hover:bg-white text-slate-900 font-bold px-5 py-3.5 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer shadow-lg">
                <Award className="w-5 h-5 text-purple-600" />
                Sertifikat & Laporan ESG
              </button>
              <Link href="/tier"
                className="flex items-center justify-center gap-2 bg-white/15 backdrop-blur-sm hover:bg-white/25 border border-white/30 text-white font-extrabold px-6 py-3.5 rounded-2xl text-sm transition-all active:scale-95 cursor-pointer relative overflow-hidden group">
                <span className="absolute inset-0 efek-kilau" />
                <PlusCircle className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                Upload Produk Surplus
              </Link>
            </div>
          </div>
        </div>
        {/* ESG SUMMARY CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="relative p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-emerald-500/20 space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-emerald-100 dark:bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-200 dark:group-hover:bg-emerald-500/20 transition-all" />
            <div className="flex justify-between items-start relative">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Total Pcs Dicegah</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">{kgDicegah.toFixed(0)}<span className="text-base font-semibold text-slate-500 ml-1">Pcs</span></p>
              </div>
              <ProgressRing percent={Math.min(statistik.persenTarget, 100)} color="#10b981" size={62} stroke={6} trackColor="rgba(16,185,129,0.15)">
                <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </ProgressRing>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl px-3 py-2 w-fit">
              <Flame className="w-3.5 h-3.5" />
              Setara {(co2Dicegah / 1000).toFixed(2)} Ton emisi CO₂e dicegah
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full" style={{ width: `${Math.min(statistik.persenTarget, 100)}%`, transition: 'width 1.5s cubic-bezier(.22,1,.36,1)' }} />
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">{statistik.persenTarget.toFixed(0)}% dari target ESG bulanan ({statistik.targetKg} Kg)</p>
          </div>
          <div className="relative p-6 rounded-3xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-blue-500/20 space-y-4 hover:border-blue-300 dark:hover:border-blue-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300 group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-blue-100 dark:bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-200 dark:group-hover:bg-blue-500/20 transition-all" />
            <div className="flex justify-between items-start relative">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Pendapatan Tambahan</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5 tabular-nums">Rp {revenue.toLocaleString('id-ID')}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20"><TrendingUp className="w-6 h-6" /></div>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
              <ArrowUpRight className="w-4 h-4" /> {statistik.jumlahTier1} produk Tier 1 terjual
            </div>
            <div className="pt-1 -mx-1"><Sparkline data={[22, 31, 28, 42, 38, 55, 61, 58, Math.max(74, statistik.jumlahTier1 * 5)]} color="#3b82f6" width={280} height={40} /></div>
            <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-200 dark:border-slate-800 font-semibold">
              <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              {porsiTier1} porsi tersalurkan bulan ini
            </div>
          </div>
          <div className="relative p-6 rounded-3xl bg-gradient-to-br from-white via-purple-50/40 to-fuchsia-50/40 dark:from-slate-900/80 dark:to-purple-950/30 border border-slate-200 dark:border-purple-500/25 space-y-4 hover:border-purple-300 dark:hover:border-purple-500/50 hover:-translate-y-1 hover:shadow-xl hover:shadow-purple-500/10 transition-all duration-300 group overflow-hidden">
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-purple-100 dark:bg-purple-500/15 rounded-full blur-2xl group-hover:bg-purple-200 dark:group-hover:bg-purple-500/25 transition-all" />
            <div className="flex justify-between items-start relative">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">Sertifikat ESG</span>
                <p className="text-4xl font-black text-slate-900 dark:text-white mt-1.5">Grade {statistik.grade}</p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-purple-400/30 blur-xl rounded-full animate-pulse" />
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-fuchsia-600 text-white animate-melayang shadow-lg shadow-purple-500/30"><Award className="w-6 h-6" /></div>
              </div>
            </div>
            <p className="text-xs text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5">
              <BadgeCheck className="w-3.5 h-3.5" /> Sertifikat Resmi {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-500 leading-relaxed">Pajang di media sosial & toko fisik sebagai bukti Green Business Branding terverifikasi.</p>
            <button onClick={() => setModalSertifikat(true)}
              className="w-full py-3 bg-purple-100 dark:bg-purple-500/15 hover:bg-purple-200 dark:hover:bg-purple-500/30 text-purple-700 dark:text-purple-200 rounded-xl text-xs font-black border border-purple-300 dark:border-purple-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer relative overflow-hidden group/btn">
              <FileText className="w-4 h-4" /> Lihat & Unduh Laporan PDF
              <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
        {/* INVENTORY */}
        <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
                Manajemen Produk & Tiering Auto-Switch
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-widest">
                  <Zap className="w-2.5 h-2.5" /> Otomatis
                </span>
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Tier beralih otomatis saat mendekati kedaluwarsa • Countdown realtime aktif</p>
            </div>
            <div className="flex bg-slate-100 dark:bg-slate-950 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto w-full lg:w-auto">
              {([['all', 'Semua'], ['tier1', 'Tier 1'], ['tier2', 'Tier 2'], ['tier3', 'Tier 3']] as const).map(([key, label]) => (
                <button key={key} onClick={() => setActiveTab(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === key
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800/60'
                  }`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          {sedangMemuat ? (
            <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-12 text-center">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="font-black text-slate-900 dark:text-white text-base">Memuat data produk...</p>
            </div>
          ) : produkTampil.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 p-12 text-center">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-10 h-10 text-slate-400" />
              </div>
              <p className="font-black text-slate-900 dark:text-white text-base mb-2">Belum Ada Produk</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4 max-w-md mx-auto">
                Produk yang Anda input di halaman <span className="font-bold text-emerald-600 dark:text-emerald-400">Klasifikasi Sisa Pangan</span> akan muncul di sini secara otomatis.
              </p>
              <Link href="/tier" className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:from-emerald-400 hover:to-teal-400 transition-all">
                <PlusCircle className="w-5 h-5" />
                Input Produk Pertama
              </Link>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-500 text-[10px] uppercase tracking-[0.15em] font-black">
                    <tr>
                      <th className="p-4 rounded-l-2xl">Produk</th>
                      <th className="p-4">Status Tier</th>
                      <th className="p-4">Stok</th>
                      <th className="p-4">Waktu Input</th>
                      <th className="p-4">Sisa Waktu</th>
                      <th className="p-4 text-center rounded-r-2xl">Aksi Handover</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                    {produkTampil.map((item, i) => {
                      const cfg = TIER_CONFIG[item.tier];
                      const sisa = sisaProduk(item);
                      const total = item.sisaDetik || 1;
                      const persen = item.tier === 'tier3' ? 100 : (sisa / total) * 100;
                      const kritis = item.tier !== 'tier3' && sisa < 3600;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group" style={{ animation: `fadeIn .5s ease-out ${i * 0.08}s both` }}>
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.gradasi} flex items-center justify-center text-white shadow-lg shrink-0`}>
                                <cfg.Icon className="w-5 h-5" />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{item.nama}</p>
                                <p className="text-[10px] text-slate-500 font-semibold">{item.kategori} • {item.harga}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-black border ${cfg.bgLight} dark:${cfg.bg} ${cfg.warna} ${cfg.borderLight} dark:${cfg.border}`}>
                              <cfg.Icon className="w-3 h-3" /> {cfg.label} • {item.status}
                            </span>
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">{item.stok} Pcs</td>
                          <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{item.prep}</td>
                          <td className="p-4">
                            {item.tier === 'tier3' ? (
                              <span className="inline-flex items-center gap-1.5 text-[11px] text-cyan-700 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-500/10 px-2.5 py-1.5 rounded-lg border border-cyan-200 dark:border-cyan-500/20">
                                <Recycle className="w-3.5 h-3.5" /> Siap Pickup
                              </span>
                            ) : (
                              <div className="w-36">
                                <div className={`flex items-center gap-1.5 text-[11px] font-black tabular-nums mb-1.5 ${kritis ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                  {kritis ? <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> : <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                                  {formatSisa(sisa)}
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${kritis ? 'bg-gradient-to-r from-red-500 to-rose-500' : 'bg-gradient-to-r from-emerald-500 to-teal-400'}`} style={{ width: `${persen}%` }} />
                                </div>
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            <button onClick={() => setModalQR(item)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 ${cfg.bgLight} dark:${cfg.bg} hover:brightness-95 dark:hover:brightness-125 ${cfg.warna} text-xs rounded-xl font-black border ${cfg.borderLight} dark:${cfg.border} transition-all active:scale-95 cursor-pointer`}>
                              <QrCode className="w-4 h-4" /> QR Handover
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {produkTampil.map((item, i) => {
                  const cfg = TIER_CONFIG[item.tier];
                  const sisa = sisaProduk(item);
                  const kritis = item.tier !== 'tier3' && sisa < 3600;
                  return (
                    <div key={item.id} className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3" style={{ animation: `scaleIn .4s ease-out ${i * 0.08}s both` }}>
                      <div className="flex items-start gap-3">
                        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.gradasi} flex items-center justify-center text-white shrink-0 shadow-lg`}>
                          <cfg.Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-900 dark:text-white text-sm leading-tight">{item.nama}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">{item.kategori} • Stok: {item.stok} Pcs</p>
                        </div>
                        <span className={`shrink-0 px-2 py-1 rounded-lg text-[9px] font-black border ${cfg.bgLight} dark:${cfg.bg} ${cfg.warna} ${cfg.borderLight} dark:${cfg.border}`}>{cfg.label}</span>
                      </div>
                      {item.tier !== 'tier3' && (
                        <div className={`flex items-center gap-1.5 text-xs font-black tabular-nums ${kritis ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          {kritis ? <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> : <Timer className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                          {formatSisa(sisa)} tersisa
                        </div>
                      )}
                      <button onClick={() => setModalQR(item)}
                        className={`w-full py-2.5 ${cfg.bgLight} dark:${cfg.bg} ${cfg.warna} rounded-xl text-xs font-black border ${cfg.borderLight} dark:${cfg.border} flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] transition-all`}>
                        <QrCode className="w-4 h-4" /> Generate QR Handover
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {(Object.keys(TIER_CONFIG) as TierKey[]).map((k) => {
              const cfg = TIER_CONFIG[k];
              return (
                <div key={k} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${cfg.borderLight} dark:${cfg.border} ${cfg.bgLight} dark:${cfg.bg}`}>
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.gradasi} flex items-center justify-center text-white shadow-lg shrink-0`}>
                    <cfg.Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className={`text-xs font-black ${cfg.warna}`}>{cfg.label}</p>
                    <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight">{cfg.deskripsi}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {modalQR && <ModalQRHandover produk={modalQR} onClose={() => setModalQR(null)} onKirimNotifikasi={kirimNotifikasi} />}
      {modalSertifikat && <ModalSertifikatESG onClose={() => setModalSertifikat(false)} statistik={statistik} namaResto={namaResto} />}
    </>
  );
}