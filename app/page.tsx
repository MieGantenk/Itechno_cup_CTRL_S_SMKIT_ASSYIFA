'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import LogoPangan from '@/components/LogoPangan';
import { ChevronDown, Info, BookOpen, ExternalLink } from 'lucide-react';

// Ikon dibuat sebagai komponen kecil agar bisa dipakai ulang di beberapa bagian halaman.
// ==========================================
// KOMPONEN IKON SVG
// ==========================================
const IkonBelanja = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IkonSosial = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IkonListrik = () => (
  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IkonUang = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IkonPiring = () => (
  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IkonGembok = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const IkonPanah = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

// ==========================================
// HOOK CUSTOM
// ==========================================
function useCountUp(target: number, duration: number = 2000, shouldStart: boolean = true) {
  // Angka akan naik perlahan saat bagian yang memakainya mulai terlihat.
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!shouldStart) return;
    let startTime: number | null = null;
    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, shouldStart]);
  return count;
}

function useInView(ref: React.RefObject<HTMLElement | null>, threshold = 0.2) {
  // Hook ini memberi tahu apakah sebuah bagian sudah masuk ke layar pengguna.
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref, threshold]);
  return inView;
}

// ==========================================
// TIPE DATA
// ==========================================
interface FiturSistem {
  id: string;
  sdg: string;
  sdgNomor: string;
  judul: string;
  deskripsi: string;
  deskripsiSingkat: string;
  lencanaWarna: string;
  gradienTema: string;
  gradienBorder: string;
  ikon: React.ReactNode;
  poinUtama: string[];
  highlight: string;
  contohNyata: string;
}

// ==========================================
// KOMPONEN: PANEL PENJELASAN RUMUS
// ==========================================
interface RumusItem {
  label: string;
  rumus: string;
  nilai: string;
  sumber: string;
  link: string;
  keterangan: string;
}

function PanelRumus({ data, isOpen, onToggle }: { data: RumusItem; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden transition-all duration-300">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-white">{data.label}</p>
            <p className="text-[10px] text-slate-400">Klik untuk lihat rumus & sumber</p>
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="px-4 pb-4 space-y-3 animate-fadeIn">
          {/* Rumus yang digunakan untuk menghitung dampak. */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">📐 Rumus</p>
            <p className="font-mono text-sm text-emerald-300 leading-relaxed">{data.rumus}</p>
          </div>

          {/* Nilai konversi yang menjadi dasar perhitungan. */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">🔢 Nilai Konversi</p>
            <p className="text-sm text-amber-300 font-mono">{data.nilai}</p>
          </div>

          {/* Contoh sederhana agar hasilnya mudah diperiksa. */}
          <div className="bg-slate-900/80 rounded-lg p-3 border border-slate-700">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">📝 Contoh Perhitungan</p>
            <p className="text-xs text-slate-200 leading-relaxed">{data.keterangan}</p>
          </div>

          {/* Tautan sumber data perhitungan. */}
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 rounded-lg transition-colors group"
          >
            <ExternalLink className="w-4 h-4 text-blue-400 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-blue-300">📚 Sumber Resmi</p>
              <p className="text-xs text-blue-200 group-hover:text-white transition-colors truncate">{data.sumber}</p>
            </div>
          </a>
        </div>
      )}
    </div>
  );
}

// ==========================================
// DATA KONSTANTA KONVERSI (DAPAT DIPERTANGGUNGJAWABKAN)
// ==========================================
const KONSTANTA_KONVERSI = {
  // 1 kg sisa makanan ≈ 2 porsi (rata-rata 1 porsi = 400-500 gram)
  porsiPerKg: 2,
  porsiPerKgSumber: "Rata-rata porsi makan Indonesia: 400-500 gram (Kemenkes RI, Pedoman Gizi Seimbang)",
  porsiPerKgLink: "https://kemkes.go.id",

  // 1 kg sampah organik → 0.15 m³ biogas (anaerobic digestion)
  biogasPerKg: 0.15,
  biogasPerKgSumber: "FAO (2013) - Energy from Food Waste: Anaerobic Digestion Technical Report",
  biogasPerKgLink: "https://www.fao.org/energy",

  // 1 kg sampah makanan → 2.5 kg CO₂e yang dihindari
  co2PerKg: 2.5,
  co2PerKgSumber: "FAO (2013) - Food Wastage Footprint: Impacts on Natural Resources",
  co2PerKgLink: "https://www.fao.org/3/i3347e/i3347e.pdf",

  // 1 m³ biogas = 6 kWh listrik
  listrikPerM3: 6,
  listrikPerM3Sumber: "IPCC Guidelines for National Greenhouse Gas Inventories",
  listrikPerM3Link: "https://www.ipcc-nggip.iges.or.jp",

  // Rata-rata nilai ekonomi per kg makanan sisa (diskon 50% dari HPP)
  nilaiEkonomiPerKg: 15000,
  nilaiEkonomiPerKgSumber: "Survei Harga Pangan BPS & Rata-rata HPP Kuliner Indonesia (2024)",
  nilaiEkonomiPerKgLink: "https://bps.go.id",
};

