'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoading, error, clearError, isAuthenticated, hydrate } = useAuthStore();

  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [sessionExpired] = useState(searchParams.get('session') === 'expired');

  // Hydrate from localStorage and redirect if already logged in
  useEffect(() => {
    hydrate();
    return () => clearError();
  }, []);

  useEffect(() => {
    if (isAuthenticated) router.replace('/dashboard');
  }, [isAuthenticated]);

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    return errs;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    // Clear field error on change
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const result = await login(form.email.trim().toLowerCase(), form.password);
    if (result.success) {
      const next = searchParams.get('next') || '/dashboard';
      router.push(next);
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Welcome back
        </h1>
        <p className="text-sm text-zinc-500">
          Sign in to your account to continue.
        </p>
      </div>

      {/* Session expired notice */}
      {sessionExpired && (
        <Alert
          type="info"
          message="Your session expired. Please sign in again."
        />
      )}

      {/* API error */}
      {error && (
        <Alert type="error" message={error} onDismiss={clearError} />
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <Input
          id="email"
          label="Email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          placeholder="you@example.com"
          value={form.email}
          onChange={handleChange('email')}
          error={fieldErrors.email}
        />

        <div className="space-y-1.5">
          <Input
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="current-password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange('password')}
            error={fieldErrors.password}
          />
          <div className="flex justify-end">
            <Link
              href="/forgot-password"
              className="text-xs text-zinc-500 hover:text-indigo-600 transition-colors"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <div className="pt-1">
          <Button
            type="submit"
            size="full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-100" />
        <span className="text-xs text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-100" />
      </div>

      {/* Register link */}
      <p className="text-center text-sm text-zinc-500">
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
