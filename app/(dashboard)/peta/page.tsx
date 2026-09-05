"use client";
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/lib/supabase";
import { ThemeToggle } from "@/components/ThemeToggle";
import LogoPangan from "@/components/LogoPangan";
import "leaflet/dist/leaflet.css";

// Bentuk data yang diterima dari tabel makanan_surplus.
export interface ItemPangan {
  id: string;
  nama_makanan: string;
  alamat_resto: string;
  kategori_tier: string;
  harga_diskon?: number;
  stok_tersedia: number;
  latitude: number | string;
  longitude: number | string;
  created_at?: string;
}

const defaultCenter: [number, number] = [-6.2088, 106.8456];

// Ikon kecil dipisah agar komponen halaman tetap mudah dibaca.
// ==========================================
// KOMPONEN IKON SVG (Pengganti Emoji)
// ==========================================
const IkonKembali = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const IkonCari = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IkonGPS = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IkonPin = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IkonBerat = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
  </svg>
);

const IkonRupiah = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IkonHadiah = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
  </svg>
);

const IkonToko = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IkonExternalLink = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
  </svg>
);

const IkonPanah = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
  </svg>
);

const IkonBelanja = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
  </svg>
);

const IkonSosial = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const IkonListrik = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const IkonLayer = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const IkonTitik = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
  </svg>
);

const IkonSinyal = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
  </svg>
);

const IkonBox = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IkonEmpty = ({ className = "w-16 h-16" }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
  </svg>
);

// ==========================================
// HOOK CUSTOM
// ==========================================
function useCountUp(target: number, duration: number = 1500, shouldStart: boolean = true) {
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

// Tampilan sementara sebelum komponen Leaflet selesai dimuat di browser.
function MapLoading() {
  return (
    <div className="w-full h-full min-h-[550px] flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl text-slate-300 relative overflow-hidden">
      {/* Grid background */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px'
      }} />
      
      {/* Animated radar ping */}
      <div className="relative mb-6">
        <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/50">
          <IkonTitik className="w-8 h-8 text-white" />
        </div>
      </div>
      
      <div className="relative flex items-center gap-3">
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
        <span className="text-sm font-bold tracking-wide">Memuat Peta Spasial GIS</span>
      </div>
      <p className="text-xs text-slate-500 mt-2 relative">Menghubungkan ke OpenStreetMap...</p>
    </div>
  );
}

const PetaLeafletContent = dynamic(() => import("./PetaLeafletCore"), {
  ssr: false,
  loading: () => <MapLoading />,
});

