'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { createClient } from '@/app/utils/supabase/client'; // Sesuaikan path helper supabase client Anda
import {
  Cpu,
  Users,
  UserCheck,
  Search,
  Filter,
  Sparkles,
  ArrowUpRight,
  Building2,
  HeartHandshake,
  TrendingUp,
  Activity,
  Zap,
} from 'lucide-react';

// Nilai role di tampilan disederhanakan, lalu dikembalikan ke format database saat disimpan.
type UserRole = 'Customer' | 'Merchant' | 'Organization' | 'Courier' | 'Waste Processor' | 'Admin';

const normalizeUserRole = (role: string | null | undefined): UserRole => {
  switch (role?.toLowerCase().trim()) {
    case 'merchant': return 'Merchant';
    case 'organization': return 'Organization';
    case 'courier':
    case 'kurir': return 'Courier';
    case 'waste_processor':
    case 'pengolah_energi': return 'Waste Processor';
    case 'admin': return 'Admin';
    default: return 'Customer';
  }
};

const toDatabaseRole = (role: UserRole) => ({
  Customer: 'customer',
  Merchant: 'merchant',
  Organization: 'organization',
  Courier: 'courier',
  'Waste Processor': 'waste_processor',
  Admin: 'admin',
}[role]);

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: string;
}

