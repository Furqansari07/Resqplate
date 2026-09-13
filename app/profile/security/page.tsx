'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Mail } from 'lucide-react';
import Navbar from '@/components/Navbar';
import PasswordInput from '@/components/PasswordInput';
import { validateEmail, validatePassword } from '@/lib/validators';

export default function SecurityPage() {
  const router = useRouter();

  // Change password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // Change email
  const [emailView, setEmailView] = useState<'form' | 'otp'>('form');
  const [newEmail, setNewEmail] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    const check = validatePassword(newPassword);
    if (!check.valid) return setPwError(check.message!);

    setPwLoading(true);
    try {
      const res = await fetch('/api/profile/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setPwSuccess(data.message);
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwError(err.message || 'Something went wrong');
    } finally {
      setPwLoading(false);
    }
  };

  const handleStartEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');
    setEmailSuccess('');

    const check = validateEmail(newEmail);
    if (!check.valid) return setEmailError(check.message!);

    setEmailLoading(true);
    try {
      const res = await fetch('/api/profile/change-email/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setEmailView('otp');
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError('');

    if (!emailOtp || emailOtp.length !== 6) return setEmailError('Enter the 6-digit code');

    setEmailLoading(true);
    try {
      const res = await fetch('/api/profile/change-email/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: emailOtp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong');

      setEmailSuccess(data.message);
      setEmailView('form');
      setNewEmail('');
      setEmailOtp('');
      router.refresh();
    } catch (err: any) {
      setEmailError(err.message || 'Something went wrong');
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Account Security</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">
          Manage your password and email address.
        </p>

        {/* Change Password */}
        <section className="card mt-6 p-6">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Change Password</h2>
          </div>

          {pwError && (
            <p className="mt-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="mt-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
              {pwSuccess}
            </p>
          )}

          <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
            <div>
              <label className="label">Current Password</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="••••••••" />
            </div>
            <div>
              <label className="label">New Password</label>
              <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Create a strong password" showChecklist />
            </div>
            <button type="submit" disabled={pwLoading} className="btn-primary w-full">
              {pwLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </section>

        {/* Change Email */}
        <section className="card mt-6 p-6">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-lg font-semibold text-[var(--foreground)]">Change Email</h2>
          </div>

          {emailError && (
            <p className="mt-3 rounded-xl border border-[var(--color-danger)]/20 bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)]">
              {emailError}
            </p>
          )}
          {emailSuccess && (
            <p className="mt-3 rounded-xl border border-[var(--color-secondary)]/20 bg-[var(--color-secondary-light)] p-3 text-sm text-[var(--color-secondary)]">
              {emailSuccess}
            </p>
          )}

          {emailView === 'form' ? (
            <form onSubmit={handleStartEmailChange} className="mt-4 space-y-4">
              <div>
                <label className="label">New Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="input"
                  placeholder="new.email@example.com"
                />
              </div>
              <button type="submit" disabled={emailLoading} className="btn-primary w-full">
                {emailLoading ? 'Sending code...' : 'Send Verification Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyEmailChange} className="mt-4 space-y-4">
              <p className="text-xs text-[var(--foreground-subtle)]">
                Code sent to <b className="text-[var(--foreground)]">{newEmail}</b>
              </p>
              <input
                type="text"
                maxLength={6}
                required
                value={emailOtp}
                onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                className="input text-center tracking-widest text-lg"
                placeholder="123456"
              />
              <button type="submit" disabled={emailLoading} className="btn-primary w-full">
                {emailLoading ? 'Verifying...' : 'Confirm New Email'}
              </button>
              <button
                type="button"
                onClick={() => { setEmailView('form'); setEmailOtp(''); setEmailError(''); }}
                className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
              >
                &larr; Use a different email
              </button>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}