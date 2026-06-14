'use client';

import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

const EMPTY_ADDRESS = {
  label: 'Home',
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  pincode: '',
  country: 'India',
  is_default: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_ADDRESS });
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadAddresses(); }, []);

  const loadAddresses = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await userApi.getAddresses();
      setAddresses(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load addresses. Is the User Service running?');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError('');
    if (success) setSuccess('');
  };

  const handleEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || 'Home',
      full_name: addr.full_name || '',
      phone: addr.phone || '',
      line1: addr.line1 || '',
      line2: addr.line2 || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
      country: addr.country || 'India',
      is_default: addr.is_default || false,
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this address?')) return;
    try {
      await userApi.deleteAddress(id);
      setSuccess('Address deleted.');
      loadAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete address.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      if (editingId) {
        await userApi.updateAddress(editingId, form);
        setSuccess('Address updated.');
      } else {
        await userApi.addAddress(form);
        setSuccess('Address added.');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ ...EMPTY_ADDRESS });
      loadAddresses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save address.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ ...EMPTY_ADDRESS });
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Addresses</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your saved addresses.
            <span className="ml-2 text-[10px] text-zinc-400 font-mono">User Service → /api/users/me/addresses</span>
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => { setShowForm(true); setEditingId(null); setForm({ ...EMPTY_ADDRESS }); }}>
            + Add Address
          </Button>
        )}
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Add/Edit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-sm font-semibold text-zinc-900">
            {editingId ? 'Edit Address' : 'New Address'}
          </h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-zinc-700">Label</label>
              <select
                value={form.label}
                onChange={handleChange('label')}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              >
                <option value="Home">Home</option>
                <option value="Office">Office</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <Input id="full_name" label="Full Name" required placeholder="John Doe" value={form.full_name} onChange={handleChange('full_name')} />
          </div>

          <Input id="phone" label="Phone" required type="tel" placeholder="+91 9876543210" value={form.phone} onChange={handleChange('phone')} />
          <Input id="line1" label="Address Line 1" required placeholder="123 Main Street" value={form.line1} onChange={handleChange('line1')} />
          <Input id="line2" label="Address Line 2" placeholder="Apt, Suite (optional)" value={form.line2} onChange={handleChange('line2')} />

          <div className="grid grid-cols-2 gap-4">
            <Input id="city" label="City" required placeholder="Mumbai" value={form.city} onChange={handleChange('city')} />
            <Input id="state" label="State" required placeholder="Maharashtra" value={form.state} onChange={handleChange('state')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input id="pincode" label="Pincode" required placeholder="400001" value={form.pincode} onChange={handleChange('pincode')} />
            <Input id="country" label="Country" required placeholder="India" value={form.country} onChange={handleChange('country')} />
          </div>

          <label className="flex items-center gap-2 text-sm text-zinc-700 cursor-pointer">
            <input type="checkbox" checked={form.is_default} onChange={handleChange('is_default')} className="rounded border-zinc-300" />
            Set as default address
          </label>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={handleCancel} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} disabled={saving}>
              {editingId ? 'Update' : 'Add'} Address
            </Button>
          </div>
        </form>
      )}

      {/* Address Cards */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Loading addresses...
        </div>
      ) : addresses.length === 0 && !showForm ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No addresses saved yet. Add your first address above.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div key={addr.id} className="rounded-xl border border-zinc-200 bg-white p-5 space-y-2 hover:shadow-sm transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                    {addr.label}
                  </span>
                  {addr.is_default && (
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                      Default
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => handleEdit(addr)}
                    className="text-xs text-zinc-500 hover:text-indigo-600 transition-colors px-2 py-1"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-zinc-500 hover:text-red-500 transition-colors px-2 py-1"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-sm font-medium text-zinc-900">{addr.full_name}</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                {addr.city}, {addr.state} — {addr.pincode}<br />
                {addr.country}
              </p>
              <p className="text-xs text-zinc-400">{addr.phone}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
