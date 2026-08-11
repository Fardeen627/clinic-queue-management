import { useAuth, clearAuth } from '@/lib/auth';

const sections = [
  ['Reception', 'Register patients and manage waiting or on-hold tickets.', '/desk', 'Open reception'],
  ['Doctor’s Room', 'Call the next patient and update their visit status.', '/doctor', 'Open doctor view'],
  ['Administration', 'Manage announcements and waiting-room media.', '/admin', 'Open admin'],
];

export default function Home() {
  const { auth } = useAuth();
  return <main className="min-h-screen bg-slate-50 p-5 md:p-10"><div className="mx-auto max-w-5xl">
    <header className="mb-10 flex flex-col gap-4 border-b border-slate-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-[.2em] text-teal-700">Campus Clinic</p><h1 className="mt-1 text-3xl font-bold text-slate-900">Queue workspace</h1><p className="mt-2 text-slate-500">Choose a simple workspace to keep patient flow moving.</p></div>
      {auth ? <div className="flex items-center gap-3"><span className="rounded-full bg-teal-50 px-3 py-1 text-sm text-teal-800">Signed in as {auth.role}</span><button onClick={() => { clearAuth(); window.location.reload(); }} className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium">Sign out</button></div> : <a className="rounded-lg bg-teal-600 px-4 py-2 font-semibold text-white" href="/login">Sign in</a>}
    </header>
    <div className="grid gap-5 md:grid-cols-3">{sections.map(([title, description, href, label], index) => <section key={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"><div className="mb-6 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 font-bold text-teal-700">0{index + 1}</div><h2 className="text-xl font-bold">{title}</h2><p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">{description}</p><a className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white" href={href}>{label}</a></section>)}</div>
    <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600"><span className="font-semibold text-slate-800">Waiting-room display:</span> open <code className="rounded bg-slate-100 px-1.5 py-0.5">http://localhost:3001</code> and select a room.</section>
  </div></main>;
}
