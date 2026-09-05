"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";

export interface LokasiPanganPeta {
  id: string | number;
  namaMakanan: string;
  namaResto: string;
  tier: "tier1" | "tier2" | "tier3";
  lintang: number;
  bujur: number;
  jarakKm: number;
}

export interface PropsPetaKonsumen<T extends LokasiPanganPeta> {
  daftarPangan: T[];
  lokasiKonsumen: [number, number];
  radiusKm: number;
  pusatPeta: [number, number];
  zoomPeta: number;
  itemTerpilih: T | null;
  onPilihItem: (item: T) => void;
  onKlikPeta: (lat: number, lng: number) => void;
  theme?: string;
}

// Menggeser kamera dengan animasi saat pusat peta berubah.
function KontrolKamera({ pusat, zoom }: { pusat: [number, number]; zoom: number }) {
  const map = useMap();

  useEffect(() => {
    if (!Number.isFinite(pusat[0]) || !Number.isFinite(pusat[1])) return;
    const timer = window.setTimeout(() => {
      if (map.getContainer()) map.flyTo(pusat, zoom, { duration: 1.2, easeLinearity: 0.25 });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [map, pusat, zoom]);

  return null;
}

// Komponen kecil ini menangkap klik peta tanpa menambah elemen visual.
function PenangkapKlikPeta({ onKlik }: { onKlik: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onKlik(event.latlng.lat, event.latlng.lng) });
  return null;
}

const konfigurasiTier = {
  tier1: { warna: "#f59e0b", glow: "rgba(245,158,11,.6)", label: "Tier 1", sub: "Surplus Marketplace", ikon: "🛍" },
  tier2: { warna: "#10b981", glow: "rgba(16,185,129,.6)", label: "Tier 2", sub: "Donasi Sosial", ikon: "♥" },
  tier3: { warna: "#06b6d4", glow: "rgba(6,182,212,.6)", label: "Tier 3", sub: "Konversi Bio-Energi", ikon: "⚡" },
};

// Ikon marker dibuat berbeda supaya jenis surplus mudah dibedakan di peta.
function buatIkonTier(tier: LokasiPanganPeta["tier"], dipilih: boolean) {
  const config = konfigurasiTier[tier];
  const ukuran = dipilih ? 54 : 42;
  const dalam = dipilih ? 30 : 24;
  return L.divIcon({
    className: "custom-marker-konsumen",
    html: `<div style="position:relative;width:${ukuran}px;height:${ukuran}px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;inset:0;border-radius:50%;background:${config.glow};animation:pulse-ring-konsumen 2s ease-out infinite;opacity:${dipilih ? 1 : .5}"></div><div style="position:relative;width:${dalam}px;height:${dalam}px;border-radius:50%;background:${config.warna};border:3px solid white;box-shadow:0 4px 16px ${config.glow};display:flex;align-items:center;justify-content:center;color:white;font-size:14px">${config.ikon}</div></div>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran / 2],
    popupAnchor: [0, -ukuran / 2 + 4],
  });
}

const ikonLokasiKonsumen = L.divIcon({
  className: "custom-marker-konsumen",
  html: `<div style="position:relative;width:56px;height:56px;display:flex;align-items:center;justify-content:center"><div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,.4);animation:radar-konsumen 2s ease-out infinite"></div><div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 4px 14px rgba(59,130,246,.6)"></div></div>`,
  iconSize: [56, 56],
  iconAnchor: [28, 28],
});

export default function PetaKonsumenCore<T extends LokasiPanganPeta>({
  daftarPangan, lokasiKonsumen, radiusKm, pusatPeta, zoomPeta, itemTerpilih, onPilihItem, onKlikPeta, theme = "light",
}: PropsPetaKonsumen<T>) {
  // Tile dan warna popup mengikuti tema halaman saat ini.
  const warnaDasar = theme === "dark" ? "#0f172a" : "#fff";
  const urlTile = theme === "dark"
    ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
    : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  return (
    <div className="w-full h-full min-h-[520px] rounded-2xl overflow-hidden relative z-10">
      <style>{`@keyframes pulse-ring-konsumen{0%{transform:scale(.8);opacity:.8}100%{transform:scale(1.9);opacity:0}}@keyframes radar-konsumen{0%{transform:scale(.5);opacity:.8}100%{transform:scale(2);opacity:0}}.leaflet-popup-content-wrapper{padding:0!important;border-radius:18px!important;overflow:hidden;background:${warnaDasar}!important}.leaflet-popup-content{margin:0!important;min-width:260px!important}.leaflet-popup-tip{background:${warnaDasar}!important}.leaflet-popup-close-button{display:none!important}.leaflet-container{font-family:inherit;background:${warnaDasar}}.custom-marker-konsumen{background:transparent!important;border:none!important}.leaflet-control-zoom a{background:${theme === "dark" ? "rgba(15,23,42,.9)" : "rgba(255,255,255,.95)"}!important;color:${theme === "dark" ? "#fff" : "#1f2937"}!important}`}</style>
      <MapContainer center={pusatPeta} zoom={zoomPeta} scrollWheelZoom style={{ width: "100%", height: "100%", minHeight: "520px" }}>
        <KontrolKamera pusat={pusatPeta} zoom={zoomPeta} />
        <PenangkapKlikPeta onKlik={onKlikPeta} />
        <TileLayer attribution='&copy; OpenStreetMap &copy; CARTO' url={urlTile} />
        <Circle center={lokasiKonsumen} radius={radiusKm * 1000} pathOptions={{ color: "#10b981", weight: 2, dashArray: "8 6", fillColor: "#10b981", fillOpacity: 0.07 }} />
        <Marker position={lokasiKonsumen} icon={ikonLokasiKonsumen} zIndexOffset={500}>
          <Popup><div className="p-4"><p className="text-[10px] font-black uppercase text-blue-500">Lokasi Anda</p><p className="text-sm font-black mt-1">Titik Konsumen</p><p className="text-[11px] text-slate-500 mt-1">Radius pencarian: {radiusKm} km</p></div></Popup>
        </Marker>
        {/* Tampilkan semua makanan yang masuk dalam radius pencarian. */}
        {daftarPangan.map((item) => {
          const config = konfigurasiTier[item.tier];
          return (
            <Marker key={item.id} position={[item.lintang, item.bujur]} icon={buatIkonTier(item.tier, item.id === itemTerpilih?.id)} eventHandlers={{ click: () => onPilihItem(item) }}>
              <Popup>
                <div className="font-sans bg-white text-slate-900">
                  <div className="p-4" style={{ background: `linear-gradient(135deg, ${config.warna}, ${config.warna}dd)` }}><p className="text-[10px] font-black uppercase text-white/75">{config.label} · {config.sub}</p><h4 className="text-base font-black text-white mt-2">{item.namaMakanan}</h4></div>
                  <div className="p-4 space-y-3 bg-slate-50"><p className="text-[11px] font-bold text-slate-600">{item.namaResto}</p><p className="text-[11px] font-black text-emerald-600">{item.jarakKm.toFixed(1)} km dari lokasi Anda</p><div className="flex gap-2"><button onClick={() => onPilihItem(item)} className="flex-1 py-2.5 text-[11px] font-black rounded-xl text-white" style={{ backgroundColor: config.warna }}>Lihat Detail</button><button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${item.lintang},${item.bujur}`, "_blank")} className="px-3 py-2.5 rounded-xl bg-slate-200 text-[11px] font-black" title="Buka Rute">↗</button></div></div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
