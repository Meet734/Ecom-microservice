'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import { productApi, orderApi, inventoryApi } from '@/lib/api';
import Alert from '@/components/Ui/Alert';
import Button from '@/components/Ui/Button';

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

function SellerDashboard({ user }) {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restockAmounts, setRestockAmounts] = useState({});

  const fetchSellerData = async () => {
    try {
      const [statsRes, productsRes, ordersRes] = await Promise.all([
        orderApi.getSellerStats(),
        productApi.list({ seller_id: user.id, limit: 100 }),
        orderApi.getSellerOrders({ limit: 10 })
      ]);

      const statsData = statsRes.data.data || statsRes.data;
      const productsData = productsRes.data.data || productsRes.data;
      const ordersData = ordersRes.data.data || ordersRes.data;

      setStats(statsData);
      setProducts(productsData || []);
      setOrders(ordersData || []);

      if (productsData && productsData.length > 0) {
        const inventoryPromises = productsData.map(async (prod) => {
          try {
            const { data: invRes } = await inventoryApi.get(prod.id);
            return { productId: prod.id, inventory: invRes.data || invRes };
          } catch {
            return { productId: prod.id, inventory: null };
          }
        });
        const inventories = await Promise.all(inventoryPromises);
        const inventoryMap = {};
        inventories.forEach(inv => {
          if (inv.inventory) inventoryMap[inv.productId] = inv.inventory;
        });

        setProducts(prev => prev.map(p => ({
          ...p,
          inventory: inventoryMap[p.id] || null
        })));
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load seller dashboard details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSellerData();
  }, [user]);

  const handleRestock = async (productId) => {
    const amount = restockAmounts[productId];
    if (!amount || parseInt(amount) <= 0) return;

    try {
      setError('');
      await inventoryApi.restock(productId, {
        quantity: parseInt(amount),
        notes: 'Quick restock from Seller Dashboard'
      });
      setRestockAmounts(prev => ({ ...prev, [productId]: '' }));
      await fetchSellerData();
    } catch (err) {
      setError(err.response?.data?.message || 'Quick restock failed');
    }
  };

  const handleInitialize = async (productId) => {
    try {
      setError('');
      await inventoryApi.initialize({
        productId,
        quantity: 50,
        low_stock_threshold: 10,
        warehouse_location: 'Default-WH-01'
      });
      await fetchSellerData();
    } catch (err) {
      setError(err.response?.data?.message || 'Inventory initialization failed');
    }
  };

  const formatPrice = (paise) => {
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
        Loading Seller Dashboard...
      </div>
    );
  }

  // Identify low stock listings
  const lowStockProducts = products.filter(p => {
    if (!p.inventory) return false;
    return p.inventory.quantity <= (p.inventory.low_stock_threshold ?? 10);
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Welcome & Service Title */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Seller Console</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Welcome back, <span className="font-semibold text-zinc-700">{user?.email}</span>. Check your sales, listing analytics, and stock levels.
        </p>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

      {/* Grid of stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-100">Total Revenue</p>
          <p className="text-2xl font-extrabold mt-2">{formatPrice(stats?.totalRevenue ?? 0)}</p>
          <p className="text-[10px] text-indigo-200 mt-1">Sum of all purchased items</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-emerald-100">Orders Received</p>
          <p className="text-2xl font-extrabold mt-2">{stats?.totalOrders ?? 0}</p>
          <p className="text-[10px] text-emerald-100 mt-1">Unique purchase operations</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-violet-100">Items Sold</p>
          <p className="text-2xl font-extrabold mt-2">{stats?.totalItems ?? 0}</p>
          <p className="text-[10px] text-violet-100 mt-1">Total quantity of products sold</p>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 p-5 text-white shadow-sm hover:shadow-md transition-shadow">
          <p className="text-xs font-semibold uppercase tracking-wider text-amber-100">Listed Products</p>
          <p className="text-2xl font-extrabold mt-2">{products.length}</p>
          <p className="text-[10px] text-amber-100 mt-1">Active items in public catalog</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Stock Warning & Listings */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Low Stock Warnings */}
          {lowStockProducts.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/45 p-6 space-y-4">
              <h2 className="text-sm font-bold text-amber-800 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                Low Stock Warning ({lowStockProducts.length} Items)
              </h2>
              <p className="text-xs text-amber-700">These items have dropped below their low-stock thresholds. Restock immediately to prevent purchase failures.</p>
              
              <div className="divide-y divide-amber-100">
                {lowStockProducts.map(p => (
                  <div key={p.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 gap-2">
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{p.name}</p>
                      <p className="text-[10px] text-zinc-400 font-mono">ID: {p.id}</p>
                      <p className="text-xs text-amber-600 font-medium">In stock: {p.inventory?.quantity} (Threshold: {p.inventory?.low_stock_threshold})</p>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <input
                        type="number"
                        placeholder="Add stock"
                        min="1"
                        value={restockAmounts[p.id] || ''}
                        onChange={(e) => setRestockAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                        className="w-20 text-xs px-2.5 py-1.5 rounded-lg border border-amber-300 focus:outline-none focus:ring-1 focus:ring-amber-500 bg-white"
                      />
                      <Button
                        size="xs"
                        variant="primary"
                        onClick={() => handleRestock(p.id)}
                        disabled={!restockAmounts[p.id]}
                      >
                        Restock
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Listings List */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h2 className="font-bold text-zinc-950 text-sm">Your Listed Products</h2>
              <Link href="/products/manage" className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                + Add New Listing
              </Link>
            </div>
            
            {products.length === 0 ? (
              <div className="text-center py-8 text-zinc-400 text-sm">
                No products listed. Click "+ Add New Listing" to add your first product.
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {products.map(p => {
                  const status = !p.inventory
                    ? 'uninitialized'
                    : p.inventory.quantity === 0
                      ? 'out_of_stock'
                      : p.inventory.quantity <= (p.inventory.low_stock_threshold ?? 10)
                        ? 'low_stock'
                        : 'in_stock';

                  return (
                    <div key={p.id} className="py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-zinc-900 text-sm">{p.name}</h3>
                          <span className="text-[10px] text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded uppercase font-mono">{p.sku}</span>
                        </div>
                        <p className="text-xs text-zinc-500 font-medium">{p.brand || 'No brand'} | {formatPrice(p.price)}</p>
                        <p className="text-[10px] text-zinc-400 font-mono">ID: {p.id}</p>
                      </div>

                      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                        {status === 'uninitialized' ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-600 uppercase">Not Initialized</span>
                            <Button size="xs" variant="secondary" onClick={() => handleInitialize(p.id)}>
                              Initialize
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                                status === 'in_stock'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : status === 'low_stock'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-rose-100 text-rose-700'
                              }`}>
                                {p.inventory.quantity} In Stock
                              </span>
                              <p className="text-[9px] text-zinc-400 mt-0.5">{p.inventory.warehouse_location || 'No Warehouse'}</p>
                            </div>
                            <div className="flex gap-1">
                              <input
                                type="number"
                                placeholder="Qty"
                                min="1"
                                value={restockAmounts[p.id] || ''}
                                onChange={(e) => setRestockAmounts(prev => ({ ...prev, [p.id]: e.target.value }))}
                                className="w-14 text-xs px-2 py-1 rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                              <Button
                                size="xs"
                                variant="secondary"
                                onClick={() => handleRestock(p.id)}
                                disabled={!restockAmounts[p.id]}
                              >
                                Restock
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Right 1 Column: Recent Orders & Quick Links */}
        <div className="space-y-6">
          
          {/* Recent Orders */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-zinc-950 text-sm border-b border-zinc-100 pb-3">Recent Sales</h2>
            {orders.length === 0 ? (
              <div className="text-center py-6 text-zinc-400 text-xs">
                No orders received yet.
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => {
                  // Filter items listed by this seller
                  const sellerItems = o.items?.filter(item => item.seller_id === user.id) || [];
                  const totalSellerAmount = sellerItems.reduce((sum, item) => sum + item.total_price, 0);

                  return (
                    <div key={o.id} className="text-xs space-y-1.5 p-3 rounded-lg bg-zinc-50 border border-zinc-150">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-zinc-900">Order #{o.id.slice(0, 8)}</span>
                        <span className={`inline-flex rounded-full px-2 py-0.25 text-[9px] font-semibold uppercase ${
                          o.status === 'confirmed' || o.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : o.status === 'cancelled'
                              ? 'bg-zinc-200 text-zinc-600'
                              : 'bg-amber-100 text-amber-700'
                        }`}>
                          {o.status}
                        </span>
                      </div>
                      <p className="text-zinc-500">Buyer: {o.user_email}</p>
                      
                      <div className="space-y-1 pt-1 border-t border-zinc-200 mt-1">
                        {sellerItems.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-[11px]">
                            <span className="text-zinc-700">{item.product_name} x {item.quantity}</span>
                            <span className="font-medium text-zinc-900">{formatPrice(item.total_price)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex justify-between pt-1 border-t border-dashed border-zinc-200 text-zinc-900 font-bold">
                        <span>Total Earnings</span>
                        <span>{formatPrice(totalSellerAmount)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Actions Links */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-zinc-950 text-sm border-b border-zinc-100 pb-3">Quick Actions</h2>
            <div className="flex flex-col gap-2.5">
              <Link href="/products/manage" className="flex justify-between items-center text-xs font-semibold text-zinc-700 hover:text-indigo-600 p-2.5 rounded-lg border border-zinc-200 hover:border-indigo-100 bg-zinc-50/50 hover:bg-indigo-50/10 transition-all">
                <span>Add Product Listing</span>
                <span>→</span>
              </Link>
              <Link href="/inventory" className="flex justify-between items-center text-xs font-semibold text-zinc-700 hover:text-indigo-600 p-2.5 rounded-lg border border-zinc-200 hover:border-indigo-100 bg-zinc-50/50 hover:bg-indigo-50/10 transition-all">
                <span>Detailed Inventory Logs</span>
                <span>→</span>
              </Link>
              <Link href="/profile" className="flex justify-between items-center text-xs font-semibold text-zinc-700 hover:text-indigo-600 p-2.5 rounded-lg border border-zinc-200 hover:border-indigo-100 bg-zinc-50/50 hover:bg-indigo-50/10 transition-all">
                <span>Account Profile</span>
                <span>→</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [productCount, setProductCount] = useState(null);

  useEffect(() => {
    productApi.list({ limit: 1 })
      .then(({ data }) => setProductCount(data.total ?? '—'))
      .catch(() => setProductCount('—'));
  }, []);

  if (user?.role === 'seller') {
    return <SellerDashboard user={user} />;
  }

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
