'use client';

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Import CSS bawaan Leaflet
import 'leaflet/dist/leaflet.css';

// URL ikon ditulis manual karena Next.js tidak selalu menemukan aset Leaflet sendiri.
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export interface LokasiKemitraan {
  id: string;
  nama: string;
  alamat: string;
  lat: number;
  lng: number;
  tier: string;
  kuantitas: string;
  harga: string;
}

interface PropsPeta {
  daftarLokasi: LokasiKemitraan[];
}

export default function PetaGratis({ daftarLokasi }: PropsPeta) {
  const [isClient, setIsClient] = useState(false);

  // Leaflet membutuhkan window, jadi peta baru dirender setelah masuk ke browser.
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 rounded-3xl border border-slate-800">
        <span>Memuat Peta Spasial...</span>
      </div>
    );
  }

  // Mulai dari lokasi pertama; jika belum ada data, gunakan titik tengah Jakarta.
  const posisiPusat: [number, number] = daftarLokasi.length > 0 
    ? [daftarLokasi[0].lat, daftarLokasi[0].lng] 
    : [-6.2088, 106.8456];

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative z-10">
      <MapContainer 
        center={posisiPusat} 
        zoom={10} 
        style={{ width: '100%', height: '100%' }}
        scrollWheelZoom={true}
      >
        {/* Lapisan gambar peta yang menjadi latar belakang. */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {/* Setiap lokasi kemitraan ditampilkan sebagai satu marker. */}
        {daftarLokasi.map((item) => (
          <Marker 
            key={item.id} 
            position={[item.lat, item.lng]} 
            icon={customIcon}
          >
            <Popup>
              <div className="p-1 text-slate-900 max-w-xs">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  {item.tier}
                </span>
                <h4 className="font-bold text-sm mt-1">{item.nama}</h4>
                <p className="text-xs text-slate-600 mt-1">{item.alamat}</p>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between text-xs font-semibold">
                  <span>Vol: {item.kuantitas}</span>
                  <span className="text-emerald-700">{item.harga}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}