'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import {
  AlertCircle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  FileText,
  Loader2,
  LocateFixed,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const MapPreview = dynamic(() => import('./components/map-preview'), {
  ssr: false,
  loading: () => <div className="h-52 w-full animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" />,
});

type ProfileForm = {
  nama_lengkap: string;
  nama_instansi: string;
  nomor_telepon: string;
  alamat: string;
  bio: string;
  latitude: string;
  longitude: string;
};

const emptyForm: ProfileForm = {
  nama_lengkap: '',
  nama_instansi: '',
  nomor_telepon: '',
  alamat: '',
  bio: '',
  latitude: '',
  longitude: '',
};

const roles: Record<string, string> = {
  admin: 'Administrator',
  merchant: 'Merchant',
  customer: 'Customer',
  organization: 'Organisasi / Panti',
  courier: 'Kurir',
  waste_processor: 'Pengolah Energi',
  konsumen_umum: 'Customer',
  konsumen_panti: 'Organisasi / Panti',
  kurir: 'Kurir',
  pengolah_energi: 'Pengolah Energi',
};

const inputClass = 'w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-900 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/[0.035] dark:text-white dark:focus:bg-white/[0.06]';

function Field({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">{label}</span>
      <div className="relative">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        {children}
      </div>
    </label>
  );
}

