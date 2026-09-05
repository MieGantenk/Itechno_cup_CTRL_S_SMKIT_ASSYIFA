"use client";

import { useState, useEffect, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence, type HTMLMotionProps, type Variants } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { 
  Bike, 
  MapPin, 
  PackageCheck, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Clock,
  Navigation,
  CheckCircle2,
  Filter,
  Sparkles,
  Inbox,
  QrCode,
  Map,
  AlertCircle,
  Zap,
  Target,
  Trophy,
  Star,
  Route,
  ArrowRight,
  X,
  Play,
  Pause,
  ChevronRight,
  Activity,
  Flame,
  Heart,
  ScanLine
} from "lucide-react";

// Warna dibedakan berdasarkan jenis misi agar informasi cepat dikenali.
const TEMA_WARNA_KATEGORI = {
  "Penyelamatan Pangan": {
    badgeBg: "bg-emerald-500/10",
    badgeText: "text-emerald-700",
    badgeBorder: "border-emerald-200",
    highlightBg: "bg-emerald-50",
    highlightText: "text-emerald-700",
    tombolBg: "bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700",
    glowColor: "shadow-emerald-500/50",
    icon: Heart,
  },
  "Ubah Limbah ke Energi": {
    badgeBg: "bg-amber-500/10",
    badgeText: "text-amber-700",
    badgeBorder: "border-amber-200",
    highlightBg: "bg-amber-50",
    highlightText: "text-amber-700",
    tombolBg: "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700",
    glowColor: "shadow-amber-500/50",
    icon: Zap,
  }
};

const PALET_STATISTIK = {
  emerald: { 
    bg: "bg-gradient-to-br from-emerald-50 to-teal-50", 
    text: "text-emerald-600",
    icon: "from-emerald-500 to-teal-600"
  },
  blue: { 
    bg: "bg-gradient-to-br from-blue-50 to-indigo-50", 
    text: "text-blue-600",
    icon: "from-blue-500 to-indigo-600"
  },
  amber: { 
    bg: "bg-gradient-to-br from-amber-50 to-orange-50", 
    text: "text-amber-600",
    icon: "from-amber-500 to-orange-600"
  },
  purple: { 
    bg: "bg-gradient-to-br from-purple-50 to-pink-50", 
    text: "text-purple-600",
    icon: "from-purple-500 to-pink-600"
  },
};

// Fungsi kecil untuk mengubah dan menampilkan angka uang atau berat.
const parseRupiah = (nilai: string | number | null | undefined) => Number(String(nilai).replace(/[^0-9\-]+/g, "")) || 0;

const formatRupiah = (nilai: number) => {
  // Format angka saja (misal: 15000 -> "15.000"). Ini konsisten di Server & Client.
  const angkaTerformat = new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(nilai);
  
  // Tambahkan prefix "Rp " secara manual agar hasilnya selalu sama persis
  return `Rp ${angkaTerformat}`;
};
const extractKilogram = (teks: string | null | undefined) => {
  const match = String(teks).match(/(\d+(?:\.\d+)?)\s*kg/i);
  return match ? Number(match[1]) : 0;
};

// Latar partikel memakai angka tetap agar hasil SSR dan browser sama.
const ParticleBackground = () => {
  // Posisi dihitung dari index, jadi tidak berubah setiap kali komponen dirender.
  const partikel = Array.from({ length: 20 }, (_, i) => ({
    left: ((i * 37 + 17) % 95) + 1,
    top: ((i * 53 + 11) % 95) + 1,
    durasi: 3 + (i % 3),
    jeda: (i % 5) * 0.4,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {partikel.map((p, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-emerald-400/20 rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: p.durasi,
            repeat: Infinity,
            delay: p.jeda,
          }}
        />
      ))}
    </div>
  );
};

