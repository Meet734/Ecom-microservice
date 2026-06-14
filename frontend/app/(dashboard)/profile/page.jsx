'use client';

import { useEffect, useState } from 'react';
import { userApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await userApi.getProfile();
      const p = data.data;
      setProfile(p);
      setForm({
        first_name: p.first_name || '',
        last_name: p.last_name || '',
        phone: p.phone || '',
        date_of_birth: p.date_of_birth || '',
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile. Is the User Service running?');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (success) setSuccess('');
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const { data } = await userApi.updateProfile(form);
      setProfile(data.data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">My Profile</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Manage your personal information.
          <span className="ml-2 text-[10px] text-zinc-400 font-mono">User Service → /api/users/me</span>
        </p>
      </div>

      {/* Auth info card */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">Auth Service Info</h2>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-zinc-400 text-xs">Email</p>
            <p className="text-zinc-900 font-medium">{user?.email || '—'}</p>
          </div>
          <div>
            <p className="text-zinc-400 text-xs">Role</p>
            <p className="text-zinc-900 font-medium capitalize">{user?.role || '—'}</p>
          </div>
          <div className="col-span-2">
            <p className="text-zinc-400 text-xs">User ID</p>
            <p className="text-zinc-600 font-mono text-xs">{user?.userId || user?.id || '—'}</p>
          </div>
        </div>
      </div>

      {error && <Alert type="error" message={error} onDismiss={() => setError('')} />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Loading profile...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="rounded-xl border border-zinc-200 bg-white p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1">Profile Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <Input
              id="first_name"
              label="First Name"
              placeholder="John"
              value={form.first_name}
              onChange={handleChange('first_name')}
            />
            <Input
              id="last_name"
              label="Last Name"
              placeholder="Doe"
              value={form.last_name}
              onChange={handleChange('last_name')}
            />
          </div>

          <Input
            id="phone"
            label="Phone"
            type="tel"
            placeholder="+91 9876543210"
            value={form.phone}
            onChange={handleChange('phone')}
          />

          <Input
            id="date_of_birth"
            label="Date of Birth"
            type="date"
            value={form.date_of_birth}
            onChange={handleChange('date_of_birth')}
          />

          <div className="pt-2 flex justify-end">
            <Button type="submit" isLoading={saving} disabled={saving}>
              Save Changes
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
