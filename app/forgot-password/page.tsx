'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { KeyRound } from 'lucide-react';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';
import { validateEmail, validatePassword } from '@/lib/validators';

type View = 'email' | 'reset';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('email');

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) return setError(emailCheck.message!);

    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setSuccess(data.message);
      setView('reset');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) return setError('Enter the 6-digit code');

    const passwordCheck = validatePassword(newPassword);
    if (!passwordCheck.valid) return setError(passwordCheck.message!);

    setLoading(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      router.push('/login?reset=true');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold text-[var(--foreground)]">
            <Logo size={40} />
            ResQPlate
          </Link>
          <h2 className="mt-4 flex items-center justify-center gap-2 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            <KeyRound className="h-7 w-7 text-[var(--color-primary)]" />
            Reset your password
          </h2>
        </div>

        <div className="card p-8 space-y-6">
          {error && (
            <div className="animate-fade-in rounded-xl bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
              {error}
            </div>
          )}
          {success && view === 'reset' && (
            <div className="animate-fade-in rounded-xl bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)] border border-[var(--color-secondary)]/20">
              {success}
            </div>
          )}

          {view === 'email' && (
            <form onSubmit={handleSendCode} className="space-y-4" noValidate>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  placeholder="name@example.com"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </form>
          )}

          {view === 'reset' && (
            <form onSubmit={handleReset} className="space-y-4" noValidate>
              <div>
                <label className="label">6-Digit Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="input text-center tracking-widest text-lg"
                  placeholder="123456"
                />
              </div>

              <div>
                <label className="label">New Password</label>
                <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Create a strong password" showChecklist />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>

              <button
                type="button"
                onClick={() => { setView('email'); setOtp(''); setError(''); }}
                className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)] pt-2"
              >
                &larr; Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--foreground-subtle)]">
          Remembered your password?{' '}
          <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}