// ==========================================
// KOMPONEN UTAMA
// ==========================================
export default function HalamanUtama() {
  // State halaman beranda mengatur menu, tab fitur, kalkulator, dan animasi scroll.
  const [menuMobileTerbuka, setMenuMobileTerbuka] = useState<boolean>(false);
  const [tabFiturAktif, setTabFiturAktif] = useState<string>('tier1');
  const [inputBeratSampah, setInputBeratSampah] = useState<number>(25);
  const [scrollY, setScrollY] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [navSolid, setNavSolid] = useState(false);
  
  // Hanya satu panel rumus yang dibuka pada satu waktu.
  const [rumusTerbuka, setRumusTerbuka] = useState<string | null>(null);

  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const calculatorRef = useRef<HTMLDivElement>(null);

  const statsInView = useInView(statsRef);
  const calcInView = useInView(calculatorRef);

  useEffect(() => {
    // Header berubah warna setelah halaman digulir melewati 50 piksel.
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setNavSolid(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Hiasan latar bergerak sedikit mengikuti posisi mouse.
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 30,
        y: (e.clientY / window.innerHeight - 0.5) * 30,
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // ==========================================
  // DATA FITUR 3-TIER
  // ==========================================
  const daftarFiturSaaS: FiturSistem[] = [
    {
      id: 'tier1',
      sdg: 'SDG 8: Ekonomi Berkelanjutan',
      sdgNomor: '08',
      judul: 'Tier 1: Marketplace Makanan Diskon',
      deskripsiSingkat: 'Makanan berlebih yang masih enak dijual murah di akhir hari.',
      deskripsi:
        'Setiap hari, banyak restoran, cafe, dan toko roti memiliki makanan lebih yang tidak terjual tapi masih sangat layak dimakan. Daripada dibuang, pemilik usaha bisa menjualnya dengan harga diskon 50-70% di aplikasi kami. Pembeli dapat makanan murah, pedagang tetap dapat untung, dan makanan tidak jadi sampah.',
      lencanaWarna: 'bg-amber-100/80 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300/60 dark:border-amber-700/40 backdrop-blur-sm',
      gradienTema: 'from-amber-500/20 via-orange-500/10 to-transparent',
      gradienBorder: 'from-amber-500 to-orange-600',
      ikon: <IkonBelanja />,
      highlight: 'Diskon 50-70%',
      contohNyata: '📌 Contoh: Roti sisa di bakery dijual Rp 10.000 (dari harga normal Rp 25.000) pukul 8 malam.',
      poinUtama: [
        'Pemilik usaha tetap dapat untung dari makanan yang biasanya dibuang',
        'Konsumen dapat makanan berkualitas dengan harga miring',
        'Kurir lokal dapat pekerjaan tambahan untuk mengantar pesanan',
      ],
    },
    {
      id: 'tier2',
      sdg: 'SDG 11: Kota & Komunitas',
      sdgNomor: '11',
      judul: 'Tier 2: Donasi ke Panti & Warga',
      deskripsiSingkat: 'Makanan layak makan disalurkan gratis ke yang membutuhkan.',
      deskripsi:
        'Untuk makanan dalam jumlah besar yang masih sangat segar (misalnya dari hotel atau katering acara), kami langsung salurkan ke panti asuhan, komunitas yatim, atau warga yang membutuhkan. Semua terdata di peta, jadi bisa dilihat siapa yang menerima bantuan.',
      lencanaWarna: 'bg-emerald-100/80 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300/60 dark:border-emerald-700/40 backdrop-blur-sm',
      gradienTema: 'from-emerald-500/20 via-teal-500/10 to-transparent',
      gradienBorder: 'from-emerald-500 to-teal-600',
      ikon: <IkonSosial />,
      highlight: 'Gratis & Transparan',
      contohNyata: '📌 Contoh: Katering acara pernikahan (50 porsi) langsung diantar ke panti asuhan terdekat malam itu juga.',
      poinUtama: [
        'Peta lokasi panti asuhan terdekat yang sudah terverifikasi',
        'Kurir relawan menjemput dan mengantar langsung ke penerima',
        'Laporan dampak sosial transparan untuk setiap donasi',
      ],
    },
    {
      id: 'tier3',
      sdg: 'SDG 7: Energi Bersih',
      sdgNomor: '07',
      judul: 'Tier 3: Konversi jadi Biogas',
      deskripsiSingkat: 'Sisa makanan basi diolah jadi gas untuk memasak.',
      deskripsi:
        'Makanan yang sudah tidak layak dimakan (basi, kulit buah, sisa olahan dapur) kami kirim ke pabrik biogas. Di sana, sampah organik difermentasi dan menghasilkan gas metana yang bisa dipakai untuk memasak atau listrik. Sisanya jadi pupuk organik.',
      lencanaWarna: 'bg-cyan-100/80 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border-cyan-300/60 dark:border-cyan-700/40 backdrop-blur-sm',
      gradienTema: 'from-cyan-500/20 via-blue-500/10 to-transparent',
      gradienBorder: 'from-cyan-500 to-blue-600',
      ikon: <IkonListrik />,
      highlight: '0% ke TPA',
      contohNyata: '📌 Contoh: Kulit bawang & sisa dapur dari restoran diolah jadi biogas untuk masak di warung sebelah.',
      poinUtama: [
        'Penjemputan rutin oleh mitra pengolah energi (biogas & maggot)',
        'Konversi 1 kg sampah → 0.15 m³ biogas (cukup untuk masak 30 menit)',
        'Tidak ada lagi sampah makanan yang berakhir di TPA Bantar Gebang',
      ],
    },
  ];

  const fiturAktif = daftarFiturSaaS.find((f) => f.id === tabFiturAktif)!;

  // Nilai di kalkulator dihitung dari berat sisa makanan yang dipilih.
  // ==========================================
  // KALKULASI DAMPAK
  // ==========================================
  const targetPorsi = inputBeratSampah * KONSTANTA_KONVERSI.porsiPerKg;
  const targetBiogas = inputBeratSampah * KONSTANTA_KONVERSI.biogasPerKg;
  const targetCo2 = inputBeratSampah * KONSTANTA_KONVERSI.co2PerKg;
  const targetListrik = targetBiogas * KONSTANTA_KONVERSI.listrikPerM3;
  const targetUang = inputBeratSampah * KONSTANTA_KONVERSI.nilaiEkonomiPerKg;

  const porsiAnim = useCountUp(calcInView ? targetPorsi : 0, 1500, calcInView);
  const biogasAnim = useCountUp(calcInView ? targetBiogas * 100 : 0, 1500, calcInView);
  const uangAnim = useCountUp(calcInView ? targetUang : 0, 2000, calcInView);
  const co2Anim = useCountUp(calcInView ? targetCo2 * 10 : 0, 1800, calcInView);

  const stat1 = useCountUp(statsInView ? 48 : 0, 1800, statsInView);
  const stat2 = useCountUp(statsInView ? 125 : 0, 1800, statsInView);

  // Data ini ditampilkan saat pengguna membuka panel rumus.
  const daftarRumus: RumusItem[] = [
    {
      label: 'Konversi Porsi Pangan',
      rumus: 'Jumlah Porsi = Berat (kg) × 2',
      nilai: '1 kg makanan = 2 porsi (asumsi 500g/porsi)',
      sumber: KONSTANTA_KONVERSI.porsiPerKgSumber,
      link: KONSTANTA_KONVERSI.porsiPerKgLink,
      keterangan: `Dengan ${inputBeratSampah} kg/hari × 2 porsi/kg = ${targetPorsi} porsi/hari. Dalam sebulan (30 hari) = ${(targetPorsi * 30).toLocaleString('id-ID')} porsi.`,
    },
    {
      label: 'Produksi Biogas',
      rumus: 'Volume Biogas (m³) = Berat (kg) × 0.15',
      nilai: '1 kg sampah organik = 0.15 m³ biogas',
      sumber: KONSTANTA_KONVERSI.biogasPerKgSumber,
      link: KONSTANTA_KONVERSI.biogasPerKgLink,
      keterangan: `Dengan ${inputBeratSampah} kg/hari × 0.15 m³/kg = ${targetBiogas.toFixed(2)} m³ biogas/hari. Ini setara dengan ${targetListrik.toFixed(1)} kWh listrik.`,
    },
    {
      label: 'Emisi CO₂ yang Dihindari',
      rumus: 'CO₂ Dihindari (kg) = Berat (kg) × 2.5',
      nilai: '1 kg sampah makanan = 2.5 kg CO₂e',
      sumber: KONSTANTA_KONVERSI.co2PerKgSumber,
      link: KONSTANTA_KONVERSI.co2PerKgLink,
      keterangan: `Sampah makanan yang membusuk di TPA menghasilkan gas metana (CH₄) yang 28x lebih berbahaya dari CO₂. Dengan ${inputBeratSampah} kg/hari, Anda mencegah ${targetCo2.toFixed(1)} kg CO₂e masuk ke atmosfer.`,
    },
    {
      label: 'Nilai Ekonomi',
      rumus: 'Nilai (Rp) = Berat (kg) × 15.000',
      nilai: 'Rata-rata Rp 15.000 per kg (50% dari HPP)',
      sumber: KONSTANTA_KONVERSI.nilaiEkonomiPerKgSumber,
      link: KONSTANTA_KONVERSI.nilaiEkonomiPerKgLink,
      keterangan: `Dengan ${inputBeratSampah} kg/hari × Rp 15.000 = Rp ${targetUang.toLocaleString('id-ID')}/hari. Dalam sebulan = Rp ${(targetUang * 30).toLocaleString('id-ID')} yang bisa didapat kembali.`,
    },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAF7] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-white overflow-x-hidden transition-colors duration-500">
      
      {/* Gaya global untuk animasi dan elemen dekorasi halaman. */}
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
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes grid-move {
          0% { background-position: 0 0; }
          100% { background-position: 50px 50px; }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-blob { animation: blob 8s ease-in-out infinite; }
        .animate-fadeIn { animation: fadeIn 0.4s ease-out; }
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
        .grid-bg {
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.07) 1px, transparent 1px);
          background-size: 50px 50px;
          animation: grid-move 20s linear infinite;
        }
        .dark .grid-bg {
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
        }
        .card-tilt {
          transition: transform 0.3s cubic-bezier(0.23, 1, 0.320, 1);
          transform-style: preserve-3d;
        }
        .card-tilt:hover {
          transform: perspective(1000px) rotateX(4deg) rotateY(-4deg) translateY(-8px);
        }
        .custom-slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.4);
          transition: all 0.2s;
        }
        .custom-slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 10px rgba(16, 185, 129, 0.25), 0 6px 20px rgba(16, 185, 129, 0.5);
        }
        .custom-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          background: linear-gradient(135deg, #10b981, #14b8a6);
          border-radius: 50%;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.4);
        }
        .glass {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
          opacity: 0.04;
          mix-blend-mode: overlay;
          pointer-events: none;
        }
      `}</style>

      {/* ==========================================
          1. NAVIGASI
         ========================================== */}
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          navSolid 
            ? 'glass bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800 shadow-sm' 
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <LogoPangan className="h-11 w-11 drop-shadow-[0_4px_10px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-110" />
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Pangan<span className="text-emerald-600 dark:text-emerald-400">Cerdas</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-full border border-emerald-300 dark:border-emerald-700">
                SaaS SDG 11
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1 font-medium text-sm text-slate-600 dark:text-slate-300 bg-white/40 dark:bg-slate-800/40 rounded-full px-2 py-1.5 border border-slate-200/60 dark:border-slate-700/60">
            {[
              { href: '#fitur', label: 'Fitur 3-Tier' },
              { href: '#dampak', label: 'Kalkulator' },
              { href: '#bergabung', label: 'Bergabung' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="relative px-4 py-2 rounded-full hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors group"
              >
                {item.label}
                <span className="absolute inset-x-4 -bottom-0 h-[2px] bg-emerald-600 dark:bg-emerald-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
              </a>
            ))}
          </nav>

          {/* Tombol login, daftar, dan pengubah tema. */}
          <div className="hidden md:flex items-center gap-2">
            <ThemeToggle ringkas={true} />
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Masuk
            </Link>
            <Link 
              href="/register" 
              className="relative px-5 py-2.5 text-sm font-semibold text-white rounded-xl overflow-hidden group"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 transition-transform group-hover:scale-105" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shine-effect" />
              <span className="relative">Daftar Gratis</span>
            </Link>
          </div>

          {/* Navigasi versi mobile. */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle ringkas={true} />
            <button
              onClick={() => setMenuMobileTerbuka(!menuMobileTerbuka)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Buka Menu Navigasi"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={menuMobileTerbuka ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} 
                  className="transition-all duration-300"
                />
              </svg>
            </button>
          </div>
        </div>

        <div 
          className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
            menuMobileTerbuka ? 'max-h-[400px] opacity-100 border-b border-slate-200 dark:border-slate-800' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="glass bg-white/90 dark:bg-slate-900/90 px-4 pt-2 pb-6 space-y-2">
            {['#fitur', '#dampak', '#bergabung'].map((href, i) => (
              <a 
                key={href}
                href={href} 
                className="block py-2 px-4 text-slate-700 dark:text-slate-300 font-medium rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                style={{ animation: menuMobileTerbuka ? `slide-up 0.3s ease-out ${i * 0.05}s both` : 'none' }}
              >
                {['Fitur 3-Tier', 'Kalkulator Dampak', 'Bergabung'][i]}
              </a>
            ))}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
              <Link href="/login" className="w-full block py-2.5 text-center font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Masuk</Link>
              <Link href="/register" className="w-full block py-2.5 text-center font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors">Daftar Gratis</Link>
            </div>
          </div>
        </div>
      </header>

      {/* ==========================================
          2. SEKSI HERO
         ========================================== */}
      <section ref={heroRef} className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-60 dark:opacity-30 pointer-events-none" />
        <div className="absolute inset-0 noise-overlay" />

        <div 
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] pointer-events-none"
          style={{ transform: `translate(calc(-50% + ${mousePos.x}px), calc(-50% + ${mousePos.y}px))` }}
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-300/40 dark:from-emerald-900/30 via-teal-200/30 dark:via-teal-900/20 to-amber-200/40 dark:to-amber-900/30 animate-blob blur-3xl" />
          <div className="absolute inset-10 bg-gradient-to-bl from-amber-300/30 dark:from-amber-900/20 via-teal-200/20 dark:via-teal-900/10 to-emerald-200/30 dark:to-emerald-900/20 animate-blob blur-3xl" style={{ animationDelay: '-2s' }} />
        </div>

        <div className="absolute top-20 right-10 w-20 h-20 bg-emerald-400/20 dark:bg-emerald-600/10 rounded-full blur-2xl animate-float" />
        <div className="absolute bottom-20 left-10 w-32 h-32 bg-amber-400/20 dark:bg-amber-600/10 rounded-full blur-2xl animate-float-slow" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-full bg-white/60 dark:bg-slate-800/60 glass border border-slate-200/80 dark:border-slate-700 shadow-sm"
            style={{ animation: 'slide-up 0.8s ease-out' }}
          >
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide">
              🌱 Didukung 3 SDG Goals · 100% Open API
            </span>
          </div>

          <h1 
            className="text-4xl sm:text-6xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tight max-w-6xl mx-auto leading-[1.05]"
            style={{ animation: 'slide-up 0.8s ease-out 0.1s both' }}
          >
            Ubah Sisa Makanan Kota Menjadi{' '}
            <span className="gradient-text whitespace-nowrap">
              Nilai Ekonomi
            </span>
            {' '}&{' '}
            <span className="gradient-text whitespace-nowrap" style={{ animationDelay: '1s' }}>
              Energi Bersih
            </span>
          </h1>

          <p 
            className="mt-8 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed"
            style={{ animation: 'slide-up 0.8s ease-out 0.2s both' }}
          >
            Ekosistem SaaS terintegrasi yang menghubungkan <span className="font-semibold text-emerald-600 dark:text-emerald-400">bisnis kuliner</span>, <span className="font-semibold text-teal-600 dark:text-teal-400">panti asuhan</span>, dan <span className="font-semibold text-amber-600 dark:text-amber-400">pengolah biogas</span> — mendukung SDG 11, 8, dan 7.
          </p>

          {/* Tombol utama untuk melihat alur dan mulai bergabung. */}
          <div 
            className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto"
            style={{ animation: 'slide-up 0.8s ease-out 0.3s both' }}
          >
            <button className="group relative w-full sm:w-auto px-8 py-4 text-base font-bold text-white rounded-2xl overflow-hidden shadow-xl shadow-emerald-600/25 transition-all hover:-translate-y-1">
              <span className="absolute inset-0 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700" />
              <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shine-effect" />
              <span className="relative flex items-center justify-center gap-2">
                Lihat Cara Kerja
                <IkonPanah />
              </span>
            </button>
            <Link 
              href="/register" 
              className="group w-full sm:w-auto px-8 py-4 text-base font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 rounded-2xl shadow-sm transition-all text-center"
            >
              Mulai Bergabung — Gratis
            </Link>
          </div>

          {/* Ringkasan angka dampak aplikasi. */}
          <div 
            ref={statsRef}
            className="mt-20 pt-10 border-t border-slate-200/80 dark:border-slate-800 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
            style={{ animation: 'slide-up 0.8s ease-out 0.4s both' }}
          >
            {[
              { value: stat1, suffix: 'M Ton', color: 'emerald', label: 'Sampah Makanan/Tahun' },
              { value: stat2, suffix: 'M Orang', color: 'amber', label: 'Bisa Diberi Makan' },
              { value: '0.15', suffix: ' m³', color: 'teal', label: 'Biogas per Kg', static: true },
              { value: '100', suffix: '%', color: 'slate', label: 'Siklus Zero Waste', static: true },
            ].map((stat, i) => (
              <div 
                key={i}
                className="group relative p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 glass border border-slate-200/60 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 hover:shadow-lg hover:shadow-emerald-500/10 transition-all duration-300"
              >
                <p className={`relative text-3xl sm:text-5xl font-black tabular-nums ${
                  stat.color === 'emerald' ? 'text-emerald-600 dark:text-emerald-400' :
                  stat.color === 'amber' ? 'text-amber-600 dark:text-amber-400' :
                  stat.color === 'teal' ? 'text-teal-600 dark:text-teal-400' :
                  'text-slate-600 dark:text-slate-400'
                }`}>
                  {stat.static ? stat.value : stat.value}{stat.suffix}
                </p>
                <p className="relative text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div 
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500"
          style={{ animation: 'slide-up 1s ease-out 0.8s both' }}
        >
          <span className="text-xs font-medium">Scroll untuk eksplor</span>
          <div className="w-6 h-10 rounded-full border-2 border-slate-300 dark:border-slate-600 flex justify-center p-1">
            <div className="w-1 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ==========================================
          3. SEKSI FITUR TIER
         ========================================== */}
      <section id="fitur" className="relative py-24 bg-white dark:bg-slate-900 border-y border-slate-200/60 dark:border-slate-800 overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-6xl">
          <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100/40 dark:bg-emerald-950/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-100/40 dark:bg-amber-950/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-4 rounded-full bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
                Arsitektur Sistem SaaS
              </span>
            </div>
            <p className="mt-4 text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
              3 Jalur Penanganan <span className="gradient-text">Sisa Makanan</span>
            </p>
            <p className="mt-6 text-slate-600 dark:text-slate-400 text-lg">
              Setiap jenis sisa makanan punya jalan terbaiknya. Kami pastikan tidak ada yang terbuang sia-sia.
            </p>
          </div>

          <div className="flex justify-center mb-12">
            <div className="relative inline-flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-2 gap-1 border border-slate-200 dark:border-slate-700">
              <div 
                className="absolute top-2 bottom-2 bg-slate-900 dark:bg-emerald-600 rounded-xl shadow-lg transition-all duration-500 ease-out"
                style={{
                  width: `calc((100% - 16px) / 3)`,
                  left: `calc(8px + ${daftarFiturSaaS.findIndex(f => f.id === tabFiturAktif) * ((100 - 4) / 3)}%)`,
                }}
              />
              {daftarFiturSaaS.map((item, i) => (
                <button
                  key={item.id}
                  onClick={() => setTabFiturAktif(item.id)}
                  className={`relative z-10 px-4 sm:px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap flex items-center gap-2 ${
                    tabFiturAktif === item.id
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${tabFiturAktif === item.id ? 'scale-110' : ''}`}>
                    {item.ikon}
                  </span>
                  <span className="hidden sm:inline">Tier {i + 1}</span>
                  <span className="sm:hidden">T{i + 1}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tier Cards */}
          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {daftarFiturSaaS.map((item, i) => (
              <div
                key={item.id}
                onClick={() => setTabFiturAktif(item.id)}
                className={`card-tilt relative p-8 rounded-3xl border-2 cursor-pointer transition-all duration-500 group ${
                  tabFiturAktif === item.id
                    ? 'bg-white dark:bg-slate-800 border-slate-900 dark:border-emerald-500 shadow-2xl shadow-slate-900/10 dark:shadow-emerald-500/10 scale-[1.02]'
                    : 'bg-white/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl'
                }`}
              >
                {tabFiturAktif === item.id && (
                  <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${item.gradienBorder} opacity-10 pointer-events-none`} />
                )}

                <div className="relative">
                  <div className={`absolute -top-2 -right-2 text-7xl font-black opacity-[0.04] dark:opacity-[0.08] leading-none select-none`}>
                    {item.sdgNomor}
                  </div>

                  <div className={`relative mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradienBorder} flex items-center justify-center text-white shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-transform duration-500`}>
                    <div className="scale-150">{item.ikon}</div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border mb-3 ${item.lencanaWarna}`}>
                    {item.sdg}
                  </span>

                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
                    {item.judul}
                  </h3>

                  {/* ✅ DESKRIPSI SINGKAT YANG LEBIH JELAS */}
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                    {item.deskripsiSingkat}
                  </p>

                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-4 line-clamp-4">
                    {item.deskripsi}
                  </p>

                  {/* ✅ CONTOH NYATA */}
                  <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-3 border border-slate-200 dark:border-slate-700 mb-4">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">{item.contohNyata}</p>
                  </div>

                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r ${item.gradienBorder}`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <span className="text-xs font-bold text-white">{item.highlight}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Detail Panel */}
          <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl p-8 sm:p-12 text-white overflow-hidden shadow-2xl">
            <div className="absolute inset-0 grid-bg opacity-10 pointer-events-none" />
            <div className={`absolute inset-0 bg-gradient-to-br ${fiturAktif.gradienTema} transition-all duration-500`} />
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" />

            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-[10px] font-bold border ${fiturAktif.lencanaWarna}`}>
                    {fiturAktif.sdg}
                  </span>
                  <span className="text-slate-400 text-xs">·</span>
                  <span className="text-slate-400 text-xs font-mono">TIER {daftarFiturSaaS.findIndex(f => f.id === fiturAktif.id) + 1}</span>
                </div>
                <h3 className="text-3xl sm:text-4xl font-black mb-4 leading-tight">
                  {fiturAktif.judul}
                </h3>
                <p className="text-lg text-emerald-300 font-bold mb-4">
                  {fiturAktif.deskripsiSingkat}
                </p>
                <p className="text-slate-300 leading-relaxed mb-6">
                  {fiturAktif.deskripsi}
                </p>
                <ul className="space-y-3">
                  {fiturAktif.poinUtama.map((poin, index) => (
                    <li 
                      key={index} 
                      className="flex items-start gap-3 text-slate-200 font-medium text-sm"
                      style={{ animation: `slide-up 0.5s ease-out ${index * 0.1}s both` }}
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                        ✓
                      </span>
                      <span>{poin}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulasi Web</span>
                </div>
                
                <div className="p-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${fiturAktif.gradienBorder} flex items-center justify-center text-white shadow-lg`}>
                    {fiturAktif.ikon}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">Sistem Siap Diproses</p>
                    <p className="text-xs text-slate-400">Next.js Server Action</p>
                  </div>
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.2s' }} />
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: '0.4s' }} />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 mb-1">
                    <span>Proses Real-time</span>
                    <span className="font-mono">75%</span>
                  </div>
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full bg-gradient-to-r ${fiturAktif.gradienBorder} rounded-full relative transition-all duration-1000`}
                      style={{ width: '75%' }}
                    >
                      <div className="absolute inset-0 shine-effect" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          4. ✅ SEKSI KALKULATOR - DENGAN PENJELASAN RUMUS TRANSPARAN
         ========================================== */}
      <section ref={calculatorRef} id="dampak" className="relative py-24 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-600/20 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-600/20 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-teal-600/10 rounded-full blur-3xl animate-blob" />
        </div>

        <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            
            {/* KOLOM KIRI: INPUT + INFO */}
            <div className="lg:col-span-5 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                  Kalkulator Transparan
                </span>
              </div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
                Hitung Dampak <span className="gradient-text">Nyata</span> Usaha Anda
              </h2>
              <p className="text-slate-400 text-lg leading-relaxed">
                Masukkan perkiraan berat sisa makanan harian usaha Anda. Kami akan tunjukkan dampaknya dengan <span className="text-emerald-400 font-bold">rumus & sumber resmi</span> yang dapat dipertanggungjawabkan.
              </p>

              {/* SLIDER INPUT */}
              <div className="space-y-4 pt-6 bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
                <div className="flex justify-between items-center">
                  <label htmlFor="rangeSampah" className="font-semibold text-slate-200">
                    Berat Sisa Makanan / Hari
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent tabular-nums">
                      {inputBeratSampah}
                    </span>
                    <span className="text-sm font-bold text-slate-400">Kg</span>
                  </div>
                </div>
                
                <div className="relative pt-4">
                  <input
                    id="rangeSampah"
                    type="range"
                    min="5"
                    max="200"
                    step="5"
                    value={inputBeratSampah}
                    onChange={(e) => setInputBeratSampah(Number(e.target.value))}
                    className="custom-slider w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer outline-none"
                  />
                  <div 
                    className="absolute top-6 left-0 h-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 pointer-events-none"
                    style={{ width: `${((inputBeratSampah - 5) / (200 - 5)) * 100}%` }}
                  />
                </div>

                <div className="flex justify-between text-[11px] text-slate-500 font-mono pt-2">
                  <span>5 Kg (Warung)</span>
                  <span>200 Kg (Hotel)</span>
                </div>

                {/* ✅ REFERENSI CEPAT */}
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mt-4">
                  <p className="text-[11px] text-amber-200 leading-relaxed">
                    💡 <strong className="text-amber-300">Bingung angkanya?</strong> Rata-rata restoran kecil menghasilkan 10-30 kg/hari, cafe sedang 30-80 kg/hari, dan hotel besar 100-200 kg/hari.
                  </p>
                </div>
              </div>

              {/* ✅ TOMBOL PANDUAN PRESENTASI */}
              <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-2xl p-5">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white mb-1">Semua Angka Bisa Dijelaskan</p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Setiap hasil kalkulasi dilengkapi rumus, sumber resmi (FAO, Bappenas, IPCC), dan contoh perhitungan. Tim Anda bisa mempresentasikannya dengan percaya diri.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* KOLOM KANAN: HASIL + RUMUS */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* KARTU HASIL KALKULASI */}
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl group-hover:bg-emerald-500/30 transition-all" />
                  <div className="relative">
                    <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 border border-emerald-400/30 text-emerald-400 mb-3">
                      <IkonPiring />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                      Porsi Diselamatkan
                    </p>
                    <p className="text-3xl font-black text-white tabular-nums leading-tight">
                      {porsiAnim}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">porsi/hari</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl group-hover:bg-cyan-500/30 transition-all" />
                  <div className="relative">
                    <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 border border-cyan-400/30 text-cyan-400 mb-3">
                      <IkonListrik />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400 mb-1">
                      Biogas Dihasilkan
                    </p>
                    <p className="text-3xl font-black text-white tabular-nums leading-tight">
                      {(biogasAnim / 100).toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">m³/hari</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all" />
                  <div className="relative">
                    <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 border border-amber-400/30 text-amber-400 mb-3">
                      <IkonUang />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">
                      Nilai Ekonomi
                    </p>
                    <p className="text-2xl font-black text-white tabular-nums leading-tight">
                      Rp {uangAnim.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">per hari</p>
                  </div>
                </div>

                <div className="group relative overflow-hidden bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl hover:bg-white/10 transition-all duration-500">
                  <div className="absolute -top-20 -right-20 w-40 h-40 bg-teal-500/20 rounded-full blur-3xl group-hover:bg-teal-500/30 transition-all" />
                  <div className="relative">
                    <div className="inline-flex w-12 h-12 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/20 to-teal-600/20 border border-teal-400/30 text-teal-400 mb-3">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                      </svg>
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-teal-400 mb-1">
                      CO₂ Dihindari
                    </p>
                    <p className="text-3xl font-black text-white tabular-nums leading-tight">
                      {(co2Anim / 10).toFixed(1)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">kg/hari</p>
                  </div>
                </div>
              </div>

              {/* ✅ AKORDION RUMUS TRANSPARAN */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Dari Mana Angka Ini? (Klik untuk Lihat)</h3>
                </div>
                
                {daftarRumus.map((rumus) => (
                  <PanelRumus 
                    key={rumus.label}
                    data={rumus}
                    isOpen={rumusTerbuka === rumus.label}
                    onToggle={() => setRumusTerbuka(rumusTerbuka === rumus.label ? null : rumus.label)}
                  />
                ))}
              </div>

              {/* KARTU DAMPAK BULANAN */}
              <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300 mb-2">📅 Proyeksi Dampak Bulanan (30 hari)</p>
                <div className="grid grid-cols-4 gap-3 text-center">
                  <div>
                    <p className="text-lg font-black text-white">{(targetPorsi * 30).toLocaleString('id-ID')}</p>
                    <p className="text-[10px] text-slate-400">porsi</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{(targetBiogas * 30).toFixed(1)}</p>
                    <p className="text-[10px] text-slate-400">m³ biogas</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{(targetCo2 * 30).toFixed(0)}</p>
                    <p className="text-[10px] text-slate-400">kg CO₂</p>
                  </div>
                  <div>
                    <p className="text-lg font-black text-white">{(targetUang * 30 / 1000000).toFixed(1)}jt</p>
                    <p className="text-[10px] text-slate-400">Rp</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          5. ✅ SEKSI CTA (NAMA DIUBAH)
         ========================================== */}
      <section id="bergabung" className="py-24 bg-[#FAFAF7] dark:bg-slate-950 relative overflow-hidden transition-colors duration-500">
        <div className="absolute inset-0 grid-bg opacity-40 dark:opacity-20 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="relative bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 rounded-[2.5rem] p-10 sm:p-16 text-white shadow-2xl overflow-hidden">
            <div className="absolute top-10 left-10 w-64 h-64 bg-emerald-500/30 rounded-full blur-3xl animate-float" />
            <div className="absolute bottom-10 right-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl animate-float-slow" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl animate-blob" />
            <div className="absolute inset-0 grid-bg opacity-20 pointer-events-none" />

            <div className="relative max-w-3xl mx-auto space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm">
                <span className="text-xs font-bold text-emerald-300">
                  🌍 Bergabunglah dengan Perubahan
                </span>
              </div>

              <h2 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.1]">
                Bangun Kota <br className="sm:hidden" />
                <span className="gradient-text">Bebas Sampah</span> Makanan
              </h2>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto">
                Apapun peran Anda — <span className="font-bold text-white">pemilik usaha, relawan, konsumen, atau pengolah limbah</span> — ada tempat untuk Anda berkontribusi.
              </p>

              {/* ✅ PERAN-PERAN YANG TERSEDIA */}
              <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
                {[
                  { label: 'Merchant Kuliner', color: 'amber' },
                  { label: 'Konsumen Umum', color: 'blue' },
                  { label: 'Panti & Komunitas', color: 'emerald' },
                  { label: 'Pengolah Energi', color: 'cyan' },
                  { label: 'Kurir Relawan', color: 'purple' },
                ].map((role) => (
                  <span 
                    key={role.label}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                      role.color === 'amber' ? 'bg-amber-500/10 text-amber-300 border-amber-500/30' :
                      role.color === 'blue' ? 'bg-blue-500/10 text-blue-300 border-blue-500/30' :
                      role.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' :
                      role.color === 'cyan' ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30' :
                      'bg-purple-500/10 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {role.label}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="pt-6">
                <Link
                  href="/register"
                  className="group relative inline-flex items-center justify-center gap-2 w-full sm:w-auto px-10 py-5 font-bold text-white text-base rounded-2xl overflow-hidden shadow-2xl transition-all hover:-translate-y-1 hover:shadow-emerald-500/40"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600" />
                  <span className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity shine-effect" />
                  <span className="relative flex items-center gap-2">
                    Daftar Gratis Sekarang
                    <IkonPanah />
                  </span>
                </Link>

                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1.5">
                    <IkonGembok />
                    Data terenkripsi
                  </span>
                  <span>·</span>
                  <span>Gratis selamanya</span>
                  <span>·</span>
                  <span>Tanpa kartu kredit</span>
                </div>
              </div>

              {/* Testimonial */}
              <div className="pt-8 border-t border-white/10">
                <div className="flex items-center justify-center gap-3 text-sm text-slate-300">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full border-2 border-slate-900 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] font-bold text-white"
                      >
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <span>
                    Dipercaya oleh <span className="font-bold text-white">500+ pengguna</span> di Indonesia
                  </span>
                  <div className="flex gap-0.5 text-amber-400">
                    {'★★★★★'.split('').map((s, i) => <span key={i}>{s}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <LogoPangan className="h-9 w-9" />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">PanganCerdas SaaS</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">© 2026 Proyek Lomba Web Dev PNJ</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-6 justify-center">
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">Kebijakan Privasi</span>
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">Syarat & Ketentuan</span>
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">Dokumentasi API</span>
              <span className="hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer transition-colors">Status Sistem</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}