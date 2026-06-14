'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, hydrate } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col justify-between">
      {/* Navbar */}
      <header className="bg-white border-b border-zinc-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-zinc-900">ShopStack</span>
          </div>

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-sm text-zinc-600">
                  Logged in as <strong className="text-zinc-950 font-medium">{user?.email || 'User'}</strong>
                </span>
                <Link
                  href="/dashboard"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={logout}
                  className="rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors shadow-sm"
                >
                  Log out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="rounded-xl border border-zinc-200 hover:border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:text-zinc-950 transition-colors shadow-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-sm font-medium text-white transition-colors shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-16 flex flex-col justify-center">
        <div className="text-center space-y-6">
          <div className="inline-flex rounded-full bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs text-indigo-700 font-semibold uppercase tracking-wider">
            ShopStack Core Ecosystem
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 max-w-2xl mx-auto leading-tight">
            Microservice e-Commerce Demo Platform
          </h1>
          <p className="text-lg text-zinc-500 max-w-xl mx-auto font-light">
            A containerized microservices ecosystem using Node.js, PostgreSQL, Redis, RabbitMQ, and Next.js.
          </p>

          <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto text-left">
            {/* Quick Actions */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-zinc-950 mb-2">Quick Navigation</h2>
              <p className="text-sm text-zinc-500 mb-4">Explore the authentication, user and account settings pages.</p>
              <div className="flex flex-col gap-2.5">
                <Link href="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Go to Login &rarr;
                </Link>
                <Link href="/register" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Go to Register &rarr;
                </Link>
                <Link href="/dashboard" className="text-sm font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                  Go to Dashboard &rarr;
                </Link>
              </div>
            </div>

            {/* Microservices Architecture */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
              <h2 className="text-lg font-semibold text-zinc-950 mb-2">Service Topology</h2>
              <p className="text-sm text-zinc-500 mb-3">All API requests route transparently to target microservices:</p>
              <ul className="text-xs space-y-1.5 text-zinc-600">
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <strong>Auth Service</strong> (port 3001) at <code>/api/auth</code>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <strong>User Service</strong> (port 3002) at <code>/api/users</code>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <strong>Product Service</strong> (port 3003) at <code>/api/products</code>
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                  <strong>Inventory Service</strong> (port 3005) at <code>/api/inventory</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs text-zinc-400">
          &copy; {new Date().getFullYear()} ShopStack. Built with Next.js &amp; Microservices.
        </div>
      </footer>
    </div>
  );
}
