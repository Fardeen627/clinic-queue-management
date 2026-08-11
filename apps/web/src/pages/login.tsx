import { useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '@/lib/api';
import { saveAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const next = typeof router.query.next === 'string' ? router.query.next : '/';
  const [role, setRole] = useState(typeof router.query.role === 'string' ? router.query.role : 'staff');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setError('');
    try { const result = await api.auth.login(role, password); saveAuth(result.token, result.role); router.replace(next); }
    catch { setError('Login failed. Please check the password and try again.'); }
    finally { setLoading(false); }
  };

  return <main className="min-h-screen bg-slate-100 flex items-center justify-center p-5">
    <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl shadow-slate-200/70 border border-slate-200">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600 text-xl text-white">+</div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Clinic Queue</h1>
        <p className="mt-2 text-sm text-slate-500">Sign in to manage your clinic queue.</p>
      </div>
      <div className="space-y-5">
        <label className="block text-sm font-medium text-slate-700">Access role
          <select value={role} onChange={(e) => setRole(e.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100">
            <option value="staff">Staff — Reception & Doctor</option><option value="admin">Administrator</option>
          </select>
        </label>
        <label className="block text-sm font-medium text-slate-700">Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleLogin()} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100" placeholder="Enter your password" />
        </label>
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <button onClick={handleLogin} disabled={loading} className="w-full rounded-lg bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700 disabled:bg-slate-300">{loading ? 'Signing in…' : 'Sign in'}</button>
      </div>
    </section>
  </main>;
}
