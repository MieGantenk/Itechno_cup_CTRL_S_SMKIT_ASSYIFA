"use client";

import * as React from "react";

// Tiga pilihan ini mengikuti tema yang bisa dipilih pengguna.
type Theme = "light" | "dark" | "system";

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  attribute?: string;
  enableSystem?: boolean;
  disableTransitionOnChange?: boolean;
}

interface ThemeProviderContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeProviderContext = React.createContext<ThemeProviderContextType>({
  theme: "light",
  setTheme: () => null,
  resolvedTheme: "light",
});

export function ThemeProvider({
  children,
  defaultTheme = "light",
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = React.useState<"light" | "dark">("light");

  // Ambil pilihan terakhir pengguna agar tema tidak kembali ke default setiap buka halaman.
  React.useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "system") {
      setThemeState(stored);
    }
  }, []);

  // Ubah class pada elemen HTML supaya Tailwind ikut mengganti warna halaman.
  React.useEffect(() => {
    const root = window.document.documentElement;
    let resolved: "light" | "dark" = "light";

    // Kalau memilih system, ikuti pengaturan gelap/terang dari perangkat.
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      resolved = systemTheme;
    } else {
      resolved = theme;
    }

    // Saat diminta, matikan transisi sebentar agar pergantian warna terasa rapi.
    if (disableTransitionOnChange) {
      const style = document.createElement("style");
      style.appendChild(
        document.createTextNode(
          `*, *::before, *::after { transition: none !important; }`
        )
      );
      document.head.appendChild(style);
      
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
      
      window.getComputedStyle(style).opacity;
      
      document.head.removeChild(style);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(resolved);
      root.style.colorScheme = resolved;
    }

    setResolvedTheme(resolved);
    localStorage.setItem("theme", theme);
  }, [theme, disableTransitionOnChange]);

  // Perbarui tampilan jika pengaturan tema perangkat berubah saat aplikasi terbuka.
  React.useEffect(() => {
    if (theme !== "system") return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      const newResolved = e.matches ? "dark" : "light";
      setResolvedTheme(newResolved);
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(newResolved);
      root.style.colorScheme = newResolved;
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  const setTheme = React.useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
  }, []);

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};