export default function HalamanPetaSpasial() {
  // Filter, data peta, posisi kamera, dan status koneksi disimpan di sini.
  const { resolvedTheme } = useTheme();
  const [kataKunci, setKataKunci] = useState("");
  const [tierAktif, setTierAktif] = useState<string>("semua");
  const [daftarPangan, setDaftarPangan] = useState<ItemPangan[]>([]);
  const [itemTerpilih, setItemTerpilih] = useState<ItemPangan | null>(null);
  const [pusatPeta, setPusatPeta] = useState<[number, number]>(defaultCenter);
  const [zoomPeta, setZoomPeta] = useState<number>(12);
  const [lokasiSaya, setLokasiSaya] = useState<[number, number] | null>(null);
  const [statusKoneksi, setStatusKoneksi] = useState<"connecting" | "online" | "error">("connecting");
  const [searchFocused, setSearchFocused] = useState(false);
  const statsRef = useRef<HTMLDivElement>(null);
  const [statsInView, setStatsInView] = useState(false);

  // Beberapa data lama memakai format nama tier yang berbeda, jadi dinormalisasi di sini.
  const dapatkanNomorTier = useCallback((kategoriEnum: string): number => {
    if (!kategoriEnum) return 1;
    const str = kategoriEnum.toLowerCase();
    if (str.includes("tier1") || str.includes("tier 1") || str === "1") return 1;
    if (str.includes("tier2") || str.includes("tier 2") || str === "2") return 2;
    if (str.includes("tier3") || str.includes("tier 3") || str === "3") return 3;
    return 1;
  }, []);

  // Mulai animasi angka hanya saat bagian statistik masuk layar.
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setStatsInView(entry.isIntersecting),
      { threshold: 0.2 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;
    const ambilDataAwal = async () => {
      try {
        // Ambil data terbaru agar marker yang tampil mengikuti isi database.
        const { data, error } = await supabase
          .from("makanan_surplus")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (data && isMounted) {
          const validData = data.filter((item) => item.latitude && item.longitude);
          setDaftarPangan(validData);
          setStatusKoneksi("online");
          if (validData.length > 0) {
            setPusatPeta([Number(validData[0].latitude), Number(validData[0].longitude)]);
          }
        }
      } catch (err) {
        console.error("Gagal mengambil data Supabase:", err);
        if (isMounted) setStatusKoneksi("error");
      }
    };
    ambilDataAwal();

    // Dengarkan data baru supaya marker baru muncul tanpa refresh halaman.
    const channel = supabase
      .channel("peta-live-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "makanan_surplus" },
        (payload) => {
          const itemBaru = payload.new as ItemPangan;
          if (itemBaru.latitude && itemBaru.longitude) {
            setDaftarPangan((prev) => [itemBaru, ...prev]);
            setPusatPeta([Number(itemBaru.latitude), Number(itemBaru.longitude)]);
            setZoomPeta(15);
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && isMounted) {
          setStatusKoneksi("online");
        }
      });

    return () => {
      // Lepaskan listener saat halaman ditutup atau berpindah.
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Pencarian nama/alamat dan filter tier diterapkan sebelum data dikirim ke peta.
  const dataTersaring = useMemo(() => {
    return daftarPangan.filter((item) => {
      const kata = kataKunci.toLowerCase();
      const cocokKata =
        (item.nama_makanan || "").toLowerCase().includes(kata) ||
        (item.alamat_resto || "").toLowerCase().includes(kata);
      const numTier = dapatkanNomorTier(item.kategori_tier);
      const cocokTier = tierAktif === "semua" ? true : numTier === Number(tierAktif);
      return cocokKata && cocokTier;
    });
  }, [daftarPangan, kataKunci, tierAktif, dapatkanNomorTier]);

  const totalVolumeKg = useMemo(() => {
    return dataTersaring.reduce((acc, item) => acc + (Number(item.stok_tersedia) || 0), 0);
  }, [dataTersaring]);

  const jumlahTier1 = useMemo(() => dataTersaring.filter(i => dapatkanNomorTier(i.kategori_tier) === 1).length, [dataTersaring, dapatkanNomorTier]);
  const jumlahTier2 = useMemo(() => dataTersaring.filter(i => dapatkanNomorTier(i.kategori_tier) === 2).length, [dataTersaring, dapatkanNomorTier]);
  const jumlahTier3 = useMemo(() => dataTersaring.filter(i => dapatkanNomorTier(i.kategori_tier) === 3).length, [dataTersaring, dapatkanNomorTier]);

  // Angka statistik dianimasikan saat bagian statistik terlihat oleh pengguna.
  const animTitik = useCountUp(statsInView ? dataTersaring.length : 0, 1500, statsInView);
  const animKg = useCountUp(statsInView ? totalVolumeKg : 0, 1800, statsInView);
  const animT1 = useCountUp(statsInView ? jumlahTier1 : 0, 1200, statsInView);
  const animT2 = useCountUp(statsInView ? jumlahTier2 : 0, 1200, statsInView);
  const animT3 = useCountUp(statsInView ? jumlahTier3 : 0, 1200, statsInView);

  // Pilih marker dan pusatkan kamera ke lokasi makanan tersebut.
  const handlePilihItem = (item: ItemPangan) => {
    setItemTerpilih(item);
    const lat = Number(item.latitude);
    const lng = Number(item.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setPusatPeta([lat, lng]);
      setZoomPeta(16);
    }
  };

  // Gunakan GPS perangkat sebagai titik pusat peta.
  const handleGunakanLokasiSaya = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const myPos: [number, number] = [pos.coords.latitude, pos.coords.longitude];
          setLokasiSaya(myPos);
          setPusatPeta(myPos);
          setZoomPeta(15);
        },
        () => {
          alert("Gagal mengakses lokasi GPS Anda. Pastikan izin lokasi diizinkan.");
        }
      );
    }
  };

  // Konfigurasi warna dan label untuk setiap tier yang tampil di halaman.
  const getConfigTier = (tier: string | number) => {
    switch (tier) {
      case "1":
      case 1:
        return {
          gradien: "from-amber-500 to-orange-600",
          bgSoft: "bg-amber-500/10",
          bgHover: "hover:bg-amber-500/20",
          border: "border-amber-500/40",
          text: "text-amber-600 dark:text-amber-400",
          icon: <IkonBelanja className="w-4 h-4" />,
          label: "Tier 1",
          sublabel: "Surplus Marketplace",
        };
      case "2":
      case 2:
        return {
          gradien: "from-emerald-500 to-teal-600",
          bgSoft: "bg-emerald-500/10",
          bgHover: "hover:bg-emerald-500/20",
          border: "border-emerald-500/40",
          text: "text-emerald-600 dark:text-emerald-400",
          icon: <IkonSosial className="w-4 h-4" />,
          label: "Tier 2",
          sublabel: "Donasi Sosial",
        };
      case "3":
      case 3:
        return {
          gradien: "from-cyan-500 to-blue-600",
          bgSoft: "bg-cyan-500/10",
          bgHover: "hover:bg-cyan-500/20",
          border: "border-cyan-500/40",
          text: "text-cyan-600 dark:text-cyan-400",
          icon: <IkonListrik className="w-4 h-4" />,
          label: "Tier 3",
          sublabel: "Konversi Energi",
        };
      default:
        return {
          gradien: "from-slate-500 to-slate-700",
          bgSoft: "bg-slate-500/10",
          bgHover: "hover:bg-slate-500/20",
          border: "border-slate-500/40",
          text: "text-slate-600 dark:text-slate-400",
          icon: <IkonTitik className="w-4 h-4" />,
          label: "Tier",
          sublabel: "Umum",
        };
    }
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-800 dark:text-slate-100 font-sans antialiased flex flex-col transition-colors duration-300 selection:bg-emerald-500 selection:text-white">
      
      {/* Gaya global untuk animasi, scrollbar, dan penyesuaian Leaflet. */}
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
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes blob {
          0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
          50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 1; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes shine {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes ping {
          0% { transform: scale(1); opacity: 1; }
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes radar {
          0% { transform: scale(0.5); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes ticker-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 20s ease-in-out infinite; }
        .animate-slideUp { animation: slideUp 0.6s ease-out; }
        .animate-slideDown { animation: slideDown 0.5s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.6s ease-out; }
        .animate-blob { animation: blob 10s ease-in-out infinite; }
        .animate-pulse-ring { animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite; }
        .animate-ping-slow { animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite; }
        .animate-radar { animation: radar 2s ease-out infinite; }
        .animate-ticker { animation: ticker-scroll 40s linear infinite; }
        .gradient-text {
          background: linear-gradient(120deg, #059669 0%, #0d9488 50%, #f59e0b 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: gradient-shift 6s ease infinite;
        }
        .shine-effect {
          background: linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%);
          background-size: 200% 100%;
          animation: shine 3s linear infinite;
        }
        .glass {
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(16, 185, 129, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(16, 185, 129, 0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .card-hover {
          transition: all 0.3s cubic-bezier(0.23, 1, 0.320, 1);
        }
        .card-hover:hover {
          transform: translateY(-4px);
        }
        /* Custom scrollbar */
        .custom-scroll::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scroll::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #10b981, #14b8a6);
          border-radius: 10px;
        }
        .custom-scroll::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #059669, #0d9488);
        }
        /* Leaflet custom fixes */
        .leaflet-popup-content-wrapper {
          border-radius: 20px !important;
          padding: 0 !important;
          overflow: hidden;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 280px !important;
        }
        .leaflet-popup-tip {
          background: #1e293b !important;
        }
        .custom-leaflet-marker {
          background: transparent !important;
          border: none !important;
        }
        .custom-gps-marker {
          background: transparent !important;
          border: none !important;
        }
      `}</style>

      {/* Hiasan latar halaman. */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-10 w-96 h-96 bg-emerald-300/10 dark:bg-emerald-900/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-amber-300/10 dark:bg-amber-900/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-300/10 dark:bg-cyan-900/10 rounded-full blur-3xl animate-float-slow" />
      </div>

      {/* HEADER */}
      <header className="bg-white/70 dark:bg-slate-900/70 border-b border-slate-200/80 dark:border-slate-800/80 glass py-4 px-4 sm:px-6 lg:px-8 sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3" style={{ animation: 'slideDown 0.5s ease-out' }}>
            <Link href="/" className="group flex items-center gap-3">
              <LogoPangan className="h-11 w-11 drop-shadow-[0_4px_10px_rgba(16,185,129,0.3)] transition-transform duration-300 group-hover:scale-110" />
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Pangan<span className="gradient-text">Cerdas</span>
                </h1>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold tracking-widest uppercase">
                  Spatial GIS Engine
                </p>
              </div>
            </Link>

            {/* Status Koneksi */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="relative flex w-2 h-2">
                <span className={`absolute inline-flex w-full h-full rounded-full ${statusKoneksi === "online" ? "bg-emerald-400" : "bg-amber-400"} opacity-75 animate-ping-slow`} />
                <span className={`relative inline-flex w-2 h-2 rounded-full ${statusKoneksi === "online" ? "bg-emerald-500" : "bg-amber-500"}`} />
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 tracking-wider uppercase">
                {statusKoneksi === "online" ? "Live Realtime" : "Menghubungkan"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto" style={{ animation: 'slideDown 0.5s ease-out 0.1s both' }}>
            {/* Search Box dengan Focus Glow */}
            <div className="relative flex-1 md:w-80 group">
              <div className={`absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl opacity-0 group-focus-within:opacity-100 blur transition-opacity duration-300`} />
              <div className="relative flex items-center bg-white dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 rounded-2xl transition-all group-focus-within:border-emerald-500">
                <span className={`pl-4 transition-colors ${searchFocused ? 'text-emerald-500' : 'text-slate-400'}`}>
                  <IkonCari className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={kataKunci}
                  onChange={(e) => setKataKunci(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Cari makanan, resto, alamat..."
                  className="w-full bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 text-sm font-medium pl-3 pr-4 py-3 focus:outline-none"
                />
                {kataKunci && (
                  <button 
                    onClick={() => setKataKunci("")}
                    className="pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* GPS Button */}
            <button
              onClick={handleGunakanLokasiSaya}
              title="Gunakan Lokasi Saya"
              className="group relative p-3 bg-white dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-slate-700 dark:text-slate-300 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-500 rounded-2xl transition-all shrink-0 active:scale-95 cursor-pointer"
            >
              <div className="absolute inset-0 rounded-2xl bg-emerald-500/10 scale-0 group-hover:scale-100 transition-transform" />
              <IkonGPS className="w-5 h-5 text-emerald-500 dark:text-emerald-400 relative group-hover:scale-110 transition-transform" />
            </button>

            <ThemeToggle ringkas={true} />
          </div>
        </div>
      </header>

      {/* Live Ticker Info Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white py-2 overflow-hidden relative">
        <div className="absolute inset-0 shine-effect opacity-20" />
        <div className="relative max-w-[1600px] mx-auto px-4">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <div className="flex-shrink-0 flex items-center gap-1.5 pr-3 border-r border-white/20">
              <IkonSinyal className="w-3.5 h-3.5" />
              <span className="font-black">LIVE</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="flex items-center gap-8 whitespace-nowrap animate-ticker">
                {[...Array(2)].map((_, loopIdx) => (
                  <div key={loopIdx} className="flex items-center gap-8">
                    <span className="flex items-center gap-1.5">
                      <IkonTitik className="w-3.5 h-3.5" /> {daftarPangan.length} Node Aktif
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonBox className="w-3.5 h-3.5" /> {totalVolumeKg.toFixed(1)} Kg Volume Total
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonBelanja className="w-3.5 h-3.5" /> Tier 1: {jumlahTier1}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonSosial className="w-3.5 h-3.5" /> Tier 2: {jumlahTier2}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonListrik className="w-3.5 h-3.5" /> Tier 3: {jumlahTier3}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonLayer className="w-3.5 h-3.5" /> OpenStreetMap Engine
                    </span>
                    <span className="flex items-center gap-1.5">
                      <IkonSinyal className="w-3.5 h-3.5" /> Supabase Realtime
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* UTAMA */}
      <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 relative z-10">
        <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* SIDEBAR PANEL */}
          <aside className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4" style={{ animation: 'slideUp 0.6s ease-out 0.2s both' }}>
            
            {/* Stats Cards Grid */}
            <div ref={statsRef} className="grid grid-cols-2 gap-3">
              {/* Card: Node Terdaftar */}
              <div className="group relative bg-white dark:bg-slate-900/80 glass border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm card-hover overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
                      <IkonTitik className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Aktif
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Node Terdaftar
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {animTitik}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Titik</span>
                  </p>
                </div>
              </div>

              {/* Card: Total Volume */}
              <div className="group relative bg-white dark:bg-slate-900/80 glass border border-slate-200/80 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm card-hover overflow-hidden">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                      <IkonBox className="w-4 h-4" />
                    </div>
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">
                    Total Volume
                  </p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    {animKg}
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">Kg</span>
                  </p>
                </div>
              </div>

              {/* Tier Distribution Mini Cards */}
              <div className="col-span-2 grid grid-cols-3 gap-2">
                {[
                  { tier: "1", count: animT1, config: getConfigTier("1") },
                  { tier: "2", count: animT2, config: getConfigTier("2") },
                  { tier: "3", count: animT3, config: getConfigTier("3") },
                ].map(({ tier, count, config }) => (
                  <button
                    key={tier}
                    onClick={() => setTierAktif(tier)}
                    className={`relative p-3 rounded-xl border transition-all cursor-pointer group overflow-hidden ${
                      tierAktif === tier
                        ? `${config.bgSoft} ${config.border} shadow-md`
                        : 'bg-white/60 dark:bg-slate-900/60 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {tierAktif === tier && (
                      <div className={`absolute inset-0 bg-gradient-to-br ${config.gradien} opacity-5`} />
                    )}
                    <div className="relative">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${config.gradien} flex items-center justify-center text-white mb-1.5 shadow-sm`}>
                        {config.icon}
                      </div>
                      <p className="text-xs font-black text-slate-900 dark:text-white tabular-nums">{count}</p>
                      <p className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{config.label}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Filter Klasifikasi Tier */}
            <div className="bg-white/80 dark:bg-slate-900/80 glass border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">
                  Filter Klasifikasi
                </h2>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                  <IkonLayer className="w-3 h-3" />
                  <span>Tier</span>
                </div>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => setTierAktif("semua")}
                  className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group ${
                    tierAktif === "semua"
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <IkonLayer className="w-4 h-4" />
                    <span>Semua Tier</span>
                  </span>
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                    tierAktif === "semua" ? 'bg-white/20 text-white' : 'bg-white dark:bg-slate-700'
                  }`}>
                    {dataTersaring.length}
                  </span>
                </button>
                {["1", "2", "3"].map((tier) => {
                  const config = getConfigTier(tier);
                  if (!config) return null;
                  const isActive = tierAktif === tier;
                  return (
                    <button
                      key={tier}
                      onClick={() => setTierAktif(tier)}
                      className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-between group ${
                        isActive
                          ? `${config.bgSoft} ${config.border} border-2`
                          : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span className="flex items-center gap-2.5">
                        <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${config.gradien} flex items-center justify-center text-white shadow-sm ${isActive ? 'scale-110' : ''} transition-transform`}>
                          {config.icon}
                        </div>
                        <div className="text-left">
                          <p className={isActive ? config.text : 'text-slate-700 dark:text-slate-300'}>
                            {config.label}
                          </p>
                          <p className="text-[9px] text-slate-500 dark:text-slate-500 font-semibold">{config.sublabel}</p>
                        </div>
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                        isActive ? `${config.bgSoft} ${config.text}` : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}>
                        {tier === "1" ? jumlahTier1 : tier === "2" ? jumlahTier2 : jumlahTier3}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* List Lokasi Active */}
            <div className="bg-white/80 dark:bg-slate-900/80 glass border border-slate-200/80 dark:border-slate-800/80 rounded-3xl p-4 flex-1 flex flex-col shadow-sm max-h-[600px]">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping-slow" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
                    Lokasi Aktif
                  </span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  {dataTersaring.length} Item
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1 -mr-1">
                {dataTersaring.length > 0 ? (
                  dataTersaring.map((item, index) => {
                    const numTier = dapatkanNomorTier(item.kategori_tier);
                    const config = getConfigTier(numTier);
                    const isSelected = itemTerpilih?.id === item.id;
                    if (!config) return null;
                    
                    return (
                      <div
                        key={item.id}
                        onClick={() => handlePilihItem(item)}
                        style={{ animation: `slideUp 0.4s ease-out ${Math.min(index * 0.05, 0.5)}s both` }}
                        className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer group overflow-hidden ${
                          isSelected
                            ? `${config.bgSoft} ${config.border} shadow-lg scale-[1.02]`
                            : "bg-white/60 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {/* Selected indicator bar */}
                        {isSelected && (
                          <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${config.gradien}`} />
                        )}
                        
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <div className="flex items-start gap-2 flex-1 min-w-0">
                            <div className={`flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br ${config.gradien} flex items-center justify-center text-white shadow-sm ${isSelected ? 'scale-110' : ''} transition-transform`}>
                              {numTier === 1 ? <IkonToko className="w-4 h-4" /> : numTier === 2 ? <IkonSosial className="w-4 h-4" /> : <IkonListrik className="w-4 h-4" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-black text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                {item.nama_makanan}
                              </h3>
                              <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                {config.label} · {config.sublabel}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-400 mb-3 line-clamp-1 pl-10">
                          <IkonPin className={`w-3 h-3 ${config.text} flex-shrink-0`} />
                          <span>{item.alamat_resto || "Alamat Restoran Kemitraan"}</span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-700/50">
                          <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                            <IkonBerat className="w-3.5 h-3.5" />
                            <strong className="text-slate-800 dark:text-slate-200">{item.stok_tersedia} unit</strong>
                          </span>
                          {numTier === 1 ? (
                            <span className={`flex items-center gap-1 font-black text-xs ${config.text}`}>
                              <IkonRupiah className="w-3.5 h-3.5" />
                              {(Number(item.harga_diskon) || 0).toLocaleString("id-ID")}
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 font-bold text-xs ${config.text}`}>
                              <IkonHadiah className="w-3.5 h-3.5" />
                              Gratis
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 flex flex-col items-center justify-center">
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                      <IkonEmpty className="w-10 h-10 text-slate-400 dark:text-slate-600" />
                    </div>
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-400 mb-1">
                      Tidak ada data
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                      Coba ubah filter atau kata kunci
                    </p>
                  </div>
                )}
              </div>
            </div>
          </aside>

          {/* CONTAINER PETA LEAFLET */}
          <section 
            className="lg:col-span-8 xl:col-span-9 relative"
            style={{ animation: 'slideInRight 0.7s ease-out 0.3s both' }}
          >
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border-2 border-slate-800 dark:border-slate-700 rounded-3xl relative overflow-hidden shadow-2xl min-h-[700px] lg:min-h-[800px] flex flex-col p-2">
              
              {/* Map Header Overlay */}
              <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
                <div className="bg-slate-900/80 glass border border-slate-700/50 rounded-2xl px-4 py-2.5 flex items-center gap-3 pointer-events-auto">
                  <div className="relative flex w-2 h-2">
                    <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-75 animate-ping-slow" />
                    <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-0.5">
                      Spatial View
                    </p>
                    <p className="text-xs font-black text-white leading-none">
                      OpenStreetMap + CARTO
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pointer-events-auto">
                  <div className="bg-slate-900/80 glass border border-slate-700/50 rounded-2xl px-4 py-2.5 flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-sm shadow-amber-500/50" />
                      <span className="text-[10px] font-bold text-slate-300">T1</span>
                    </div>
                    <div className="w-px h-4 bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                      <span className="text-[10px] font-bold text-slate-300">T2</span>
                    </div>
                    <div className="w-px h-4 bg-slate-700" />
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-sm shadow-cyan-500/50" />
                      <span className="text-[10px] font-bold text-slate-300">T3</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Leaflet Map */}
              <PetaLeafletContent
                daftarPangan={dataTersaring}
                itemTerpilih={itemTerpilih}
                setItemTerpilih={setItemTerpilih}
                pusatPeta={pusatPeta}
                zoomPeta={zoomPeta}
                lokasiSaya={lokasiSaya}
                dapatkanNomorTier={dapatkanNomorTier}
                theme={resolvedTheme}
              />
            </div>

            {/* Bottom Map Info */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 px-2">
              <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center gap-1.5">
                  <IkonLayer className="w-3.5 h-3.5" />
                  <span className="font-semibold">Zoom Level: {zoomPeta}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <IkonPin className="w-3.5 h-3.5" />
                  <span className="font-semibold">Center: {pusatPeta[0].toFixed(3)}, {pusatPeta[1].toFixed(3)}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                <span>Powered by</span>
                <span className="text-emerald-600 dark:text-emerald-400">Supabase Realtime</span>
                <span>·</span>
                <span>Leaflet.js</span>
                <span>·</span>
                <span>OSM</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="bg-white/60 dark:bg-slate-900/60 glass border-t border-slate-200/80 dark:border-slate-800/80 py-4 text-center text-xs text-slate-500 dark:text-slate-400 relative z-10">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold">
            © 2026 PanganCerdas SaaS Engine
          </p>
          <p className="font-medium">
            System Spatial GIS Realtime · Berstandar Enterprise
          </p>
        </div>
      </footer>
    </div>
  );
}