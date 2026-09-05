"use client";


// import
import React, { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider"; 
import { Sun, Moon } from "lucide-react";

interface PropsTombolTema {
  ringkas?: boolean;
}

export function ThemeToggle({ ringkas = false }: PropsTombolTema) {
  // Tema baru dibaca setelah komponen tampil supaya server dan browser tidak berbeda.
  const { setTheme, resolvedTheme } = useTheme();
  const [sudahMuat, aturSudahMuat] = useState(false);

  useEffect(() => {
    aturSudahMuat(true);
  }, []);

  // Sementara menunggu browser siap, tampilkan bentuk tombolnya dulu.
  if (!sudahMuat) {
    return (
      <div 
        className={`rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 animate-pulse shrink-0 ${
          ringkas ? "w-10 h-10" : "w-20 h-11"
        }`} 
      />
    );
  }

  const dalamModeGelap = resolvedTheme === "dark";

  // Tombol ini sengaja berganti langsung antara terang dan gelap.
  const toggleTema = () => {
    setTheme(dalamModeGelap ? "light" : "dark");
  };

  // Di layar kecil cukup tampilkan tombol ikon agar hemat tempat.
  if (ringkas) {
    return (
      <button
        onClick={toggleTema}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm transition-all duration-500 hover:scale-105 hover:border-emerald-400 dark:hover:border-emerald-500 active:scale-95 shrink-0 cursor-pointer"
        title="Ganti Mode Terang / Gelap"
        aria-label="Tombol Tema"
      >
        {dalamModeGelap ? (
          <Moon className="w-5 h-5 text-cyan-400" aria-hidden="true" />
        ) : (
          <Sun className="w-5 h-5 text-amber-500" aria-hidden="true" />
        )}
      </button>
    );
  }

  // Di layar besar, posisi tombol menunjukkan tema yang sedang aktif.
  return (
    <button
      onClick={toggleTema}
      className="relative inline-flex items-center w-20 h-11 rounded-full border border-slate-200 dark:border-slate-800 bg-linear-to-r from-sky-50 to-amber-50 dark:from-slate-900 dark:to-slate-800 shadow-inner transition-colors duration-500 ease-in-out active:scale-95 shrink-0 cursor-pointer overflow-hidden"
      title="Ganti Mode Terang / Gelap"
      aria-label="Tombol Tema"
    >
      {/* Background indicator matahari/bulan */}
      <div className="absolute inset-0 flex items-center justify-between px-2.5 pointer-events-none">
        <Sun className="w-3.5 h-3.5 text-amber-500" />
        <Moon className="w-3.5 h-3.5 text-cyan-400" />
      </div>

      {/* Tombol sliding */}
      <span
        className={`absolute left-1 top-1 flex h-9 w-9 transform items-center justify-center rounded-full bg-white dark:bg-slate-800 shadow-md transition-transform duration-500 ease-in-out ${
          dalamModeGelap ? "translate-x-9" : "translate-x-0"
        }`}
      >
        {dalamModeGelap ? (
          <Moon className="h-4 w-4 text-cyan-400" />
        ) : (
          <Sun className="h-4 w-4 text-amber-500" />
        )}
      </span>
    </button>
  );
}