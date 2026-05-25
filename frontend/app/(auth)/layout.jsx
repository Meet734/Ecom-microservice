import Link from 'next/link';

export const metadata = {
  title: 'Authentication — ShopStack',
};

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* ── Left Branding Panel (hidden on mobile) ──────────────── */}
      <aside className="hidden lg:flex lg:w-1/2 bg-zinc-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle background texture */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)',
            backgroundSize: '100px 100px',
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-2.5 w-fit">
          <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">ShopStack</span>
        </Link>

        {/* Center content */}
        <div className="relative z-10 space-y-6">
          <blockquote className="space-y-3">
            <p className="text-zinc-100 text-2xl font-light leading-relaxed tracking-tight">
              "The microservices architecture enables independent scaling of each component — from auth to payments."
            </p>
            <footer className="text-zinc-500 text-sm">
              System Design Interview Prep
            </footer>
          </blockquote>

          {/* Tech stack badge row */}
          <div className="flex flex-wrap gap-2 pt-2">
            {['Node.js', 'PostgreSQL', 'Redis', 'RabbitMQ', 'Next.js'].map((tech) => (
              <span
                key={tech}
                className="inline-block rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom architecture hint */}
        <div className="relative z-10 flex items-center gap-3 text-zinc-600 text-xs">
          <div className="h-px flex-1 bg-zinc-800" />
          <span>auth-service · port 3001</span>
          <div className="h-px flex-1 bg-zinc-800" />
        </div>
      </aside>

      {/* ── Right Form Panel ─────────────────────────────────────── */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10">
        {/* Mobile-only logo */}
        <Link
          href="/"
          className="lg:hidden flex items-center gap-2 mb-10 text-zinc-900"
        >
          <div className="h-7 w-7 rounded-lg bg-indigo-500 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
          </div>
          <span className="font-semibold tracking-tight">ShopStack</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <p className="mt-10 text-xs text-zinc-400 text-center">
          © {new Date().getFullYear()} ShopStack. Built for learning.
        </p>
      </main>
    </div>
  );
}