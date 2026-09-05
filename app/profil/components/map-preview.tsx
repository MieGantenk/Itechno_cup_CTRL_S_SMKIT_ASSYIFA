'use client';

import { MapContainer, TileLayer, Marker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const pin = L.divIcon({
  className: '',
  html: `<div style="background:#10b981;width:16px;height:16px;border-radius:9999px;box-shadow:0 0 0 5px rgba(16,185,129,.25),0 0 18px rgba(16,185,129,.65)"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function MapPreview({ lat, lng }: { lat: number; lng: number }) {
  return (
    <MapContainer center={[lat, lng]} zoom={15} zoomControl={false} className="h-52 w-full rounded-2xl">
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
        crossOrigin="anonymous"
      />
      <ZoomControl position="bottomright" />
      <Marker position={[lat, lng]} icon={pin} />
    </MapContainer>
  );
}