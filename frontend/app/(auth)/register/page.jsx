'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

// Password strength scorer — purely visual feedback
function getPasswordStrength(password) {
  if (!password) return { score: 0, label: '', color: '' };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const map = {
    0: { label: '', color: '' },
    1: { label: 'Weak', color: 'bg-red-400' },
    2: { label: 'Fair', color: 'bg-orange-400' },
    3: { label: 'Good', color: 'bg-yellow-400' },
    4: { label: 'Strong', color: 'bg-green-400' },
    5: { label: 'Very strong', color: 'bg-green-500' },
  };
  return { score, ...map[score] };
}

const ROLES = [
  { value: 'customer', label: 'Customer', description: 'Browse and purchase products' },
  { value: 'seller', label: 'Seller', description: 'List and manage your products' },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [form, setForm] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const strength = getPasswordStrength(form.password);

  useEffect(() => {
    if (isAuthenticated()) router.replace('/');
    return () => clearError();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.email)
      errs.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = 'Enter a valid email address.';

    if (!form.password)
      errs.password = 'Password is required.';
    else if (form.password.length < 8)
      errs.password = 'Password must be at least 8 characters.';

    if (!form.confirmPassword)
      errs.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    const result = await register(
      form.email.trim().toLowerCase(),
      form.password,
      form.role
    );
    if (result.success) {
      router.push('/');
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Create an account
        </h1>
        <p className="text-sm text-zinc-500">
          Get started with ShopStack today.
        </p>
      </div>

      {error && (
        <Alert type="error" message={error} onDismiss={clearError} />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* Role selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-zinc-700 select-none">
            Account type <span className="text-indigo-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {ROLES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, role: r.value }))}
                className={[
                  'flex flex-col items-start gap-0.5 rounded-xl border p-3 text-left transition-all duration-150',
                  form.role === r.value
                    ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20'
                    : 'border-zinc-200 bg-white hover:border-zinc-300',
                ].join(' ')}
              >
                <span className={`text-sm font-medium ${form.role === r.value ? 'text-indigo-700' : 'text-zinc-800'}`}>
                  {r.label}
                </span>
                <span className="text-xs text-zinc-400 leading-tight">
                  {r.description}
                </span>
              </button>
            ))}
          </div>
        </div>

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

        <div className="space-y-2">
          <Input
            id="password"
            label="Password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Min. 8 characters"
            value={form.password}
            onChange={handleChange('password')}
            error={fieldErrors.password}
          />

          {/* Password strength bar */}
          {form.password && (
            <div className="space-y-1.5">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={[
                      'h-1 flex-1 rounded-full transition-all duration-300',
                      i <= strength.score ? strength.color : 'bg-zinc-100',
                    ].join(' ')}
                  />
                ))}
              </div>
              {strength.label && (
                <p className="text-xs text-zinc-400">
                  Strength:{' '}
                  <span
                    className={
                      strength.score <= 2
                        ? 'text-red-500'
                        : strength.score <= 3
                        ? 'text-yellow-600'
                        : 'text-green-600'
                    }
                  >
                    {strength.label}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>

        <Input
          id="confirmPassword"
          label="Confirm password"
          type="password"
          required
          autoComplete="new-password"
          placeholder="Repeat your password"
          value={form.confirmPassword}
          onChange={handleChange('confirmPassword')}
          error={fieldErrors.confirmPassword}
        />

        <div className="pt-1">
          <Button
            type="submit"
            size="full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            Create account
          </Button>
        </div>

        <p className="text-center text-xs text-zinc-400 leading-relaxed">
          By creating an account, you agree to our{' '}
          <Link href="/terms" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
            Terms
          </Link>{' '}
          and{' '}
          <Link href="/privacy" className="text-zinc-600 hover:text-zinc-900 underline underline-offset-2">
            Privacy Policy
          </Link>.
        </p>
      </form>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-zinc-100" />
        <span className="text-xs text-zinc-400">or</span>
        <div className="h-px flex-1 bg-zinc-100" />
      </div>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}