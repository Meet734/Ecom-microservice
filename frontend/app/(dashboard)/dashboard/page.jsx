'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { productApi } from '@/lib/api';

const SERVICES = [
  {
    name: 'Auth Service',
    port: 3001,
    path: '/api/auth',
    desc: 'JWT authentication, token rotation, session management',
    color: 'bg-emerald-500',
    tech: ['JWT', 'Redis', 'bcrypt'],
  },
  {
    name: 'User Service',
    port: 3002,
    path: '/api/users',
    desc: 'Profile management, address CRUD, event-driven sync',
    color: 'bg-blue-500',
    tech: ['PostgreSQL', 'RabbitMQ'],
  },
  {
    name: 'Product Service',
    port: 3003,
    path: '/api/products',
    desc: 'Catalog, categories, search, seller product management',
    color: 'bg-violet-500',
    tech: ['PostgreSQL', 'gRPC'],
  },
  {
    name: 'Inventory Service',
    port: 3005,
    path: '/api/inventory',
    desc: 'Stock tracking, restock, low-stock alerts, event-driven',
    color: 'bg-amber-500',
    tech: ['PostgreSQL', 'RabbitMQ'],
  },
  {
    name: 'Notification Service',
    port: '—',
    path: 'Worker',
    desc: 'Email notifications via RabbitMQ consumer (no HTTP)',
    color: 'bg-pink-500',
    tech: ['RabbitMQ', 'Nodemailer'],
  },
];

const QUICK_ACTIONS = [
  { href: '/profile', label: 'Edit Profile', desc: 'User Service → GET/PUT /api/users/me' },
  { href: '/addresses', label: 'Manage Addresses', desc: 'User Service → /api/users/me/addresses' },
  { href: '/products', label: 'Browse Products', desc: 'Product Service → GET /api/products' },
  { href: '/products/manage', label: 'Create Product', desc: 'Product Service → POST /api/products' },
  { href: '/inventory', label: 'Check Inventory', desc: 'Inventory Service → GET /api/inventory/:id' },
  { href: '/change-password', label: 'Change Password', desc: 'Auth Service → PUT /api/auth/change-password' },
];

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    productApi.list({ limit: 1 })
      .then(({ data }) => setProductCount(data.total ?? '—'))
      .catch(() => setProductCount('—'));
  }, []);

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Dashboard
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome back, <span className="font-medium text-zinc-700">{user?.email || 'User'}</span>. 
          Explore the microservices architecture below.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Services', value: '5', sub: 'running' },
          { label: 'Your Role', value: user?.role || '—', sub: 'account type' },
          { label: 'Products', value: productCount ?? '…', sub: 'in catalog' },
          { label: 'Architecture', value: 'Micro', sub: 'service mesh' },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider">{stat.label}</p>
            <p className="text-2xl font-bold text-zinc-900 mt-1 capitalize">{stat.value}</p>
            <p className="text-[10px] text-zinc-400 mt-0.5">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Service Topology */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Service Topology</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SERVICES.map((svc) => (
            <div key={svc.name} className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-2.5 mb-3">
                <span className={`h-2.5 w-2.5 rounded-full ${svc.color}`} />
                <h3 className="font-semibold text-zinc-900 text-sm">{svc.name}</h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3 leading-relaxed">{svc.desc}</p>
              <div className="flex items-center justify-between">
                <code className="text-[10px] bg-zinc-100 text-zinc-600 px-2 py-0.5 rounded font-mono">
                  {svc.path}
                </code>
                <span className="text-[10px] text-zinc-400">
                  port {svc.port}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {svc.tech.map((t) => (
                  <span key={t} className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 font-medium">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.href}
              href={action.href}
              className="group flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white p-4 hover:border-indigo-200 hover:shadow-sm transition-all"
            >
              <span className="text-sm font-medium text-zinc-900 group-hover:text-indigo-600 transition-colors">
                {action.label} →
              </span>
              <span className="text-[11px] text-zinc-400 font-mono">
                {action.desc}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Architecture Note */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-3">Architecture Overview</h2>
        <div className="text-sm text-zinc-600 space-y-2 leading-relaxed">
          <p>
            This platform uses a <strong>microservices architecture</strong> where each service owns its own database 
            and communicates via REST APIs and asynchronous events (RabbitMQ).
          </p>
          <p>
            The <strong>Next.js frontend</strong> acts as an API gateway via <code className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded">next.config.js</code> rewrites,
            transparently proxying requests to the correct service.
          </p>
          <div className="flex flex-wrap gap-2 pt-2">
            {['Node.js', 'Express', 'PostgreSQL', 'Redis', 'RabbitMQ', 'gRPC', 'Docker', 'Next.js', 'JWT'].map((tech) => (
              <span key={tech} className="inline-block rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500">
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
