'use client';

import { useEffect, useState } from 'react';
import { productApi } from '@/lib/api';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [viewProduct, setViewProduct] = useState(null);

  useEffect(() => {
    productApi.getCategories()
      .then(({ data }) => setCategories(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    loadProducts();
  }, [pagination.page, selectedCategory, searchQuery]);

  const loadProducts = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (searchQuery) {
        response = await productApi.search({
          q: searchQuery,
          category: selectedCategory || undefined,
          page: pagination.page,
          limit: 12,
        });
      } else {
        response = await productApi.list({
          category_id: selectedCategory || undefined,
          page: pagination.page,
          limit: 12,
        });
      }
      const { data } = response;
      setProducts(data.products || data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.pages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products. Is the Product Service running?');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    setSearchQuery(searchInput.trim());
  };

  const formatPrice = (paise) => {
    if (!paise && paise !== 0) return '—';
    return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
  };

  return (
    <div className="max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Products</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Browse the product catalog.
          <span className="ml-2 text-[10px] text-zinc-400 font-mono">Product Service → GET /api/products</span>
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex-1 flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search products..."
            className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
          <Button type="submit" variant="secondary">Search</Button>
        </form>
        <select
          value={selectedCategory}
          onChange={(e) => {
            setSelectedCategory(e.target.value);
            setPagination((prev) => ({ ...prev, page: 1 }));
          }}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-zinc-400">
          {pagination.total} product{pagination.total !== 1 ? 's' : ''} found
          {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
        </p>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Loading products...
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No products found. {searchQuery ? 'Try a different search.' : 'Create some products to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((product) => (
            <div
              key={product.id}
              onClick={() => setViewProduct(product)}
              className="rounded-xl border border-zinc-200 bg-white p-5 hover:shadow-md transition-all cursor-pointer group"
            >
              {/* Image placeholder */}
              <div className="h-32 rounded-lg bg-zinc-100 flex items-center justify-center mb-4 group-hover:bg-zinc-50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-300">
                  <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/>
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                  <line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>

              {/* Category badge */}
              {product.category && (
                <span className="inline-block rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 font-medium mb-2">
                  {product.category.name}
                </span>
              )}

              <h3 className="text-sm font-semibold text-zinc-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                {product.name}
              </h3>

              {product.brand && (
                <p className="text-[11px] text-zinc-400 mb-2">{product.brand}</p>
              )}

              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-zinc-900">{formatPrice(product.price)}</span>
                {product.compare_price && (
                  <span className="text-xs text-zinc-400 line-through">{formatPrice(product.compare_price)}</span>
                )}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <code className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded font-mono truncate">
                  SKU: {product.sku}
                </code>
                {!product.is_active && (
                  <span className="text-[9px] text-red-500 font-medium">Inactive</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
          >
            ← Prev
          </Button>
          <span className="text-xs text-zinc-500 px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
          >
            Next →
          </Button>
        </div>
      )}

      {/* Product Detail Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setViewProduct(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900">{viewProduct.name}</h2>
                {viewProduct.brand && <p className="text-sm text-zinc-500">{viewProduct.brand}</p>}
              </div>
              <button onClick={() => setViewProduct(null)} className="text-zinc-400 hover:text-zinc-700 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-zinc-900">{formatPrice(viewProduct.price)}</span>
                {viewProduct.compare_price && (
                  <span className="text-zinc-400 line-through">{formatPrice(viewProduct.compare_price)}</span>
                )}
              </div>

              {viewProduct.description && (
                <p className="text-zinc-600 leading-relaxed">{viewProduct.description}</p>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-400">SKU</p>
                  <p className="font-mono text-zinc-700">{viewProduct.sku}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-400">Category</p>
                  <p className="text-zinc-700">{viewProduct.category?.name || '—'}</p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-400">Status</p>
                  <p className={viewProduct.is_active ? 'text-emerald-600' : 'text-red-500'}>
                    {viewProduct.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-zinc-400">Seller ID</p>
                  <p className="font-mono text-zinc-600 text-[10px] break-all">{viewProduct.seller_id || '—'}</p>
                </div>
              </div>

              {viewProduct.attributes && Object.keys(viewProduct.attributes).length > 0 && (
                <div className="rounded-lg bg-zinc-50 p-3">
                  <p className="text-xs text-zinc-400 mb-1">Attributes</p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(viewProduct.attributes).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-white border border-zinc-200 px-2 py-0.5 text-[10px] text-zinc-600">
                        {k}: {v}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-lg bg-zinc-50 p-3">
                <p className="text-xs text-zinc-400 mb-1">Product ID</p>
                <p className="font-mono text-zinc-600 text-[10px] break-all">{viewProduct.id}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