// Kartu dengan gaya transparan yang dipakai berulang di halaman.
const GlassCard = ({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLMotionProps<"div">) => (
  <motion.div
    className={`backdrop-blur-xl bg-white/70 border border-white/20 shadow-xl ${className}`}
    whileHover={{ scale: 1.02, y: -4 }}
    transition={{ type: "spring", stiffness: 400, damping: 25 }}
    {...props}
  >
    {children}
  </motion.div>
);

// Peta ini hanya dimuat di browser karena Leaflet membutuhkan window.
const PetaRuteJalur = dynamic(
  async () => {
    const { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } = await import("react-leaflet");
    const L = (await import("leaflet")).default;

    const buatIkonPeta = (warna: string, ukuran = 22) =>
      L.divIcon({
        className: "custom-route-marker",
        html: `<div style="background:${warna};width:${ukuran}px;height:${ukuran}px;border-radius:50%;border:3px solid #fff;box-shadow:0 10px 20px rgba(15,23,42,0.25);"></div>`,
        iconSize: [ukuran, ukuran],
        iconAnchor: [ukuran / 2, ukuran / 2],
      });

    const MapControllerRute = ({ titikAwal, titikTujuan }: { titikAwal: [number, number]; titikTujuan: [number, number] }) => {
      const peta = useMap();

      useEffect(() => {
        if (!titikAwal || !titikTujuan) return;

        // Atur zoom agar titik jemput dan tujuan terlihat sekaligus.
        const batas: [[number, number], [number, number]] = [
          [Number(titikAwal[0]), Number(titikAwal[1])],
          [Number(titikTujuan[0]), Number(titikTujuan[1])],
        ];

        peta.fitBounds(batas, { padding: [50, 50], maxZoom: 16 });
      }, [peta, titikAwal, titikTujuan]);

      return null;
    };

    const PetaRuteTampilan = ({ ruteAwal, titikTargetRute, targetRute, lokasiKurir }: {
      ruteAwal: [number, number];
      titikTargetRute: [number, number];
      targetRute: { namaLokasi: string; label: string };
      lokasiKurir: [number, number] | null;
    }) => (
      <MapContainer
        center={ruteAwal}
        zoom={14}
        scrollWheelZoom={true}
        className="h-full w-full"
        style={{ height: "100%", width: "100%" }}
      >
        <MapControllerRute titikAwal={ruteAwal} titikTujuan={titikTargetRute} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {lokasiKurir && (
          <Marker position={ruteAwal} icon={buatIkonPeta("#2563eb", 20)}>
            <Popup>
              <div className="text-xs text-slate-700">
                <strong className="block text-slate-900">Lokasi Anda</strong>
                Posisi saat ini
              </div>
            </Popup>
          </Marker>
        )}

        <Marker position={titikTargetRute} icon={buatIkonPeta("#10b981", 24)}>
          <Popup>
            <div className="text-xs text-slate-700 max-w-[220px]">
              <strong className="block text-slate-900 mb-1">{targetRute.namaLokasi}</strong>
              {targetRute.label}
            </div>
          </Popup>
        </Marker>

        <Polyline
          positions={[ruteAwal, titikTargetRute]}
          pathOptions={{ color: "#10b981", weight: 6, opacity: 0.9 }}
        />
      </MapContainer>
    );

    return PetaRuteTampilan;
  },
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
        Memuat peta navigasi...
      </div>
    ),
  }
);

// Bentuk data dari database diubah agar mudah dipakai komponen tampilan.
interface MisiKurir {
  idMisi: string;
  pesanan_id?: string | number | null;
  jumlahMakanan: number;
  kategori: string;
  tipe: string;
  lokasiJemput: string;
  lokasiAntar: string;
  jarak: string;
  estimasiWaktu: string;
  imbalan: string;
  dampakSosial: string;
  sangatMendesak: boolean;
  waktuSisaDetik: number;
  latitude: number;
  longitude: number;
  latitudeAntar: number;
  longitudeAntar: number;
}

const misiDariBarisMisi = (m: any): MisiKurir => {
  const jumlahDariDampak = Number(String(m.dampak_sosial || '').match(/(\d+(?:\.\d+)?)\s*kg/i)?.[1]) || 1;
  const jumlahMakanan = Number(m.jumlah) || jumlahDariDampak;
  const berat = jumlahMakanan;
  const sisa = m.waktu_ditawarkan_hingga
    ? Math.max(0, Math.floor((new Date(m.waktu_ditawarkan_hingga).getTime() - Date.now()) / 1000))
    : 180;
  return {
    idMisi: m.id,
    pesanan_id: m.pesanan_id ?? m.pesananId ?? null,
    jumlahMakanan,
    kategori: m.kategori || 'Penyelamatan Pangan',
    tipe: m.tipe || m.nama_makanan || 'Pesanan',
    lokasiJemput: m.alamat_jemput || m.resto_asal || 'Lokasi Restoran',
    lokasiAntar: m.alamat_antar || 'Alamat Tujuan',
    jarak: m.jarak || '1.5 km',
    estimasiWaktu: m.estimasi_waktu || '15 Menit',
    imbalan: formatRupiah(Number(m.imbalan) || 10000),
    dampakSosial: m.dampak_sosial || `Menyelamatkan ${berat.toFixed(1)} kg`,
    sangatMendesak: (m.kategori || '').includes('Limbah'),
    waktuSisaDetik: sisa,
    latitude: Number(m.lat_jemput),
    longitude: Number(m.lng_jemput),
    latitudeAntar: Number(m.lat_antar ?? m.lat_jemput),
    longitudeAntar: Number(m.lng_antar ?? m.lng_jemput),
  };
};

const SALDO_AWAL = 15000;

