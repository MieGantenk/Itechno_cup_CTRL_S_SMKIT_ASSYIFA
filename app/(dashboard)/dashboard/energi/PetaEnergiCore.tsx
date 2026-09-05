"use client";

import { useEffect } from "react";
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { LokasiLimbah } from "./page";

// Props ini menghubungkan peta dengan lokasi fasilitas dan daftar limbah.
type PropsPetaEnergi = {
  daftarLimbah: LokasiLimbah[];
  lokasiFasilitas: [number, number];
  radiusKm: number;
  pusatPeta: [number, number];
  zoomPeta: number;
  itemTerpilih?: LokasiLimbah | null;
  onPilihItem: (item: LokasiLimbah) => void;
  onKlikPeta: (lat: number, lng: number) => void;
  theme?: string;
};

function KontrolKamera({ pusat, zoom }: { pusat: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isFinite(pusat[0]) || !Number.isFinite(pusat[1])) return;

    const container = map.getContainer();
    if (!container?.isConnected) return;

    try {
      // Hentikan animasi lama agar tidak berjalan saat komponen sedang ditutup.
      map.stop();
      map.setView(pusat, zoom, { animate: false });
    } catch (error) {
      console.warn("Pembaruan kamera peta dibatalkan:", error);
    }
  }, [map, pusat, zoom]);
  return null;
}

function PenangkapKlik({ onKlik }: { onKlik: (lat: number, lng: number) => void }) {
  useMapEvents({ click: ({ latlng }) => onKlik(latlng.lat, latlng.lng) });
  return null;
}

const ikonFasilitas = L.divIcon({
  className: "marker-energi",
  html: '<div class="marker-energi-ring"><div class="marker-energi-dot">&#9889;</div></div>',
  iconSize: [52, 52],
  iconAnchor: [26, 26],
});

// Marker limbah membesar saat item dipilih dari daftar.
function buatIkonLimbah(dipilih: boolean) {
  const ukuran = dipilih ? 46 : 38;
  return L.divIcon({
    className: "marker-limbah",
    html: `<div class="marker-limbah-dot${dipilih ? " selected" : ""}">&#9851;</div>`,
    iconSize: [ukuran, ukuran],
    iconAnchor: [ukuran / 2, ukuran / 2],
  });
}

export default function PetaEnergiCore({
  daftarLimbah, lokasiFasilitas, radiusKm, pusatPeta, zoomPeta,
  itemTerpilih = null, onPilihItem, onKlikPeta, theme = "light",
}: PropsPetaEnergi) {
  // Tema menentukan tile dan warna latar peta.
  const gelap = theme === "dark";
  const tileUrl = gelap ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
  return (
    <div className="w-full h-full min-h-[520px] overflow-hidden rounded-2xl">
      <style>{`.marker-energi,.marker-limbah{background:transparent;border:0}.marker-energi-ring{width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:rgba(6,182,212,.25);box-shadow:0 0 0 8px rgba(6,182,212,.12);animation:energi-pulse 2s ease-in-out infinite}.marker-energi-dot{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:linear-gradient(135deg,#06b6d4,#2563eb);border:3px solid white;color:white;font-size:14px;box-shadow:0 5px 16px rgba(8,145,178,.5)}.marker-limbah-dot{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:#10b981;border:3px solid white;color:white;font-size:14px;box-shadow:0 4px 12px rgba(16,185,129,.45);transition:transform .2s}.marker-limbah-dot.selected{transform:scale(1.25);background:#0891b2}@keyframes energi-pulse{50%{transform:scale(1.08);opacity:.8}}.leaflet-popup-content-wrapper{border-radius:16px!important;background:${gelap ? "#0f172a" : "white"}!important;color:${gelap ? "white" : "#0f172a"}!important}.leaflet-popup-tip{background:${gelap ? "#0f172a" : "white"}!important}.leaflet-popup-content{margin:14px!important;min-width:210px}.leaflet-container{font-family:inherit;background:${gelap ? "#0f172a" : "#f8fafc"}}`}</style>
      <MapContainer center={pusatPeta} zoom={zoomPeta} scrollWheelZoom style={{ width: "100%", height: "100%", minHeight: "520px" }}>
        <KontrolKamera pusat={pusatPeta} zoom={zoomPeta} />
        <PenangkapKlik onKlik={onKlikPeta} />
        <TileLayer url={tileUrl} attribution='&copy; OpenStreetMap &copy; CARTO' />
        {/* Lingkaran ini menunjukkan radius pencarian fasilitas. */}
        <Circle center={lokasiFasilitas} radius={radiusKm * 1000} pathOptions={{ color: "#06b6d4", fillColor: "#06b6d4", fillOpacity: 0.08, dashArray: "8 6" }} />
        <Marker position={lokasiFasilitas} icon={ikonFasilitas} zIndexOffset={500}>
          <Popup><strong>Fasilitas Energi</strong><br />Pusat radius pencarian {radiusKm} km</Popup>
        </Marker>
        {/* Tampilkan marker untuk setiap limbah yang ditemukan. */}
        {daftarLimbah.map((item) => {
          const dipilih = itemTerpilih?.id === item.id;
          return <Marker key={item.id} position={[item.lintang, item.bujur]} icon={buatIkonLimbah(dipilih)} eventHandlers={{ click: () => onPilihItem(item) }}>
            <Popup><strong>{item.namaMakanan}</strong><div>{item.namaResto}</div><div>{item.stokTersedia} kg tersedia</div><button type="button" onClick={() => onPilihItem(item)} className="mt-2 rounded-lg bg-cyan-600 px-3 py-1.5 text-xs font-bold text-white">Jadwalkan Pickup</button></Popup>
          </Marker>;
        })}
      </MapContainer>
    </div>
  );
}