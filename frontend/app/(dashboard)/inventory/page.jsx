'use client';

import { useState } from 'react';
import { inventoryApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function InventoryPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  // Lookup
  const [lookupId,      setLookupId]      = useState('');
  const [inventory,     setInventory]     = useState(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  // Initialize (admin only)
  const [initForm, setInitForm] = useState({
    productId: '', quantity: '', low_stock_threshold: '10', warehouse_location: '',
  });
  const [initSaving, setInitSaving] = useState(false);

  // Restock (admin only)
  const [restockForm, setRestockForm] = useState({ productId: '', quantity: '', notes: '' });
  const [restockSaving, setRestockSaving] = useState(false);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupId.trim()) return;
    setLookupLoading(true);
    setError('');
    setInventory(null);
    try {
      const { data } = await inventoryApi.get(lookupId.trim());
      setInventory(data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Inventory not found for this product.');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleInitialize = async (e) => {
    e.preventDefault();
    setInitSaving(true);
    setError('');
    setSuccess('');
    try {
      await inventoryApi.initialize({
        productId:           initForm.productId,
        quantity:            parseInt(initForm.quantity),
        low_stock_threshold: parseInt(initForm.low_stock_threshold) || 10,
        warehouse_location:  initForm.warehouse_location || undefined,
      });
      setSuccess('Inventory initialized successfully.');
      setInitForm({ productId: '', quantity: '', low_stock_threshold: '10', warehouse_location: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize inventory.');
    } finally {
      setInitSaving(false);
    }
  };

  const handleRestock = async (e) => {
    e.preventDefault();
    setRestockSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await inventoryApi.restock(restockForm.productId, {
        quantity: parseInt(restockForm.quantity),
        notes:    restockForm.notes || undefined,
      });
      setSuccess(`Restocked successfully. New quantity: ${data.data?.quantity ?? '—'}`);
      setRestockForm({ productId: '', quantity: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restock.');
    } finally {
      setRestockSaving(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Inventory</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Check and manage product stock levels.
          <span className="ml-2 text-[10px] text-zinc-400 font-mono">Inventory Service → /api/inventory</span>
        </p>
      </div>

      {!isAdmin && (
        <Alert
          type="info"
          message="Stock lookup is available to all users. Initialize and restock operations require admin access."
        />
      )}

      {error   && <Alert type="error"   message={error}   onDismiss={() => setError('')}   />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* ── Stock Lookup — available to all authenticated users ── */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
        <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Look Up Stock
        </h2>
        <p className="text-xs text-zinc-500">Check current stock for a product by its UUID.</p>

        <form onSubmit={handleLookup} className="flex gap-2">
          <Input
            id="lookupId"
            placeholder="Product UUID"
            value={lookupId}
            onChange={(e) => { setLookupId(e.target.value); setInventory(null); }}
            className="flex-1"
          />
          <Button type="submit" isLoading={lookupLoading} disabled={lookupLoading || !lookupId.trim()}>
            Look Up
          </Button>
        </form>

        {inventory && (
          <div className="rounded-lg bg-zinc-50 p-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <p className="text-zinc-400 text-xs">Quantity</p>
                <p className={`text-2xl font-bold ${inventory.quantity <= (inventory.low_stock_threshold ?? 10) ? 'text-amber-600' : 'text-zinc-900'}`}>
                  {inventory.quantity}
                </p>
                {inventory.quantity <= (inventory.low_stock_threshold ?? 10) && (
                  <p className="text-[10px] text-amber-600 font-medium">Low stock</p>
                )}
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Reserved</p>
                <p className="text-lg font-semibold text-zinc-700">{inventory.reserved_quantity ?? 0}</p>
              </div>
              <div>
                <p className="text-zinc-400 text-xs">Threshold</p>
                <p className="text-lg font-semibold text-zinc-700">{inventory.low_stock_threshold ?? '—'}</p>
              </div>
              {inventory.warehouse_location && (
                <div className="col-span-2 sm:col-span-3">
                  <p className="text-zinc-400 text-xs">Warehouse</p>
                  <p className="text-zinc-700 text-sm">{inventory.warehouse_location}</p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-3">
                <p className="text-zinc-400 text-xs">Product ID</p>
                <p className="text-zinc-600 font-mono text-[10px]">{inventory.product_id}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Admin-only operations ── */}
      {isAdmin ? (
        <>
          {/* Initialize */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Initialize Inventory
            </h2>
            <p className="text-xs text-zinc-500">Set up inventory tracking for a new product.</p>

            <form onSubmit={handleInitialize} className="space-y-3">
              <Input id="init_productId" label="Product ID" required placeholder="Product UUID"
                value={initForm.productId}
                onChange={(e) => setInitForm((p) => ({ ...p, productId: e.target.value }))} />
              <div className="grid grid-cols-2 gap-3">
                <Input id="init_quantity" label="Initial Quantity" required type="number" min="0" placeholder="100"
                  value={initForm.quantity}
                  onChange={(e) => setInitForm((p) => ({ ...p, quantity: e.target.value }))} />
                <Input id="init_threshold" label="Low Stock Threshold" type="number" min="0" placeholder="10"
                  value={initForm.low_stock_threshold}
                  onChange={(e) => setInitForm((p) => ({ ...p, low_stock_threshold: e.target.value }))} />
              </div>
              <Input id="init_warehouse" label="Warehouse Location" placeholder="Mumbai-WH-01"
                value={initForm.warehouse_location}
                onChange={(e) => setInitForm((p) => ({ ...p, warehouse_location: e.target.value }))} />
              <Button type="submit" isLoading={initSaving} disabled={initSaving}>
                Initialize
              </Button>
            </form>
          </div>

          {/* Restock */}
          <div className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
            <h2 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Restock Product
            </h2>
            <p className="text-xs text-zinc-500">Add stock to an existing product inventory.</p>

            <form onSubmit={handleRestock} className="space-y-3">
              <Input id="restock_productId" label="Product ID" required placeholder="Product UUID"
                value={restockForm.productId}
                onChange={(e) => setRestockForm((p) => ({ ...p, productId: e.target.value }))} />
              <Input id="restock_quantity" label="Quantity to Add" required type="number" min="1" placeholder="50"
                value={restockForm.quantity}
                onChange={(e) => setRestockForm((p) => ({ ...p, quantity: e.target.value }))} />
              <div className="flex flex-col gap-1.5">
                <label htmlFor="restock_notes" className="text-sm font-medium text-zinc-700">Notes</label>
                <textarea id="restock_notes" rows={2} placeholder="Restock from supplier ABC..."
                  value={restockForm.notes}
                  onChange={(e) => setRestockForm((p) => ({ ...p, notes: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
                />
              </div>
              <Button type="submit" isLoading={restockSaving} disabled={restockSaving}>
                Restock
              </Button>
            </form>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-6 text-center text-sm text-zinc-400">
          Initialize and restock operations are restricted to <strong className="text-zinc-600">admin</strong> accounts.
        </div>
      )}
    </div>
  );
}