// Halaman utama dashboard kurir.
export default function HalamanDashboardKurir() {
  // State ini mengatur misi, perjalanan, filter, saldo, dan tampilan rute.
  const [statusAktif, setStatusAktif] = useState(true);
  const [kategoriPilihan, setKategoriPilihan] = useState("Semua");
  const [misiSedangBerjalan, setMisiSedangBerjalan] = useState<MisiKurir | null>(null);
  const [daftarMisi, setDaftarMisi] = useState<MisiKurir[]>([]);
  const [misiSelesai, setMisiSelesai] = useState<MisiKurir[]>([]);
  const [saldo, setSaldo] = useState(SALDO_AWAL);
  const [notifikasiSelesai, setNotifikasiSelesai] = useState(false);
  const [tampilanRutePenuh, setTampilanRutePenuh] = useState(false);
  const [jenisRuteAktif, setJenisRuteAktif] = useState("jemput");
  const [statusPerjalanan, setStatusPerjalanan] = useState("siap");
  const [persentaseRute, setPersentaseRute] = useState(32);
  const [lokasiKurir, setLokasiKurir] = useState<[number, number] | null>(null);
  const [misiSedangDiambil, setMisiSedangDiambil] = useState<string | null>(null);

  // Waktu misi yang belum diambil terus berkurang setiap detik.
  useEffect(() => {
    if (!statusAktif || misiSedangBerjalan) return;

    const intervalTimer = setInterval(() => {
      setDaftarMisi((misiSaatIni) =>
        misiSaatIni.map((misi) => ({
          ...misi,
          waktuSisaDetik: Math.max(0, misi.waktuSisaDetik - 1),
        }))
      );
    }, 1000);

    return () => clearInterval(intervalTimer);
  }, [statusAktif, misiSedangBerjalan]);

  // Ambil misi terbuka dan total pendapatan kurir dari Supabase.
  useEffect(() => {
    let isMounted = true;
    const loadMisi = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('misi_kurir')
          .select("*")
          .eq('status', 'terbuka')
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!isMounted || !data) return;
        // Data database diubah ke bentuk MisiKurir sebelum disimpan ke state.
        setDaftarMisi(data.map(misiDariBarisMisi));

        if (user) {
          const { data: earnings, error: earningsError } = await supabase
            .from('courier_earnings')
            .select('amount')
            .eq('courier_id', user.id);
          if (earningsError) throw earningsError;
          const totalEarnings = (earnings || []).reduce((total, earning) => total + (Number(earning.amount) || 0), 0);
          if (isMounted) setSaldo(SALDO_AWAL + totalEarnings);
        }
      } catch (err) {
        console.error('Gagal memuat misi kurir:', err);
      }
    };

    loadMisi();

    // Misi baru atau perubahan status akan langsung terlihat tanpa refresh.
    const channel = supabase
      .channel("kurir-misi-live")
      .on(
        "postgres_changes",
        { event: 'INSERT', schema: 'public', table: 'misi_kurir' },
        (payload) => {
          const m = payload.new as any;
          if (m && m.status === 'terbuka' && isMounted)
            setDaftarMisi((prev) => [misiDariBarisMisi(m), ...prev]);
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'misi_kurir' }, (payload) => {
        const m = payload.new as any;
        if (m.status !== 'terbuka' && isMounted)
          setDaftarMisi((prev) => prev.filter((x) => x.idMisi !== m.id));
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && isMounted) {
          // Listener realtime sudah aktif.
        }
      });

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // --- AKSI UTAMA KURIR ---
  const tanganiAmbilMisi = async (misi: MisiKurir) => {
    if (misiSedangDiambil || misiSedangBerjalan) return;
    setMisiSedangDiambil(misi.idMisi);

    // Optimistic UI membuat rute langsung terbuka, lalu database memvalidasi claim.
    setMisiSedangBerjalan(misi);
    setDaftarMisi((prev) => prev.filter((item) => item.idMisi !== misi.idMisi));
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi kurir tidak ditemukan. Silakan login ulang.');

      const updateMisi = supabase
        .from('misi_kurir')
        .update({ status: 'diambil', kurir_id: user.id })
        .eq('id', misi.idMisi)
        .eq('status', 'terbuka')
        .select('id')
        .single();
      const updatePesanan = misi.pesanan_id
        ? supabase.from('pesanan').update({ status: 'sedang_diantar', kurir_id: user.id }).eq('id', misi.pesanan_id)
        : Promise.resolve({ error: null });
      const [{ data: misiTersimpan, error: errorMisi }, { error: errorPesanan }] = await Promise.all([updateMisi, updatePesanan]);

      if (errorMisi || !misiTersimpan) throw new Error(errorMisi?.message || 'Misi sudah diambil kurir lain.');
      if (errorPesanan) console.error('Gagal update status pesanan saat ambil misi:', errorPesanan.message);
    } catch (error) {
      setMisiSedangBerjalan(null);
      setDaftarMisi((prev) => [misi, ...prev]);
      console.error('Gagal ambil misi:', error instanceof Error ? error.message : String(error));
    } finally {
      setMisiSedangDiambil(null);
    }
  };

  const ambilTujuanRute = (jenisTujuan = "jemput") => {
    if (!misiSedangBerjalan) return null;

    return jenisTujuan === "antar"
      ? {
          latitude: misiSedangBerjalan.latitudeAntar ?? misiSedangBerjalan.latitude,
          longitude: misiSedangBerjalan.longitudeAntar ?? misiSedangBerjalan.longitude,
          namaLokasi: misiSedangBerjalan.lokasiAntar,
          label: "Tujuan Pengantaran",
        }
      : {
          latitude: misiSedangBerjalan.latitude,
          longitude: misiSedangBerjalan.longitude,
          namaLokasi: misiSedangBerjalan.lokasiJemput,
          label: "Lokasi Penjemputan",
        };
  };

  // Ubah status perjalanan saat kurir mulai berangkat.
  const handleMulaiPerjalanan = () => {
    setStatusPerjalanan("berjalan");
    setPersentaseRute(38);
  };

  // Saat sampai, progress rute dibuat penuh.
  const handleSampaiLokasi = () => {
    setStatusPerjalanan("sampai");
    setPersentaseRute(100);
  };

  // Buka Google Maps dan tampilkan panel rute di dalam dashboard.
  const bukaRutePenuh = (jenisTujuan = "jemput") => {
    if (!misiSedangBerjalan) return;

    const tujuan = ambilTujuanRute(jenisTujuan);
    if (!tujuan) return;

    setJenisRuteAktif(jenisTujuan);
    setStatusPerjalanan("siap");
    setPersentaseRute(32);

    const titikAwalLat = lokasiKurir ? lokasiKurir[0] : -6.2088;
    const titikAwalLng = lokasiKurir ? lokasiKurir[1] : 106.8456;
    const titikTujuanLat = Number(tujuan.latitude || -6.2088);
    const titikTujuanLng = Number(tujuan.longitude || 106.8456);

    const urlMaps = `https://www.google.com/maps/dir/?api=1&origin=${titikAwalLat},${titikAwalLng}&destination=${titikTujuanLat},${titikTujuanLng}&travelmode=driving`;

    if (typeof window !== "undefined") {
      window.open(urlMaps, "_blank", "noopener,noreferrer");
    }

    setTampilanRutePenuh(true);
  };

  useEffect(() => {
    if (statusPerjalanan !== "berjalan") return;

    // Simulasi progress rute bertambah selama perjalanan berlangsung.
    const timer = setInterval(() => {
      setPersentaseRute((nilaiLama) => {
        const langkahBerikut = Math.min(96, nilaiLama + 4);
        if (langkahBerikut >= 96) {
          setStatusPerjalanan("sampai");
          return 96;
        }
        return langkahBerikut;
      });
    }, 1400);

    return () => clearInterval(timer);
  }, [statusPerjalanan]);

  useEffect(() => {
    if (!misiSedangBerjalan || !misiSedangBerjalan.pesanan_id) return;

    // Dengarkan perubahan pesanan dari halaman penerima atau merchant.
    const channel = supabase
      .channel(`misi-selesai-${misiSedangBerjalan.pesanan_id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "pesanan",
          filter: `id=eq.${misiSedangBerjalan.pesanan_id}`,
        },
        (payload) => {
          if (payload.new.status === "selesai") {
            void tanganiSelesaikanMisi();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [misiSedangBerjalan]);

  const tanganiSelesaikanMisi = async () => {
    if (!misiSedangBerjalan) return;

    // RPC mencatat misi selesai sekaligus menghitung imbalan kurir.
    const { data: imbalanDibayar, error } = await supabase.rpc('selesaikan_misi_kurir', {
      p_misi_id: misiSedangBerjalan.idMisi,
    });
    const imbalanNilai = Number(imbalanDibayar) || parseRupiah(misiSedangBerjalan.imbalan);
    if (error) {
      // Fallback untuk project Supabase yang belum memiliki RPC tersebut.
      console.error('Gagal mencatat upah kurir:', error.message || String(error));
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error: errorUpah } = await supabase.from('courier_earnings').insert({
        courier_id: user.id,
        amount: imbalanNilai,
      });
      const { error: errorMisi } = await supabase.from('misi_kurir').update({ status: 'selesai' }).eq('id', misiSedangBerjalan.idMisi);
      if (errorUpah || errorMisi) {
        console.error('Gagal menyelesaikan misi:', errorUpah?.message || errorMisi?.message || 'Periksa tabel courier_earnings dan status misi.');
        return;
      }
      if (misiSedangBerjalan.pesanan_id) {
        await supabase.from('pesanan').update({ status: 'selesai' }).eq('id', misiSedangBerjalan.pesanan_id);
      }
    }

    setSaldo((prev) => prev + imbalanNilai);
    setMisiSelesai((prev) => [...prev, misiSedangBerjalan]);
    setMisiSedangBerjalan(null);
    setNotifikasiSelesai(true);
    setTimeout(() => setNotifikasiSelesai(false), 4000);
  };

  const daftarKategori = ["Semua", "Penyelamatan Pangan", "Ubah Limbah ke Energi"];

  const misiTersaring = kategoriPilihan === "Semua" 
    ? daftarMisi 
    : daftarMisi.filter((misi) => misi.kategori === kategoriPilihan);

  const totalMisiSelesai = misiSelesai.length;
  const pendapatanHariIni = misiSelesai.reduce(
    (total, misi) => total + parseRupiah(misi.imbalan),
    0
  );
  const totalPenyelamatan = misiSelesai.reduce(
    (total, misi) => total + extractKilogram(misi.dampakSosial),
    0
  );
  const ratingKurir = Math.min(5, 4.2 + Math.min(0.8, totalMisiSelesai * 0.08));
  const reviewCount = totalMisiSelesai > 0 ? totalMisiSelesai * 5 : 0;

  const ruteAwal = lokasiKurir || [-6.2088, 106.8456];
  const targetRute = ambilTujuanRute(jenisRuteAktif) || {
    latitude: misiSedangBerjalan?.latitude ?? -6.2088,
    longitude: misiSedangBerjalan?.longitude ?? 106.8456,
    namaLokasi: misiSedangBerjalan?.lokasiJemput ?? "Lokasi tujuan",
    label: "Lokasi tujuan",
  };
  const titikTargetRute = [Number(targetRute.latitude), Number(targetRute.longitude)];

  // Pola animasi untuk kemunculan container dan item di halaman.
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15,
      },
    },
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 p-4 sm:p-6 md:p-8 font-sans text-slate-800 relative overflow-x-clip">
      <ParticleBackground />
      
      {/* Notifikasi setelah misi selesai. */}
      <AnimatePresence>
        {notifikasiSelesai && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] w-full max-w-md"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-5 rounded-2xl shadow-2xl shadow-emerald-500/50 flex items-center gap-4 border border-emerald-400/30 backdrop-blur-xl">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              >
                <CheckCircle2 className="w-8 h-8 shrink-0" />
              </motion.div>
              <div className="flex-1">
                <p className="font-bold text-base">Misi Berhasil Diselesaikan!</p>
                <p className="text-xs text-emerald-100 mt-0.5">Poin dampak sosial dan saldo imbalan telah ditambahkan.</p>
              </div>
              <button
                onClick={() => setNotifikasiSelesai(false)}
                className="p-1 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Isi utama dashboard kurir. */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 space-y-6"
      >
        {/* 1. HERO BANNER */}
        <motion.div
          variants={itemVariants}
          className={`relative overflow-hidden rounded-3xl p-6 md:p-8 text-white shadow-2xl transition-all duration-500 ${
            statusAktif 
              ? 'bg-gradient-to-br from-emerald-900 via-teal-800 to-slate-900' 
              : 'bg-gradient-to-br from-slate-800 to-slate-900'
          }`}
        >
          {/* Animated Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <motion.div
              className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-br from-emerald-500/20 to-teal-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -left-20 -bottom-20 w-96 h-96 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-full blur-3xl"
              animate={{
                scale: [1.2, 1, 1.2],
                opacity: [0.3, 0.5, 0.3],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          <div className="absolute -right-10 -bottom-10 opacity-5 pointer-events-none">
            <Bike className="w-96 h-96" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-4 max-w-3xl">
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="inline-flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/30 px-4 py-2 rounded-full text-xs font-semibold text-emerald-300 backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Visi Ekonomi Inklusif Lokal</span>
              </motion.div>
              
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="text-3xl md:text-4xl font-black tracking-tight leading-tight"
              >
                {misiSedangBerjalan ? "Mode Pengantaran Misi" : "Pusat Komando Kurir Rescue"}
              </motion.h1>
              
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-slate-300 text-base md:text-lg leading-relaxed max-w-2xl"
              >
                Berdayakan dirimu sebagai <span className="text-emerald-400 font-bold">Pahlawan Lingkungan</span>. Antar makanan berlebih dan limbah organik ke tempat yang tepat.
              </motion.p>
            </div>

            {/* Status Toggle */}
            {!misiSedangBerjalan && (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.6, type: "spring" }}
                className={`border p-5 rounded-2xl backdrop-blur-xl flex items-center justify-between lg:justify-end gap-6 shrink-0 transition-all duration-500 ${
                  statusAktif 
                    ? 'bg-white/10 border-emerald-400/30 shadow-xl shadow-emerald-500/20' 
                    : 'bg-slate-700/50 border-slate-600/50'
                }`}
              >
                <div>
                  <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Status Anda</p>
                  <motion.p
                    key={statusAktif ? "online" : "offline"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-lg font-black mt-1 ${statusAktif ? 'text-emerald-300' : 'text-slate-400'}`}
                  >
                    {statusAktif ? "Siap Menerima Misi" : "Sedang Istirahat"}
                  </motion.p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setStatusAktif(!statusAktif)}
                  className={`relative inline-flex h-10 w-[72px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-500 ease-in-out focus:outline-none focus:ring-4 ${
                    statusAktif 
                      ? "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/50 focus:ring-emerald-500/30" 
                      : "bg-slate-600 shadow-lg shadow-slate-900/50"
                  }`}
                >
                  <motion.span
                    layout
                    className={`pointer-events-none inline-block h-8 w-8 transform rounded-full bg-white shadow-xl transition-all duration-500 ease-in-out ${
                      statusAktif ? "translate-x-[40px]" : "translate-x-1"
                    }`}
                  />
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* 2. STATISTICS CARDS */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4"
        >
          {[
            {
              label: "Pendapatan Hari Ini",
              nilai: formatRupiah(pendapatanHariIni),
              sub: totalMisiSelesai > 0 ? `${totalMisiSelesai} misi selesai` : "Belum ada misi",
              ikon: Wallet,
              skemaWarna: PALET_STATISTIK.emerald,
            },
            {
              label: "Misi Selesai",
              nilai: `${totalMisiSelesai}`,
              sub: "Target: 8 pengantaran",
              ikon: PackageCheck,
              skemaWarna: PALET_STATISTIK.blue,
            },
            {
              label: "Penyelamatan",
              nilai: `${totalPenyelamatan.toFixed(1)} kg`,
              sub: "Terlindungi dari TPA",
              ikon: ShieldCheck,
              skemaWarna: PALET_STATISTIK.amber,
            },
            {
              label: "Rating Kurir",
              nilai: `${ratingKurir.toFixed(1)}`,
              sub: totalMisiSelesai > 0 ? `${reviewCount} ulasan` : "Selesaikan misi",
              ikon: Star,
              skemaWarna: PALET_STATISTIK.purple,
            },
            {
              label: "Total Saldo",
              nilai: formatRupiah(saldo),
              sub: "Dapat ditarik",
              ikon: Wallet,
              skemaWarna: PALET_STATISTIK.blue,
            },
          ].map((stat, indeks) => (
            <GlassCard
              key={indeks}
              className="p-6 rounded-2xl overflow-hidden relative group"
              whileHover={{ y: -8, scale: 1.03 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-black text-slate-500 uppercase tracking-wider">{stat.label}</span>
                  <motion.div
                    className={`p-3 rounded-xl bg-gradient-to-br ${stat.skemaWarna.icon} shadow-lg`}
                    whileHover={{ rotate: 360, scale: 1.1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <stat.ikon className="w-5 h-5 text-white" />
                  </motion.div>
                </div>
                <motion.p
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 + indeks * 0.1, type: "spring" }}
                  className="text-3xl font-black text-slate-800 mb-1"
                >
                  {stat.nilai}
                </motion.p>
                <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                  {indeks === 0 && <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />}
                  {stat.sub}
                </p>
              </div>
            </GlassCard>
          ))}
        </motion.div>

        {/* 3. ACTIVE MISSION */}
        <AnimatePresence mode="wait">
          {misiSedangBerjalan ? (
            <motion.div
              key="active-mission"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-emerald-500/50 shadow-2xl shadow-emerald-500/20 overflow-hidden space-y-6 p-6 md:p-8"
            >
              {/* Mission Header */}
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/50 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="absolute inset-0 bg-emerald-400 rounded-full blur-md opacity-75"
                    />
                    <div className="relative flex items-center justify-center w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg">
                      <Activity className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <motion.h2
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      className="text-emerald-900 font-black text-xl"
                    >
                      Misi Aktif: {misiSedangBerjalan.tipe || "Makanan"}
                    </motion.h2>
                    <p className="text-sm text-emerald-700 font-medium mt-0.5">{misiSedangBerjalan.lokasiJemput}</p>
                    <p className="text-sm text-emerald-700 font-bold mt-1">Jumlah makanan: {misiSedangBerjalan.jumlahMakanan} porsi</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Imbalan</span>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.3 }}
                    className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                  >
                    {misiSedangBerjalan.imbalan}
                  </motion.span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Navigation Map */}
                <motion.div
                  initial={{ x: -50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 min-h-[280px] flex flex-col justify-between text-white relative overflow-hidden group"
                >
                  {/* Animated background */}
                  <div className="absolute inset-0 overflow-hidden">
                    <motion.div
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.1, 0.2, 0.1],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl"
                    />
                  </div>

                  <div className="flex justify-between items-start z-10">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2 shadow-lg"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Rute GPS Aktif</span>
                    </motion.span>
                    <span className="text-sm text-slate-300 font-mono font-bold">{misiSedangBerjalan.jarak}</span>
                  </div>

                  <div className="flex flex-col items-center justify-center my-8 z-10 space-y-3 text-center">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Map className="w-16 h-16 text-emerald-400" />
                    </motion.div>
                    <p className="text-base font-bold">Menuju Titik Penjemputan</p>
                    <p className="text-sm text-slate-400">{misiSedangBerjalan.lokasiJemput}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 z-10">
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(16, 185, 129, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => bukaRutePenuh("jemput")}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-emerald-400/50 transition-all shadow-lg"
                    >
                      <Navigation className="w-4 h-4" />
                      <span>Google Maps Jemput</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05, boxShadow: "0 10px 40px rgba(59, 130, 246, 0.4)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => bukaRutePenuh("antar")}
                      className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-blue-400/50 transition-all shadow-lg"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Google Maps Antar</span>
                    </motion.button>
                  </div>
                </motion.div>

                {/* Mission Details */}
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="space-y-5 flex flex-col justify-between"
                >
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-500 uppercase tracking-wider">Instruksi Pengantaran</h3>
                    <div className="space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200/80">
                      <div className="flex items-start gap-4 text-sm">
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2.5 rounded-xl shrink-0 shadow-lg">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">JEMPUT DI</span>
                          <span className="font-bold text-slate-800">{misiSedangBerjalan.lokasiJemput}</span>
                        </div>
                      </div>
                      <div className="flex items-start gap-4 text-sm pt-4 border-t border-slate-200/60">
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2.5 rounded-xl shrink-0 shadow-lg">
                          <Navigation className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1">
                          <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">ANTAR KE</span>
                          <span className="font-bold text-slate-800">{misiSedangBerjalan.lokasiAntar}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full bg-amber-50 border-2 border-amber-200 p-5 rounded-2xl text-center">
                    <div className="flex justify-center mb-3">
                      <div className="relative">
                        <div className="absolute inset-0 bg-amber-400 rounded-full blur-md opacity-75 animate-ping" />
                        <div className="relative w-16 h-16 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-300/40">
                          <ScanLine className="w-8 h-8" />
                        </div>
                      </div>
                    </div>
                    <p className="text-amber-900 font-black text-lg">Menunggu Konsumen/Panti...</p>
                    <p className="text-amber-700 text-sm mt-1">Minta penerima untuk scan QR Code di aplikasi mereka. Misi akan selesai otomatis.</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* 4. MISSION LIST */
            <motion.div
              key="mission-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 shadow-xl space-y-6 p-6 md:p-8"
            >
              {/* Header & Filter */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/50 pb-5">
                <div>
                  <h2 className="text-2xl font-black text-slate-800">Misi Penjemputan Terdekat</h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Pilih tugas distribusi sosial di sekitar lokasi Anda</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Filter className="w-5 h-5 text-slate-400 hidden sm:block" />
                  {daftarKategori.map((kategori) => (
                    <motion.button
                      key={kategori}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setKategoriPilihan(kategori)}
                      className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                        kategoriPilihan === kategori
                          ? "bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-lg shadow-slate-900/30"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {kategori}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Empty States */}
              <AnimatePresence mode="wait">
                {!statusAktif ? (
                  <motion.div
                    key="offline"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <AlertCircle className="w-16 h-16 text-slate-400" />
                    </motion.div>
                    <div>
                      <p className="font-black text-slate-700 text-lg">Anda Sedang Offline</p>
                      <p className="text-sm text-slate-500 mt-2 max-w-md">Aktifkan sakelar status di bagian atas untuk melihat dan mengambil misi penjemputan.</p>
                    </div>
                  </motion.div>
                ) : misiTersaring.length === 0 ? (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="py-16 flex flex-col items-center justify-center text-center space-y-4 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border-2 border-dashed border-slate-300"
                  >
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Inbox className="w-16 h-16 text-slate-300" />
                    </motion.div>
                    <div>
                      <p className="font-black text-slate-700 text-lg">Tidak Ada Misi Tersedia</p>
                      <p className="text-sm text-slate-500 mt-2 max-w-md">Belum ada orderan baru pada kategori ini atau waktu misi telah habis.</p>
                    </div>
                  </motion.div>
                ) : (
                  /* Mission Cards */
                  <motion.div
                    key="missions"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 gap-5"
                  >
                    {misiTersaring.map((misi, index) => {
                      const temaWarna = TEMA_WARNA_KATEGORI[misi.kategori as keyof typeof TEMA_WARNA_KATEGORI] || TEMA_WARNA_KATEGORI["Penyelamatan Pangan"];
                      const IconKategori = temaWarna.icon;

                      return (
                        <motion.div
                          key={misi.idMisi}
                          variants={itemVariants}
                          whileHover={{ y: -4, scale: 1.01 }}
                          className="group relative border-2 border-slate-200/50 hover:border-emerald-500/50 bg-white hover:bg-gradient-to-br hover:from-emerald-50/50 hover:to-teal-50/50 rounded-2xl p-6 md:p-7 transition-all duration-300 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col xl:flex-row justify-between gap-6 overflow-hidden"
                        >
                          {/* Glow Effect */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-2xl blur-xl" />
                          </div>

                          {/* Mission Info */}
                          <div className="space-y-5 flex-1 relative z-10">
                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center gap-2 bg-gradient-to-br from-emerald-50 to-teal-50 px-4 py-2 rounded-full border border-emerald-200">
                                <IconKategori className="w-4 h-4 text-emerald-600" />
                                <span className={`text-xs font-bold ${temaWarna.badgeText}`}>
                                  {misi.kategori}
                                </span>
                              </div>
                              
                              <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1.5 rounded-full max-w-[180px] truncate">
                                {misi.tipe || "Misi makanan"}
                              </span>
                              
                              {misi.sangatMendesak && (
                                <motion.span
                                  animate={{ scale: [1, 1.05, 1] }}
                                  transition={{ duration: 1, repeat: Infinity }}
                                  className="text-[10px] bg-gradient-to-r from-red-500 to-orange-500 text-white border border-red-400/50 px-3 py-1.5 rounded-full font-black uppercase shadow-lg shadow-red-500/30 flex items-center gap-1.5"
                                >
                                  <Flame className="w-3 h-3" />
                                  <span>Butuh Cepat</span>
                                </motion.span>
                              )}

                              {/* Countdown Timer */}
                              <motion.div
                                animate={{ scale: misi.waktuSisaDetik < 30 ? [1, 1.1, 1] : 1 }}
                                transition={{ duration: 0.5, repeat: misi.waktuSisaDetik < 30 ? Infinity : 0 }}
                                className="text-xs font-bold text-slate-600 bg-gradient-to-r from-slate-100 to-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 ml-auto xl:ml-0 border border-slate-200/50"
                              >
                                <Clock className="w-3.5 h-3.5 text-slate-500" />
                                <span className="font-mono">Sisa {misi.waktuSisaDetik}s</span>
                              </motion.div>
                            </div>

                            {/* Route Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gradient-to-br from-slate-50 to-slate-100 p-5 rounded-2xl border border-slate-200/50">
                              <div className="flex items-start gap-3 text-sm">
                                <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-2 rounded-lg shrink-0 shadow-lg">
                                  <MapPin className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">LOKASI JEMPUT</span>
                                  <span className="font-bold text-slate-700 block truncate">{misi.lokasiJemput}</span>
                                </div>
                              </div>

                              <div className="flex items-start gap-3 text-sm">
                                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg shrink-0 shadow-lg">
                                  <Navigation className="w-4 h-4 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block mb-1">LOKASI ANTAR</span>
                                  <span className="font-bold text-slate-700 block truncate">{misi.lokasiAntar}</span>
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-slate-600 pt-1">
                              <span className="flex items-center gap-2 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                                <Clock className="w-4 h-4 text-slate-500" />
                                <span>{misi.estimasiWaktu}</span>
                              </span>
                              <span className="flex items-center gap-2 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                                <Bike className="w-4 h-4 text-slate-500" />
                                <span>{misi.jarak}</span>
                              </span>
                              <span className="flex items-center gap-2 font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200/50 shadow-sm">
                                <PackageCheck className="w-4 h-4 text-slate-500" />
                                <span>{misi.jumlahMakanan} porsi</span>
                              </span>
                              <motion.span
                                whileHover={{ scale: 1.05 }}
                                className={`font-black ${temaWarna.highlightBg} ${temaWarna.highlightText} px-4 py-2 rounded-lg flex items-center gap-2 border ${temaWarna.badgeBorder} shadow-sm`}
                              >
                                <ShieldCheck className="w-4 h-4" />
                                <span>{misi.dampakSosial}</span>
                              </motion.span>
                            </div>
                          </div>

                          {/* Reward & Action */}
                          <div className="flex flex-row xl:flex-col justify-between items-center xl:items-end border-t xl:border-t-0 pt-5 xl:pt-0 border-slate-200/50 shrink-0 min-w-[160px] relative z-10">
                            <div className="text-left xl:text-right mb-4 xl:mb-0">
                              <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider block mb-1">Imbalan Bersih</span>
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: index * 0.1, type: "spring" }}
                                className="text-3xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent"
                              >
                                {misi.imbalan}
                              </motion.span>
                            </div>

                            <motion.button
                              whileHover={{ scale: 1.05, boxShadow: "0 15px 50px rgba(16, 185, 129, 0.4)" }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => tanganiAmbilMisi(misi)}
                              disabled={misiSedangDiambil === misi.idMisi || Boolean(misiSedangBerjalan)}
                              className={`${temaWarna.tombolBg} text-white px-7 py-3.5 rounded-xl text-sm font-bold transition-all duration-300 shadow-lg ${temaWarna.glowColor} flex items-center gap-2.5 disabled:cursor-wait disabled:opacity-60`}
                            >
                              <Bike className={`w-4 h-4 ${misiSedangDiambil === misi.idMisi ? 'animate-pulse' : ''}`} />
                              <span>{misiSedangDiambil === misi.idMisi ? 'Memproses...' : 'Ambil Misi'}</span>
                              <ArrowRight className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. FULL ROUTE MODAL */}
        <AnimatePresence>
          {tampilanRutePenuh && misiSedangBerjalan && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md p-3 sm:p-5 flex items-center justify-center"
              onClick={() => setTampilanRutePenuh(false)}
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0, y: 50 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 50 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-xl"
              >
                <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl p-6 md:p-8">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.25em] text-slate-500 font-bold">Navigasi Misi</p>
                      <h3 className="text-2xl font-black text-slate-900 mt-1">
                        {jenisRuteAktif === "jemput" ? "Rute Jemput" : "Rute Antar"}
                      </h3>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setTampilanRutePenuh(false)}
                      className="rounded-full border-2 border-slate-300 bg-white p-2 shadow-lg hover:bg-slate-50 transition-all"
                    >
                      <X className="w-5 h-5 text-slate-700" />
                    </motion.button>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-5 border border-slate-200/50 mb-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 mb-2">TUJUAN</p>
                    <p className="text-xl font-black text-slate-800">{targetRute.namaLokasi}</p>
                    <p className="text-sm text-slate-600 mt-1 font-medium">{targetRute.label}</p>
                  </div>

                  <div className="space-y-4">
                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="rounded-2xl border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-5 text-sm text-emerald-800"
                    >
                      <p className="font-black text-base mb-2 flex items-center gap-2">
                        <Route className="w-5 h-5" />
                        <span>Rute akan dibuka di Google Maps</span>
                      </p>
                      <p className="text-emerald-700 font-medium">Arahkan ke titik tujuan tanpa menampilkan peta di web.</p>
                    </motion.div>

                    <motion.button
                      whileHover={{ scale: 1.02, boxShadow: "0 20px 60px rgba(16, 185, 129, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => {
                        const target = ambilTujuanRute(jenisRuteAktif);
                        if (!target) return;
                        const latAwal = lokasiKurir ? lokasiKurir[0] : -6.2088;
                        const lngAwal = lokasiKurir ? lokasiKurir[1] : 106.8456;
                        const latTujuan = Number(target.latitude || -6.2088);
                        const lngTujuan = Number(target.longitude || 106.8456);
                        const urlMaps = `https://www.google.com/maps/dir/?api=1&origin=${latAwal},${lngAwal}&destination=${latTujuan},${lngTujuan}&travelmode=driving`;
                        if (typeof window !== "undefined") {
                          window.open(urlMaps, "_blank", "noopener,noreferrer");
                        }
                      }}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 px-6 py-4 text-base font-black text-white shadow-2xl shadow-emerald-500/30 transition-all flex items-center justify-center gap-3"
                    >
                      <Navigation className="w-5 h-5" />
                      <span>Buka Google Maps</span>
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => setTampilanRutePenuh(false)}
                      className="w-full rounded-2xl border-2 border-slate-300 bg-white hover:bg-slate-50 px-6 py-4 text-base font-bold text-slate-700 transition-all"
                    >
                      Kembali ke Dashboard
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}