export default function ProfilePage() {
  const [form, setForm] = useState<ProfileForm>(emptyForm);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [memberSince, setMemberSince] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Sesi login tidak ditemukan.');
        setLoading(false);
        return;
      }
      setEmail(user.email || '');
      setMemberSince(new Date(user.created_at).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }));
      const { data, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
      if (profileError) setError(profileError.message);
      setRole(String(data?.role || user.user_metadata?.role || ''));
      setStatus(String(data?.status || ''));
      setForm({
        nama_lengkap: String(data?.nama_lengkap || user.user_metadata?.full_name || ''),
        nama_instansi: String(data?.nama_instansi || ''),
        nomor_telepon: String(data?.nomor_telepon || ''),
        alamat: String(data?.alamat || ''),
        bio: String(data?.bio || data?.description || ''),
        latitude: data?.latitude == null ? '' : String(data.latitude),
        longitude: data?.longitude == null ? '' : String(data.longitude),
      });
      setLoading(false);
    };
    load();
  }, []);

  const update = (field: keyof ProfileForm, value: string) => setForm((current) => ({ ...current, [field]: value }));
  const completeness = useMemo(() => {
    const values = [form.nama_lengkap, form.nama_instansi, form.nomor_telepon, form.alamat, form.bio, form.latitude && form.longitude];
    return Math.round(values.filter(Boolean).length / values.length * 100);
  }, [form]);
  const initials = (form.nama_lengkap || email || 'P').trim().charAt(0).toUpperCase();
  const coords = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);
    return form.latitude && form.longitude && Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  }, [form.latitude, form.longitude]);

  const locate = () => {
    if (!navigator.geolocation) {
      setError('Browser tidak mendukung geolokasi.');
      return;
    }
    setError('');
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        update('latitude', position.coords.latitude.toFixed(6));
        update('longitude', position.coords.longitude.toFixed(6));
        setDetecting(false);
        setMessage('Lokasi berhasil dideteksi.');
      },
      () => {
        setDetecting(false);
        setError('Izin lokasi ditolak.');
      },
    );
  };

  const save = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError('Sesi login tidak ditemukan.');
      setSaving(false);
      return;
    }
    const { error: saveError } = await supabase.from('profiles').update({
      nama_lengkap: form.nama_lengkap.trim(),
      nama_instansi: form.nama_instansi.trim() || null,
      nomor_telepon: form.nomor_telepon.trim(),
      alamat: form.alamat.trim() || null,
      bio: form.bio.trim() || null,
      latitude: form.latitude ? Number(form.latitude) : null,
      longitude: form.longitude ? Number(form.longitude) : null,
    }).eq('id', user.id);
    if (saveError) setError(saveError.message);
    else setMessage('Profil berhasil diperbarui.');
    setSaving(false);
  };

  if (loading) return <main className="min-h-screen bg-slate-50 p-6 dark:bg-[#070812]"><div className="mx-auto max-w-6xl space-y-6"><div className="h-56 animate-pulse rounded-[28px] bg-slate-200 dark:bg-white/5" /><div className="h-96 animate-pulse rounded-2xl bg-slate-200 dark:bg-white/5" /></div></main>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 text-slate-900 dark:bg-[#070812] dark:text-slate-100 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="relative isolate overflow-hidden rounded-[30px] border border-emerald-500/20 bg-[#082f2b] p-6 text-white shadow-[0_25px_80px_-35px_rgba(5,150,105,.65)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 left-1/3 h-64 w-64 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="relative flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
            <div className="flex items-center gap-5">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl border border-white/20 bg-white/10 text-3xl font-black shadow-inner sm:h-24 sm:w-24">{initials}</div>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-200">PanganCerdas / Personal Space</p>
                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Profil Saya</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/80">Satu tempat untuk mengatur identitas, kontak, dan lokasi aktivitas Anda.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold"><ShieldCheck className="h-4 w-4 text-emerald-300" />{roles[role] || role || 'Pengguna'}</span>
                  {status && <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold"><BadgeCheck className="h-4 w-4 text-cyan-300" />{status}</span>}
                </div>
              </div>
            </div>
            <div className="flex min-w-0 items-center gap-4 rounded-2xl border border-white/10 bg-black/15 p-4 backdrop-blur-sm sm:min-w-60">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full border-[7px] border-emerald-300/30 text-lg font-black text-emerald-100"><span>{completeness}%</span></div>
              <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-200">Kelengkapan</p><p className="mt-1 text-sm text-white/70">Profil yang lengkap memudahkan kolaborasi.</p></div>
            </div>
          </div>
        </header>

        {(error || message) && <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm ${error ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200' : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200'}`}>{error ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}{error || message}</div>}

        <form onSubmit={save} className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,.5)] dark:border-white/8 dark:bg-[#10111d] sm:p-8">
            <div className="mb-7 flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-400">Informasi dasar</p><h2 className="mt-1 text-xl font-black">Kenali Anda lebih dekat</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Informasi ini membantu mitra menghubungi Anda dengan tepat.</p></div><UserRound className="h-6 w-6 text-emerald-500" /></div>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field icon={UserRound} label="Nama lengkap"><input className={inputClass} value={form.nama_lengkap} onChange={(event) => update('nama_lengkap', event.target.value)} placeholder="Nama lengkap Anda" /></Field>
              <Field icon={Building2} label="Nama instansi"><input className={inputClass} value={form.nama_instansi} onChange={(event) => update('nama_instansi', event.target.value)} placeholder="Opsional" /></Field>
              <Field icon={Phone} label="Nomor telepon"><input className={inputClass} value={form.nomor_telepon} onChange={(event) => update('nomor_telepon', event.target.value)} placeholder="08xxxxxxxxxx" /></Field>
              <Field icon={Mail} label="Email akun"><input className={`${inputClass} cursor-not-allowed opacity-70`} value={email} readOnly /></Field>
            </div>
            <div className="mt-5"><Field icon={MapPin} label="Alamat"><textarea className={`${inputClass} min-h-28 resize-y py-3`} value={form.alamat} onChange={(event) => update('alamat', event.target.value)} placeholder="Alamat lengkap untuk kebutuhan koordinasi" /></Field></div>
            <div className="mt-5"><Field icon={FileText} label="Tentang Anda"><textarea className={`${inputClass} min-h-28 resize-y py-3`} value={form.bio} onChange={(event) => update('bio', event.target.value)} placeholder="Ceritakan peran atau aktivitas Anda" /></Field></div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_-40px_rgba(15,23,42,.5)] dark:border-white/8 dark:bg-[#10111d]">
              <div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-600 dark:text-cyan-400">Lokasi aktivitas</p><h2 className="mt-1 text-lg font-black">Titik koordinat</h2></div><MapPin className="h-5 w-5 text-cyan-500" /></div>
              <p className="mb-4 text-sm leading-6 text-slate-500 dark:text-slate-400">Tentukan posisi Anda agar koordinasi pengantaran dan kolaborasi lebih akurat.</p>
              <button type="button" onClick={locate} disabled={detecting} className="mb-4 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-cyan-500/25 bg-cyan-500/10 px-4 py-3 text-sm font-bold text-cyan-700 transition hover:bg-cyan-500/20 disabled:cursor-wait disabled:opacity-60 dark:text-cyan-300"><LocateFixed className="h-4 w-4" />{detecting ? 'Mendeteksi lokasi...' : 'Gunakan lokasi saya'}</button>
              <div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Latitude<input className={`${inputClass} mt-2 pl-3!`} value={form.latitude} onChange={(event) => update('latitude', event.target.value)} placeholder="-6.200000" /></label><label className="text-xs font-bold text-slate-500 dark:text-slate-400">Longitude<input className={`${inputClass} mt-2 pl-3!`} value={form.longitude} onChange={(event) => update('longitude', event.target.value)} placeholder="106.816666" /></label></div>
              {coords ? <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/10"><MapPreview lat={coords.lat} lng={coords.lng} /></div> : <div className="mt-4 grid h-40 place-items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-center dark:border-white/10 dark:bg-white/3"><div><MapPin className="mx-auto h-6 w-6 text-slate-400" /><p className="mt-2 text-xs font-semibold text-slate-500 dark:text-slate-400">Isi koordinat untuk melihat peta</p></div></div>}
            </section>
            <section className="rounded-3xl border border-slate-200/80 bg-white p-6 dark:border-white/8 dark:bg-[#10111d]"><p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Status akun</p><div className="mt-4 flex items-center justify-between gap-3"><div><p className="text-sm font-bold">Member sejak</p><p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{memberSince || 'Belum tersedia'}</p></div><CheckCircle2 className="h-5 w-5 text-emerald-500" /></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-white/10"><div className="h-full rounded-full bg-linear-to-r from-emerald-500 to-cyan-400 transition-all" style={{ width: `${completeness}%` }} /></div></section>
          </aside>

          <div className="flex justify-end lg:col-span-2"><button type="submit" disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-60 sm:w-auto">{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{saving ? 'Menyimpan...' : 'Simpan perubahan'}</button></div>
        </form>
      </div>
    </main>
  );
}
