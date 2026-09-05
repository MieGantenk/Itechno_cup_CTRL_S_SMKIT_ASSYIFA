"use client";

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import type { ItemPangan } from "./page";

// Komponen ini menggerakkan kamera saat posisi pusat atau zoom berubah.
// ==========================================
// ANIMASI KAMERA PETA
// ==========================================
function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, zoom, { 
        duration: 1.5,
        easeLinearity: 0.25
      });
    }
  }, [center, zoom, map]);
  return null;
}

// ==========================================
// PEMBUAT MARKER SVG SESUAI TIER
// ==========================================
const buatIkonTier = (tier: number, isSelected: boolean = false) => {
  const configs = {
    1: {
      color: "#f59e0b",
      shadow: "#f59e0b",
      glow: "rgba(245, 158, 11, 0.6)",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>`,
    },
    2: {
      color: "#10b981",
      shadow: "#10b981",
      glow: "rgba(16, 185, 129, 0.6)",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>`,
    },
    3: {
      color: "#06b6d4",
      shadow: "#06b6d4",
      glow: "rgba(6, 182, 212, 0.6)",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>`,
    },
  };

  const config = configs[tier as keyof typeof configs] || configs[1];
  const size = isSelected ? 56 : 44;
  const innerSize = isSelected ? 32 : 26;
  const iconSize = isSelected ? 18 : 14;

  return L.divIcon({
    className: "custom-leaflet-marker",
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <!-- Lingkaran yang berdenyut untuk menarik perhatian ke marker. -->
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: ${config.glow};
          animation: pulse-ring 2s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
          ${isSelected ? '' : 'opacity: 0.5;'}
        "></div>
        
        <!-- Cahaya lembut di belakang marker. -->
        <div style="
          position: absolute;
          inset: -4px;
          border-radius: 50%;
          background: ${config.color};
          filter: blur(8px);
          opacity: ${isSelected ? '0.6' : '0.3'};
          transition: all 0.3s;
        "></div>
        
        <!-- Lingkaran utama dan ikon tier. -->
        <div style="
          position: relative;
          width: ${innerSize}px;
          height: ${innerSize}px;
          border-radius: 50%;
          background: linear-gradient(135deg, ${config.color}, ${config.shadow});
          border: 3px solid white;
          box-shadow: 0 4px 20px ${config.glow}, 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        ">
          <div style="width: ${iconSize}px; height: ${iconSize}px;">
            ${config.icon}
          </div>
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2 + 5],
  });
};

// ==========================================
// MARKER GPS PENGGUNA
// ==========================================
const ikonGpsSaya = L.divIcon({
  className: "custom-gps-marker",
  html: `
    <div style="
      position: relative;
      width: 60px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <!-- Gelombang radar untuk menandai posisi pengguna. -->
      <div style="
        position: absolute;
        inset: 0;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.4);
        animation: radar 2s ease-out infinite;
      "></div>
      
      <!-- Perkiraan area di sekitar posisi pengguna. -->
      <div style="
        position: absolute;
        inset: 5px;
        border-radius: 50%;
        background: rgba(59, 130, 246, 0.15);
        border: 2px solid rgba(59, 130, 246, 0.3);
      "></div>
      
      <!-- Titik posisi pengguna. -->
      <div style="
        position: relative;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: linear-gradient(135deg, #3b82f6, #2563eb);
        border: 3px solid white;
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.6), 0 2px 6px rgba(0,0,0,0.3);
      "></div>
    </div>
  `,
  iconSize: [60, 60],
  iconAnchor: [30, 30],
});

// ==========================================
// KONFIGURASI TAMPILAN TIAP TIER
// ==========================================
const getTierConfig = (tier: number) => {
  switch (tier) {
    case 1:
      return {
        gradien: "from-amber-500 to-orange-600",
        color: "#f59e0b",
        text: "text-amber-600",
        label: "Tier 1",
        sublabel: "Surplus Marketplace",
        description: "Makanan diskon 50-70% dari merchant kuliner",
      };
    case 2:
      return {
        gradien: "from-emerald-500 to-teal-600",
        color: "#10b981",
        text: "text-emerald-600",
        label: "Tier 2",
        sublabel: "Donasi Sosial",
        description: "Makanan layak untuk panti & warga rentan",
      };
    case 3:
      return {
        gradien: "from-cyan-500 to-blue-600",
        color: "#06b6d4",
        text: "text-cyan-600",
        label: "Tier 3",
        sublabel: "Konversi Bio-Energi",
        description: "Limbah organik untuk biogas & maggot BSF",
      };
    default:
      return null;
  }
};

// ==========================================
// SVG ICONS UNTUK POPUP
// ==========================================
const PopupIcon = {
  Pin: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  Berat: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
    </svg>
  ),
  Rupiah: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Hadiah: () => (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
    </svg>
  ),
  External: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  Navigate: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
    </svg>
  ),
  Close: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  Toko: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Sosial: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
  Listrik: () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
};

interface PropsLeaflet {
  daftarPangan: ItemPangan[];
  itemTerpilih: ItemPangan | null;
  setItemTerpilih: (item: ItemPangan | null) => void;
  pusatPeta: [number, number];
  zoomPeta: number;
  lokasiSaya: [number, number] | null;
  dapatkanNomorTier: (kat: string) => number;
  theme?: string;
}

export default function PetaLeafletCore({
  daftarPangan,
  itemTerpilih,
  setItemTerpilih,
  pusatPeta,
  zoomPeta,
  lokasiSaya,
  dapatkanNomorTier,
  theme = 'light',
}: PropsLeaflet) {
  // Pilih gambar peta dan warna kontrol sesuai tema halaman.
  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
  
  const mapBgColor = theme === 'dark' ? '#0f172a' : '#ffffff';
  return (
    <div className="w-full h-full min-h-[680px] lg:min-h-[780px] rounded-2xl overflow-hidden relative z-10">
      <style>{`
        @keyframes pulse-ring {
          0% {
            transform: scale(0.8);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.8);
            opacity: 0;
          }
        }
        @keyframes radar {
          0% {
            transform: scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes popup-fade-in {
          from {
            opacity: 0;
            transform: translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .leaflet-popup-content-wrapper {
          padding: 0 !important;
          border-radius: 20px !important;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5) !important;
          background: ${theme === 'dark' ? '#0f172a' : '#ffffff'} !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
          min-width: 300px !important;
          animation: popup-fade-in 0.3s ease-out;
        }
        .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .leaflet-popup-tip {
          background: ${mapBgColor} !important;
          border: none !important;
          box-shadow: none !important;
        }
        .leaflet-container {
          font-family: inherit;
          background: ${mapBgColor};
        }
        .leaflet-control-zoom {
          border: none !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3) !important;
          border-radius: 16px !important;
          overflow: hidden;
          backdrop-filter: blur(20px);
        }
        .leaflet-control-zoom a {
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'} !important;
          color: ${theme === 'dark' ? 'white' : '#1f2937'} !important;
          border: none !important;
          border-bottom: 1px solid ${theme === 'dark' ? 'rgba(148, 163, 184, 0.2)' : 'rgba(0, 0, 0, 0.1)'} !important;
          width: 40px !important;
          height: 40px !important;
          line-height: 40px !important;
          font-weight: 900 !important;
          transition: all 0.2s !important;
        }
        .leaflet-control-zoom a:last-child {
          border-bottom: none !important;
        }
        .leaflet-control-zoom a:hover {
          background: rgba(16, 185, 129, 0.9) !important;
          transform: scale(1.05);
        }
        .leaflet-control-attribution {
          background: ${theme === 'dark' ? 'rgba(15, 23, 42, 0.8)' : 'rgba(255, 255, 255, 0.9)'} !important;
          color: ${theme === 'dark' ? '#94a3b8' : '#4b5563'} !important;
          backdrop-filter: blur(10px);
          padding: 4px 10px !important;
          font-size: 10px !important;
          border-radius: 10px 0 0 0 !important;
        }
        .leaflet-control-attribution a {
          color: #10b981 !important;
        }
        .leaflet-popup-close-button {
          display: none !important;
        }
      `}</style>

      <MapContainer
        center={pusatPeta}
        zoom={zoomPeta}
        style={{ width: "100%", height: "100%", minHeight: "680px" }}
        scrollWheelZoom={true}
        zoomControl={false}
      >
        <MapController center={pusatPeta} zoom={zoomPeta} />

        {/* Lapisan gambar peta yang mengikuti tema terang atau gelap. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />

        {/* Marker posisi pengguna jika GPS berhasil dibaca. */}
        {lokasiSaya && (
          <Marker position={lokasiSaya} icon={ikonGpsSaya}>
            <Popup>
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-4 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">Your Location</p>
                    <p className="text-sm font-black">Lokasi Anda Saat Ini</p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Satu marker untuk setiap makanan yang memiliki koordinat valid. */}
        {daftarPangan.map((item) => {
          const lat = Number(item.latitude);
          const lng = Number(item.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          const numTier = dapatkanNomorTier(item.kategori_tier);
          const config = getTierConfig(numTier);
          if (!config) return null;
          
          const isSelected = itemTerpilih?.id === item.id;

          return (
            <Marker
              key={item.id}
              position={[lat, lng]}
              icon={buatIkonTier(numTier, isSelected)}
              eventHandlers={{
                click: () => setItemTerpilih(item),
              }}
            >
              <Popup>
                <div className={theme === 'dark' ? 'bg-slate-900 text-white font-sans' : 'bg-white text-slate-900 font-sans'}>
                  {/* Header popup memakai warna sesuai tier makanan. */}
                  <div className={`bg-gradient-to-br ${config.gradien} p-4 relative overflow-hidden`}>
                    {/* Efek kilau pada bagian header popup. */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 translate-x-[-100%] animate-[shine_3s_linear_infinite]" 
                      style={{
                        background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                        backgroundSize: '200% 100%',
                      }}
                    />
                    
                    {/* Label tier dan ikon jalur distribusi. */}
                    <div className="flex items-start justify-between mb-3 relative">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          {numTier === 1 ? <PopupIcon.Toko /> : numTier === 2 ? <PopupIcon.Sosial /> : <PopupIcon.Listrik />}
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-white/80 uppercase tracking-widest">
                            Alokasi Pangan
                          </p>
                          <p className="text-sm font-black text-white">{config.label} · {config.sublabel}</p>
                        </div>
                      </div>
                    </div>

                    {/* Nama makanan yang tersedia di lokasi tersebut. */}
                    <h4 className="text-xl font-black leading-tight text-white relative">
                      {item.nama_makanan}
                    </h4>
                  </div>

                  {/* Detail lokasi, volume, harga, dan tombol tindakan. */}
                  <div className={`p-4 space-y-3 ${theme === 'dark' ? '' : 'bg-slate-50'}`}>
                    {/* Penjelasan singkat tentang jalur tier ini. */}
                    <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      {config.description}
                    </p>

                    {/* Informasi utama makanan dan alamat merchant. */}
                    <div className="space-y-2 pt-2">
                      <div className="flex items-start gap-2.5 text-xs">
                        <div className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'}`}>
                          <PopupIcon.Pin />
                        </div>
                        <div className="flex-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wider mb-0.5 ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                            Alamat
                          </p>
                          <p className={`font-medium leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                            {item.alamat_resto || "Alamat Restoran Kemitraan"}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className={`rounded-xl p-2.5 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className="text-emerald-400">
                              <PopupIcon.Berat />
                            </div>
                            <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              Volume
                            </p>
                          </div>
                          <p className={`text-lg font-black tabular-nums ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                            {item.stok_tersedia}
                            <span className={`text-xs font-semibold ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Kg</span>
                          </p>
                        </div>

                        <div className={`rounded-xl p-2.5 ${theme === 'dark' ? 'bg-slate-800/60' : 'bg-slate-100'}`}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <div className={config.text}>
                              {numTier === 1 ? <PopupIcon.Rupiah /> : <PopupIcon.Hadiah />}
                            </div>
                            <p className={`text-[9px] font-bold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                              {numTier === 1 ? 'Harga' : 'Status'}
                            </p>
                          </div>
                          <p className={`text-lg font-black tabular-nums ${config.text}`}>
                            {numTier === 1 
                              ? `Rp ${(Number(item.harga_diskon) || 0).toLocaleString("id-ID")}`
                              : 'Gratis'
                            }
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tombol untuk membuka rute atau menyalin koordinat. */}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() =>
                          window.open(
                            `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
                            "_blank"
                          )
                        }
                        className={`flex-1 py-3 px-4 bg-gradient-to-r ${config.gradien} hover:opacity-90 text-white font-black text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95`}
                      >
                        <PopupIcon.Navigate />
                        <span>Buka Rute</span>
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(`${lat}, ${lng}`);
                        }}
                        className={`py-3 px-3 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95 ${theme === 'dark' ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border border-slate-300'}`}
                        title="Salin Koordinat"
                      >
                        <PopupIcon.External />
                      </button>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}