'use client';

import { useEffect, useState, useCallback } from 'react';
import { orderApi } from '@/lib/api';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

const STATUS_CONFIG = {
  pending:    { label: 'Pending',    bg: 'bg-amber-50',   text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-400' },
  confirmed:  { label: 'Confirmed',  bg: 'bg-blue-50',    text: 'text-blue-700',   border: 'border-blue-200',   dot: 'bg-blue-400' },
  processing: { label: 'Processing', bg: 'bg-violet-50',  text: 'text-violet-700', border: 'border-violet-200', dot: 'bg-violet-400' },
  shipped:    { label: 'Shipped',    bg: 'bg-purple-50',  text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-400' },
  delivered:  { label: 'Delivered',  bg: 'bg-emerald-50', text: 'text-emerald-700',border: 'border-emerald-200',dot: 'bg-emerald-400' },
  cancelled:  { label: 'Cancelled',  bg: 'bg-red-50',     text: 'text-red-600',    border: 'border-red-200',    dot: 'bg-red-400' },
};

const PAYMENT_CONFIG = {
  unpaid:   { label: 'Unpaid',   color: 'text-zinc-500' },
  paid:     { label: 'Paid',     color: 'text-emerald-600' },
  refunded: { label: 'Refunded', color: 'text-amber-600' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

function formatPrice(paise) {
  if (paise == null) return '—';
  return `₹${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // orderId being actioned

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: pagination.page, limit: 10 };
      if (statusFilter) params.status = statusFilter;
      const { data } = await orderApi.list(params);
      setOrders(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.total || 0,
        totalPages: data.pages || 1,
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders. Is the Order Service running?');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, statusFilter]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleConfirm = async (orderId) => {
    setActionLoading(orderId);
    setError('');
    setSuccess('');
    try {
      await orderApi.confirm(orderId);
      setSuccess('Order confirmed successfully.');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm order.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (orderId) => {
    setActionLoading(orderId);
    setError('');
    setSuccess('');
    try {
      await orderApi.cancel(orderId, { reason: 'Cancelled by user' });
      setSuccess('Order cancelled successfully.');
      await loadOrders();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel order.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleExpand = (orderId) => {
    setExpandedId(prev => (prev === orderId ? null : orderId));
  };

  return (
    <div className="max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Orders</h1>
        <p className="text-sm text-zinc-500 mt-1">
          View and manage your orders.
          <span className="ml-2 text-[10px] text-zinc-400 font-mono">Order Service → GET /api/orders</span>
        </p>
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2">
        {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatusFilter(s);
              setPagination(prev => ({ ...prev, page: 1 }));
            }}
            className={[
              'rounded-full px-3 py-1.5 text-xs font-medium border transition-all duration-150',
              statusFilter === s
                ? 'bg-zinc-900 text-white border-zinc-900'
                : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50',
            ].join(' ')}
          >
            {s ? STATUS_CONFIG[s]?.label : 'All'}
          </button>
        ))}
      </div>

      {/* Alerts */}
      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Results count */}
      {!loading && (
        <p className="text-xs text-zinc-400">
          {pagination.total} order{pagination.total !== 1 ? 's' : ''} found
          {statusFilter && <> with status &ldquo;{STATUS_CONFIG[statusFilter]?.label}&rdquo;</>}
        </p>
      )}

      {/* Orders list */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Loading orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No orders found. {statusFilter ? 'Try a different filter.' : 'Place an order to get started.'}
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const isExpanded = expandedId === order.id;
            const canConfirm = order.status === 'pending';
            const canCancel = ['pending', 'confirmed'].includes(order.status);
            const isActioning = actionLoading === order.id;
            const paymentCfg = PAYMENT_CONFIG[order.payment_status] || PAYMENT_CONFIG.unpaid;

            return (
              <div
                key={order.id}
                className="rounded-xl border border-zinc-200 bg-white overflow-hidden transition-shadow hover:shadow-sm"
              >
                {/* Order header row */}
                <button
                  onClick={() => toggleExpand(order.id)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <code className="text-xs font-mono text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded">
                        {order.id.slice(0, 8)}…
                      </code>
                      <StatusBadge status={order.status} />
                      <span className={`text-[10px] font-medium ${paymentCfg.color}`}>
                        {paymentCfg.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-400">
                      <span>{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</span>
                      <span>·</span>
                      <span>{formatDate(order.created_at || order.createdAt)}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-zinc-900">{formatPrice(order.total_amount)}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">
                      {formatPrice(order.subtotal)} + {formatPrice(order.shipping_charge)} shipping
                    </p>
                  </div>

                  {/* Chevron */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    className={`text-zinc-300 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 px-5 py-4 space-y-4 bg-zinc-50/50">
                    {/* Line items table */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Items</p>
                      <div className="rounded-lg border border-zinc-200 bg-white overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-zinc-100 text-xs text-zinc-400">
                              <th className="text-left px-4 py-2 font-medium">Product</th>
                              <th className="text-left px-4 py-2 font-medium">SKU</th>
                              <th className="text-right px-4 py-2 font-medium">Price</th>
                              <th className="text-right px-4 py-2 font-medium">Qty</th>
                              <th className="text-right px-4 py-2 font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(order.items || []).map((item, idx) => (
                              <tr key={item.id || idx} className="border-b border-zinc-50 last:border-0">
                                <td className="px-4 py-2.5 text-zinc-800 font-medium">{item.product_name}</td>
                                <td className="px-4 py-2.5">
                                  <code className="text-[10px] text-zinc-400 font-mono">{item.product_sku}</code>
                                </td>
                                <td className="px-4 py-2.5 text-right text-zinc-600">{formatPrice(item.unit_price)}</td>
                                <td className="px-4 py-2.5 text-right text-zinc-600">{item.quantity}</td>
                                <td className="px-4 py-2.5 text-right font-semibold text-zinc-800">{formatPrice(item.total_price)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Shipping address + metadata */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Shipping address */}
                      {order.shipping_address && (
                        <div className="rounded-lg border border-zinc-200 bg-white p-4">
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Shipping Address</p>
                          <div className="text-sm text-zinc-700 space-y-0.5">
                            <p className="font-medium">{order.shipping_address.full_name}</p>
                            {order.shipping_address.phone && (
                              <p className="text-zinc-500 text-xs">{order.shipping_address.phone}</p>
                            )}
                            <p>{order.shipping_address.line1}</p>
                            {order.shipping_address.line2 && <p>{order.shipping_address.line2}</p>}
                            <p>
                              {order.shipping_address.city}, {order.shipping_address.state} {order.shipping_address.pincode}
                            </p>
                            <p className="text-zinc-500">{order.shipping_address.country}</p>
                          </div>
                        </div>
                      )}

                      {/* Order metadata */}
                      <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-2">
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 mb-2">Details</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-zinc-400">Order ID</p>
                            <p className="font-mono text-zinc-600 text-[10px] break-all">{order.id}</p>
                          </div>
                          <div>
                            <p className="text-zinc-400">Payment</p>
                            <p className={`font-medium ${paymentCfg.color}`}>{paymentCfg.label}</p>
                          </div>
                          {order.shipped_at && (
                            <div>
                              <p className="text-zinc-400">Shipped</p>
                              <p className="text-zinc-600">{formatDate(order.shipped_at)}</p>
                            </div>
                          )}
                          {order.delivered_at && (
                            <div>
                              <p className="text-zinc-400">Delivered</p>
                              <p className="text-zinc-600">{formatDate(order.delivered_at)}</p>
                            </div>
                          )}
                          {order.cancelled_reason && (
                            <div className="col-span-2">
                              <p className="text-zinc-400">Cancel Reason</p>
                              <p className="text-red-600">{order.cancelled_reason}</p>
                            </div>
                          )}
                          {order.notes && (
                            <div className="col-span-2">
                              <p className="text-zinc-400">Notes</p>
                              <p className="text-zinc-600">{order.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    {(canConfirm || canCancel) && (
                      <div className="flex items-center gap-2 pt-1">
                        {canConfirm && (
                          <Button
                            size="sm"
                            variant="primary"
                            onClick={() => handleConfirm(order.id)}
                            disabled={isActioning}
                            isLoading={isActioning}
                          >
                            Confirm Order
                          </Button>
                        )}
                        {canCancel && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleCancel(order.id)}
                            disabled={isActioning}
                            isLoading={isActioning}
                            className="!text-red-600 !border-red-200 hover:!bg-red-50"
                          >
                            Cancel Order
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
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
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  );
}
