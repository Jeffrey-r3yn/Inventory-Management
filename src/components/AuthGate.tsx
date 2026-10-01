import { useEffect, useState, type ReactNode, type FormEvent } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase, TABLES } from '../lib/supabase';
import type { User } from '../types';
export default function AuthGate({ children }: { children: (profile?: User) => ReactNode }) {
 const [session, setSession] = useState<Session | null>(null);
 const [profile, setProfile] = useState<User>();
 const [loading, setLoading] = useState(Boolean(supabase));
 const [error, setError] = useState('');
 const [busy, setBusy] = useState(false);
 useEffect(() => {
  if (!supabase) return;
  let active = true;
  const update = async (next: Session | null) => {
   if (!active) return;
   setSession(next); setProfile(undefined); setLoading(true);
   if (next) {
    const { data, error } = await supabase!.from(TABLES.users).select('*').eq('id',next.user.id).single();
    if (!active) return;
    if (error) setError('Profil belum tersedia. Pastikan skema inventory telah diterapkan.');
    else { setProfile({ id: data.id, fullName: data.full_name, role: data.role }); setError(''); }
   }
   if (active) setLoading(false);
  };
  void supabase.auth.getSession().then(({ data, error }) => {
   if (error && active) { setError(error.message); setLoading(false); return; }
   void update(data.session);
  });
  const { data: listener } = supabase.auth.onAuthStateChange((_event,next) => { void update(next); });
  return () => { active = false; listener.subscription.unsubscribe(); };
 }, []);
 const login = async (event: FormEvent<HTMLFormElement>) => {
  event.preventDefault(); setBusy(true); setError('');
  const form = new FormData(event.currentTarget);
  try {
   const { error } = await supabase!.auth.signInWithPassword({ email: String(form.get('email')), password: String(form.get('password')) });
   if (error) setError(error.message);
  } catch { setError('Tidak dapat menghubungi layanan login.'); }
  finally { setBusy(false); }
 };
 if (!supabase) return children();
 if (loading) return <p className="p-8 text-gray-600">Memuat akun…</p>;
 if (session && profile) return children(profile);
 return <main className="min-h-screen bg-gray-50 grid place-items-center p-6"><form onSubmit={login} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-sm space-y-5">
  <div><h1 className="text-2xl font-bold text-gray-900">SmartInventory</h1><p className="text-sm text-gray-500 mt-2">Masuk untuk mengelola inventaris tim Anda.</p></div>
  {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
  {!session && <><label className="block text-sm">Email<input name="email" type="email" autoComplete="username" required className="block w-full border rounded-lg p-3 mt-1" /></label>
  <label className="block text-sm">Kata sandi<input name="password" type="password" autoComplete="current-password" required className="block w-full border rounded-lg p-3 mt-1" /></label>
  <button disabled={busy} className="w-full bg-blue-600 text-white p-3 rounded-lg disabled:opacity-50">{busy ? 'Memproses…' : 'Masuk'}</button></>}
  {session && <button type="button" onClick={() => void supabase!.auth.signOut()} className="text-blue-600">Keluar</button>}
  <p className="text-xs text-gray-500">Hubungi manager untuk mendapatkan akun.</p>
 </form></main>;
}
