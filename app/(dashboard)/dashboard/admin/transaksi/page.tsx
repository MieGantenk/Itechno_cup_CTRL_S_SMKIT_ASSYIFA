'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ClipboardList, Eye, RefreshCw, Search, X } from 'lucide-react';
import { createClient } from '@/app/utils/supabase/client';

type Transaction = Record<string, unknown> & { id?: string | number; status?: string | null };
type Food = Record<string, unknown> & { id?: string | number };
type MerchantGroup = { name: string; transactions: Transaction[] };
const statusOptions = ['semua', 'pending', 'dibayar', 'diproses', 'sedang_diantar', 'diantar', 'selesai', 'dibatalkan'];

const valueText = (value: unknown) => value === null || value === undefined || value === '' ? '-' : typeof value === 'object' ? JSON.stringify(value) : String(value);
const getValue = (row: Transaction, keys: string[]) => {
  const key = keys.find((candidate) => row[candidate] !== undefined && row[candidate] !== null && row[candidate] !== '');
  return key ? valueText(row[key]) : '-';
};
const merchantName = (food?: Food, row?: Transaction) => {
  const name = getValue((food || row || {}) as Transaction, ['merchant_name', 'nama_resto', 'nama_merchant', 'merchant_email', 'merchant_id']);
  return name === '-' ? 'Merchant belum teridentifikasi' : name;
};

