import { signup } from "@/app/actions/auth";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const resolvedParams = await searchParams;

  return (
    <div className="flex h-screen items-center justify-center bg-[#020617] p-4 text-emerald-50 font-mono">
      <div className="w-full max-w-md relative">
        <div className="absolute -inset-1 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 opacity-20 blur backdrop-filter" />

        <div className="relative rounded-lg border border-white/10 bg-white/5 p-8 backdrop-blur-xl shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tighter text-white">TRADERS<span className="text-emerald-500">-</span>HUB</h1>
            <p className="mt-2 text-sm text-slate-400">Establish Call Sign</p>
          </div>

          <form className="flex flex-col gap-4">
            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest" htmlFor="username">
                Call Sign (Username)
              </label>
              <input
                id="username"
                className="w-full rounded bg-slate-900/50 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                name="username"
                placeholder="RogueTrader99"
                required
                minLength={3}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest" htmlFor="email">
                E-Mail
              </label>
              <input
                id="email"
                className="w-full rounded bg-slate-900/50 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                name="email"
                type="email"
                placeholder="operator@link.net"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400 uppercase tracking-widest" htmlFor="password">
                Passkey
              </label>
              <input
                id="password"
                className="w-full rounded bg-slate-900/50 border border-slate-800 px-3 py-2 text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {resolvedParams.message && (
              <div className="rounded border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
                {resolvedParams.message}
              </div>
            )}

            <button
              formAction={signup}
              className="mt-4 w-full rounded bg-emerald-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-emerald-500"
            >
              GRANT CLEARANCE
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-400">
            Already authorized?{" "}
            <a href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline">
              Initialize Session
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