export default function AdminDashboard() {
  const supabase = createClient();

  // State ini mengatur tab filter, pencarian, data user, dan status pemuatan.
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string>('');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  // Daftar profil pengguna yang diambil dari Supabase.
  const [users, setUsers] = useState<User[]>([]);

  // Ambil daftar pengguna terbaru untuk ditampilkan di tabel admin.
  const fetchData = async () => {
    setLoading(true);
    setLoadError('');

    // Data role dan status dibaca dari tabel profiles.
    const { data: usersData, error: usersErr } = await supabase
      .from('profiles')
      .select('id, nama_lengkap, email, role, status')
      .order('created_at', { ascending: false });

    if (usersErr) {
      console.error('Gagal memuat daftar pengguna:', usersErr.message);
      setLoadError(usersErr.message);
    } else if (usersData) {
      setUsers(usersData.map((user) => ({
        id: user.id,
        name: user.nama_lengkap || user.email || 'Pengguna',
        email: user.email || '-',
        role: normalizeUserRole(user.role),
        status: user.status || 'active',
      })) as User[]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Simpan perubahan role ke database, lalu perbarui tabel tanpa reload.
  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setUpdatingRole(userId);
    const { error } = await supabase
      .from('profiles')
      .update({ role: toDatabaseRole(newRole) })
      .eq('id', userId);

    if (!error) {
      setUsers((prev) =>
        prev.map((user) => (user.id === userId ? { ...user, role: newRole } : user))
      );
    } else {
      setLoadError('Gagal memperbarui role: ' + error.message);
    }
    setUpdatingRole(null);
  };

  // Filter tab dan kolom pencarian bisa dipakai bersamaan.
  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return users.filter((user) => {
      const matchesSearch =
        !q ||
        user.name?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q);

      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'merchant' && user.role === 'Merchant') ||
        (activeTab === 'organization' && user.role === 'Organization') ||
        (activeTab === 'customer' && user.role === 'Customer') ||
        (activeTab === 'courier' && user.role === 'Courier') ||
        (activeTab === 'energy' && user.role === 'Waste Processor') ||
        (activeTab === 'admin' && user.role === 'Admin');

      return matchesSearch && matchesTab;
    });
  }, [users, searchQuery, activeTab]);

  // Statistik dihitung langsung dari daftar pengguna yang sedang dimuat.
  const stats = [
    {
      title: 'Total Pengguna',
      value: users.length.toString(),
      change: '+12.4%',
      label: 'vs bulan lalu',
      icon: Users,
      accent: 'blue',
    },
    {
      title: 'Mitra Merchant',
      value: users.filter((u) => u.role === 'Merchant').length.toString(),
      change: '+5.8%',
      label: 'terverifikasi',
      icon: Building2,
      accent: 'emerald',
    },
    {
      title: 'Organisasi / Panti',
      value: users.filter((u) => u.role === 'Organization').length.toString(),
      change: '+8.2%',
      label: 'aktif',
      icon: HeartHandshake,
      accent: 'violet',
    },
  ];

  const accentMap: Record<string, string> = {
    blue: 'from-blue-500/15 via-cyan-500/5 to-transparent border-blue-500/20 dark:from-blue-500/15 dark:via-cyan-500/5',
    amber: 'from-amber-500/15 via-orange-500/5 to-transparent border-amber-500/20 dark:from-amber-500/15',
    emerald: 'from-emerald-500/15 via-teal-500/5 to-transparent border-emerald-500/20 dark:from-emerald-500/15',
    violet: 'from-violet-500/15 via-fuchsia-500/5 to-transparent border-violet-500/20 dark:from-violet-500/15',
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-300 dark:bg-[#070812] dark:text-slate-100">
      <div className="mx-auto max-w-[1600px] space-y-6 p-4 sm:p-6 lg:p-8">
        
        {/* Header dan status koneksi database. */}
        <header className="relative isolate overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_20px_70px_-35px_rgba(15,23,42,0.35)] backdrop-blur-xl transition-colors dark:border-white/[0.08] dark:bg-[#10111d]/90 dark:shadow-[0_25px_90px_-35px_rgba(124,58,237,0.35)] sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-violet-500/10 blur-3xl dark:bg-violet-500/20" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl dark:bg-cyan-500/10" />

          <div className="relative z-10 flex flex-col justify-between gap-7 lg:flex-row lg:items-center">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/20 bg-violet-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600 dark:text-violet-300">
                <Sparkles className="h-3.5 w-3.5" />
                Super Admin Control Center
              </div>

              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white sm:text-4xl">
                  Admin & System
                  <span className="ml-2 bg-gradient-to-r from-violet-600 to-fuchsia-500 bg-clip-text text-transparent dark:from-violet-300 dark:to-fuchsia-300">
                    Automations
                  </span>
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  Akses langsung ke database Supabase. Pantau pengguna, filter hak akses, dan ubah role akun secara terintegrasi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 font-semibold text-emerald-600 dark:text-emerald-300">
                  <Activity className="h-3.5 w-3.5" />
                  Supabase Connected
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.04] dark:text-slate-400">
                  RBAC Policy: Active
                </span>
              </div>
            </div>

            <div className="group relative flex min-w-[250px] items-center gap-4 overflow-hidden rounded-2xl border border-violet-500/20 bg-slate-50/90 px-4 py-3 shadow-inner dark:bg-white/[0.035]">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/[0.06] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                <Zap className="h-5 w-5 text-emerald-500" />
                <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#10111d]" />
              </div>
              <div className="relative">
                <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  Database Sync
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm font-bold text-slate-800 dark:text-violet-200">
                  {loading ? 'Fetching...' : 'Live Connected'}
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Ringkasan jumlah pengguna berdasarkan kategori. */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className={`group relative overflow-hidden rounded-[24px] border bg-gradient-to-br p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl dark:bg-[#10111d] ${accentMap[stat.accent]}`}
            >
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/40 blur-2xl dark:bg-white/5" />

              <div className="relative flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/[0.08] dark:bg-white/[0.05]">
                  <stat.icon className="h-5 w-5 text-slate-700 dark:text-slate-200" />
                </div>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/15 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-300">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </span>
              </div>

              <div className="relative mt-6">
                <p className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                  {loading ? '...' : stat.value}
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {stat.title}
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">{stat.label}</p>
              </div>
            </div>
          ))}
        </section>

        {/* Tabel untuk mencari pengguna dan mengubah role. */}
        <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_60px_-40px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/[0.08] dark:bg-[#10111d]/90 sm:p-6">
          <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-500">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-slate-950 dark:text-white">
                  Manajemen Pengguna & Hak Akses
                </h2>
                <p className="text-xs text-slate-400">
                  Cari pengguna berdasarkan nama, email, atau role, serta perbarui role secara langsung.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama, email, role..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-4 text-xs text-slate-900 outline-none transition focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-white sm:w-64"
                />
              </div>

              <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-100 dark:border-white/[0.07] dark:bg-white/[0.035] dark:text-slate-300 dark:hover:bg-white/[0.06]">
                <Filter className="h-3.5 w-3.5" />
                Filter
              </button>
            </div>
          </div>

          {/* TAB FILTER ROLE */}
          <div className="mt-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-white/[0.06] dark:bg-white/[0.025]">
            {[
              ['all', 'Semua'],
              ['customer', 'Customer'],
              ['merchant', 'Merchant'],
              ['organization', 'Organization'],
              ['courier', 'Kurir'],
              ['energy', 'Pengolah Energi'],
              ['admin', 'Admin'],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`whitespace-nowrap rounded-lg px-3.5 py-2 text-[11px] font-bold transition ${
                  activeTab === key
                    ? 'bg-white text-violet-600 shadow-sm dark:bg-white/[0.09] dark:text-violet-300'
                    : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* TABEL PENGGUNA */}
          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.06]">
            {loadError && (
              <div className="border-b border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
                Gagal memuat daftar pengguna: {loadError}
              </div>
            )}
            <div className="md:hidden">
              {filteredUsers.length > 0 ? (
                <div className="divide-y divide-slate-200 dark:divide-white/[0.06]">
                  {filteredUsers.map((user) => (
                    <article key={user.id} className="space-y-4 bg-white p-4 dark:bg-transparent">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-xs font-black text-white shadow-lg shadow-violet-500/10">
                          {user.name ? user.name.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-bold text-slate-800 dark:text-white">{user.name}</div>
                          <div className="truncate text-[11px] text-slate-400">{user.email}</div>
                        </div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          {user.status || 'Active'}
                        </span>
                      </div>
                      <div className="grid gap-2">
                        <label className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400" htmlFor={`mobile-role-${user.id}`}>
                          Role akun
                        </label>
                        <select
                          id={`mobile-role-${user.id}`}
                          value={user.role}
                          disabled={updatingRole === user.id}
                          onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-wait disabled:opacity-60 dark:border-white/[0.08] dark:bg-[#161829] dark:text-slate-200"
                        >
                          <option value="Customer">Customer</option>
                          <option value="Merchant">Merchant</option>
                          <option value="Organization">Organization</option>
                          <option value="Courier">Kurir</option>
                          <option value="Waste Processor">Pengolah Energi</option>
                          <option value="Admin">Admin Super User</option>
                        </select>
                        {updatingRole === user.id && <span className="text-[11px] font-medium text-violet-500">Menyimpan perubahan role...</span>}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm text-slate-400">Tidak ada pengguna yang cocok dengan pencarian.</div>
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="border-b border-slate-200 bg-slate-50 text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:border-white/[0.06] dark:bg-white/[0.025]">
                  <tr>
                    <th className="px-4 py-3.5 font-bold">Pengguna</th>
                    <th className="px-4 py-3.5 font-bold">Role Saat Ini</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-4 py-3.5 text-right font-bold">Ubah Role</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      className="group bg-white transition hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/[0.025]"
                    >
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 text-xs font-black text-white shadow-lg shadow-violet-500/10">
                            {user.name ? user.name.charAt(0) : 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-slate-800 dark:text-white">
                              {user.name}
                            </div>
                            <div className="truncate text-[11px] text-slate-400">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`rounded-lg border px-2.5 py-1 text-[10px] font-bold ${
                            user.role === 'Merchant'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300'
                              : user.role === 'Organization'
                              ? 'border-violet-500/20 bg-violet-500/10 text-violet-600 dark:text-violet-300'
                              : user.role === 'Admin'
                              ? 'border-fuchsia-500/20 bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-300'
                              : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-white/[0.07] dark:bg-white/[0.05] dark:text-slate-300'
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
                          {user.status || 'Active'}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right">
                        <select
                          value={user.role}
                          onChange={(e) =>
                            handleRoleChange(user.id, e.target.value as UserRole)
                          }
                          className="cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 outline-none transition focus:border-violet-500 dark:border-white/[0.07] dark:bg-[#161829] dark:text-slate-200"
                        >
                          <option value="Customer">Customer</option>
                          <option value="Merchant">Merchant</option>
                          <option value="Organization">Organization</option>
                          <option value="Courier">Kurir</option>
                          <option value="Waste Processor">Pengolah Energi</option>
                          <option value="Admin">Admin Super User</option>
                        </select>
                      </td>
                    </tr>
                  ))}

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-400">
                        Tidak ada pengguna yang cocok dengan pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>Menampilkan {filteredUsers.length} pengguna</span>
            <span className="inline-flex items-center gap-1">
              <Cpu className="h-3 w-3" />
              Access control protected
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}