export default function AdminTransactionsPage() {
  const supabase = createClient();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [foods, setFoods] = useState<Record<string, Food>>({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('semua');
  const [selected, setSelected] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [error, setError] = useState('');

  const loadRows = async () => {
    setLoading(true); setError('');
    const [{ data, error: loadError }, { data: foodData, error: foodError }] = await Promise.all([
      supabase.from('pesanan').select('*').order('created_at', { ascending: false }),
      supabase.from('makanan_surplus').select('id, nama_makanan, merchant_name, nama_resto, merchant_email, merchant_id, harga_diskon'),
    ]);
    if (loadError) { setError(loadError.message); setRows([]); } else setRows((data || []) as Transaction[]);
    if (foodError) setError((current) => current || `Gagal memuat data makanan: ${foodError.message}`);
    else setFoods(Object.fromEntries(((foodData || []) as Food[]).filter((food) => food.id !== undefined).map((food) => [String(food.id), food])));
    setLoading(false);
  };
  useEffect(() => { loadRows(); }, []);

  const foodFor = (row: Transaction) => foods[String(row.makanan_id)];
  const filteredRows = useMemo(() => rows.filter((row) => {
    const food = foods[String(row.makanan_id)];
    const query = search.toLowerCase().trim();
    const searchable = [row, food].filter(Boolean).map((value) => Object.values(value as object).map(valueText).join(' ')).join(' ').toLowerCase();
    return (!query || searchable.includes(query)) && (statusFilter === 'semua' || row.status?.toLowerCase().trim() === statusFilter);
  }), [rows, foods, search, statusFilter]);
  const groups = useMemo<MerchantGroup[]>(() => {
    const grouped = new Map<string, Transaction[]>();
    filteredRows.forEach((row) => { const name = merchantName(foodFor(row), row); grouped.set(name, [...(grouped.get(name) || []), row]); });
    const allGroups = Array.from(grouped, ([name, transactions]) => ({ name, transactions }));
    return search.trim() ? allGroups : allGroups.slice(0, 10);
  }, [filteredRows, foods, search]);
  const visibleTransactionCount = groups.reduce((total, group) => total + group.transactions.length, 0);

  const changeStatus = async (row: Transaction, status: string) => {
    if (row.id === undefined) return;
    setSavingId(row.id);
    const { error: updateError } = await supabase.from('pesanan').update({ status }).eq('id', row.id);
    if (updateError) setError(`Gagal memperbarui status: ${updateError.message}`);
    else { setRows((current) => current.map((item) => item.id === row.id ? { ...item, status } : item)); setSelected((current) => current?.id === row.id ? { ...current, status } : current); }
    setSavingId(null);
  };
  const detailEntries = selected ? [['nama_merchant', merchantName(foodFor(selected), selected)], ['nama_makanan', getValue((foodFor(selected) || {}) as Transaction, ['nama_makanan'])], ...Object.entries(selected)].filter(([key], index, entries) => entries.findIndex(([entryKey]) => entryKey === key) === index) : [];

  return <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-[#070812] dark:text-slate-100 sm:px-6 lg:px-8"><div className="mx-auto max-w-[1600px] space-y-6">
    <header className="flex flex-col justify-between gap-4 rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-sm dark:border-white/[0.08] dark:bg-[#10111d]/90 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-violet-500"><ClipboardList className="h-4 w-4" /> Audit transaksi</div><h1 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">Riwayat Transaksi</h1><p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Pantau pesanan berdasarkan perusahaan merchant.</p></div><button onClick={loadRows} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:bg-slate-100 disabled:opacity-60 dark:border-white/[0.08] dark:hover:bg-white/[0.06]"><RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} /> Muat ulang</button></header>
    <section className="rounded-[28px] border border-slate-200/80 bg-white/90 p-5 shadow-sm dark:border-white/[0.08] dark:bg-[#10111d]/90 sm:p-6"><div className="flex flex-col gap-3 lg:flex-row"><label className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari perusahaan merchant, makanan, ID, nama, email..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-4 text-sm outline-none focus:border-violet-500 dark:border-white/[0.08] dark:bg-white/[0.035]" /></label><label className="relative lg:w-52"><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold capitalize outline-none focus:border-violet-500 dark:border-white/[0.08] dark:bg-white/[0.035]"><option value="semua">Semua status</option>{statusOptions.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}</select><ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /></label></div>{error && <div className="mt-4 rounded-xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300">{error}</div>}<div className="mt-5 space-y-5">{groups.map((group) => <article key={group.name} className="overflow-hidden rounded-2xl border border-slate-200 dark:border-white/[0.07]"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-white/[0.06] dark:bg-white/[0.025]"><div><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-500">Perusahaan merchant</p><h2 className="mt-1 text-lg font-black">{group.name}</h2></div><span className="rounded-full bg-violet-500/10 px-3 py-1 text-xs font-bold text-violet-600 dark:text-violet-300">{group.transactions.length} transaksi</span></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-sm"><thead className="border-b border-slate-200 text-[10px] uppercase tracking-[0.12em] text-slate-400 dark:border-white/[0.06]"><tr><th className="px-4 py-3">Transaksi</th><th className="px-4 py-3">Makanan</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Detail</th></tr></thead><tbody className="divide-y divide-slate-200 dark:divide-white/[0.05]">{group.transactions.map((row) => <tr key={String(row.id)} className="hover:bg-slate-50 dark:hover:bg-white/[0.025]"><td className="px-4 py-4"><p className="font-bold">#{getValue(row, ['id', 'kode_pesanan', 'order_id'])}</p><p className="text-xs text-slate-400">{getValue(row, ['created_at', 'tanggal_pesanan'])}</p></td><td className="px-4 py-4 font-semibold">{getValue((foodFor(row) || {}) as Transaction, ['nama_makanan'])}</td><td className="px-4 py-4">{getValue(row, ['customer_name', 'nama_customer', 'user_name', 'customer_email', 'customer_id'])}</td><td className="px-4 py-4"><select value={row.status || ''} disabled={savingId === row.id} onChange={(event) => changeStatus(row, event.target.value)} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs font-bold capitalize dark:border-white/[0.08] dark:bg-[#161829]"><option value="">Tanpa status</option>{statusOptions.slice(1).map((status) => <option key={status} value={status}>{status}</option>)}</select></td><td className="px-4 py-4 text-right"><button onClick={() => setSelected(row)} aria-label="Lihat detail transaksi" className="inline-flex rounded-lg p-2 text-violet-500 hover:bg-violet-500/10"><Eye className="h-4 w-4" /></button></td></tr>)}</tbody></table></div></article>)}{!loading && groups.length === 0 && <div className="px-4 py-12 text-center text-slate-400">Tidak ada transaksi yang cocok.</div>}{loading && <div className="px-4 py-12 text-center text-slate-400">Memuat transaksi...</div>}</div><p className="mt-4 text-xs text-slate-400">Menampilkan {visibleTransactionCount} transaksi dalam {groups.length} perusahaan dari {filteredRows.length} transaksi cocok. Maksimal 10 perusahaan ditampilkan; gunakan pencarian untuk perusahaan lainnya.</p></section>
  </div>{selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}><div className="max-h-[85vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-white/[0.08] dark:bg-[#111320]" onClick={(event) => event.stopPropagation()}><div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-white/[0.07]"><div><h2 className="font-black">Detail Transaksi</h2><p className="text-xs text-slate-400">#{getValue(selected, ['id', 'kode_pesanan', 'order_id'])} · {selected.status || 'tanpa status'}</p></div><button onClick={() => setSelected(null)} aria-label="Tutup detail" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.06]"><X className="h-5 w-5" /></button></div><div className="max-h-[65vh] space-y-2 overflow-y-auto p-5">{detailEntries.map(([key, value]) => <div key={key} className="grid grid-cols-[minmax(120px,0.35fr)_1fr] gap-4 border-b border-slate-100 py-2 text-sm dark:border-white/[0.05]"><span className="font-semibold text-slate-500">{key}</span><span className="break-words text-slate-900 dark:text-slate-200">{valueText(value)}</span></div>)}</div></div></div>}</main>;
}
