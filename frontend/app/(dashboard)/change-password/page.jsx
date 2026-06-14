'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { changePassword, isLoading, error, clearError, isAuthenticated, user } =
    useAuthStore();

  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
    return () => clearError();
  }, []);

  const validate = () => {
    const errs = {};
    if (!form.oldPassword)
      errs.oldPassword = 'Current password is required.';

    if (!form.newPassword)
      errs.newPassword = 'New password is required.';
    else if (form.newPassword.length < 6)
      errs.newPassword = 'New password must be at least 6 characters.';
    else if (form.newPassword === form.oldPassword)
      errs.newPassword = 'New password must differ from current password.';

    if (!form.confirmPassword)
      errs.confirmPassword = 'Please confirm your new password.';
    else if (form.newPassword !== form.confirmPassword)
      errs.confirmPassword = 'Passwords do not match.';

    return errs;
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (fieldErrors[field])
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    if (error) clearError();
    if (success) setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setFieldErrors(errs);
      return;
    }

    // changePassword revokes all sessions and clears local auth state
    const result = await changePassword(form.oldPassword, form.newPassword);
    if (result.success) {
      // Redirect to login — all sessions are revoked per our auth-service design
      router.push('/login?session=expired');
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-7">
        {/* Back nav */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5"/><path d="m12 19-7-7 7-7"/>
            </svg>
            Back
          </Link>
        </div>

        {/* Header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Change password
          </h1>
          <p className="text-sm text-zinc-500">
            {user?.email
              ? `Signed in as ${user.email}.`
              : 'Update your account password.'}{' '}
            <span className="text-zinc-400 text-xs">
              All sessions will be revoked.
            </span>
          </p>
        </div>

        {error && (
          <Alert type="error" message={error} onDismiss={clearError} />
        )}

        {success && (
          <Alert
            type="success"
            message="Password updated. Redirecting you to sign in…"
          />
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input
            id="oldPassword"
            label="Current password"
            type="password"
            required
            autoComplete="current-password"
            autoFocus
            placeholder="Your current password"
            value={form.oldPassword}
            onChange={handleChange('oldPassword')}
            error={fieldErrors.oldPassword}
          />

          <div className="h-px bg-zinc-100" />

          <Input
            id="newPassword"
            label="New password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Min. 6 characters"
            value={form.newPassword}
            onChange={handleChange('newPassword')}
            error={fieldErrors.newPassword}
            hint="Must be at least 6 characters."
          />

          <Input
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            required
            autoComplete="new-password"
            placeholder="Repeat new password"
            value={form.confirmPassword}
            onChange={handleChange('confirmPassword')}
            error={fieldErrors.confirmPassword}
          />

          {/* Security notice */}
          <div className="flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3 text-xs text-amber-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>
              Changing your password will sign you out of all devices. You&apos;ll
              need to sign in again.
            </span>
          </div>

          <div className="pt-1 flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              className="flex-1"
              onClick={() => router.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              className="flex-1"
              isLoading={isLoading}
              disabled={isLoading}
            >
              Update password
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}