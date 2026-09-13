'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Globe } from 'lucide-react';
import Logo from '@/components/Logo';
import PhoneInput from '@/components/PhoneInput';
import PasswordInput from '@/components/PasswordInput';
import { validateEmail, validateName, validatePassword } from '@/lib/validators';

type RegisterView = 'details' | 'otp';

export default function RegisterPage() {
  const router = useRouter();
  const [view, setView] = useState<RegisterView>('details');

  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [phoneValid, setPhoneValid] = useState(false);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('donor');
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleStartRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const checks = [
      validateName(firstName, 'First name'),
      ...(middleName ? [validateName(middleName, 'Middle name')] : []),
      validateName(lastName, 'Last name'),
      validateEmail(email),
      validatePassword(password),
    ];

    const firstFailure = checks.find((c) => !c.valid);
    if (firstFailure) {
      setError(firstFailure.message || 'Please check the form');
      return;
    }

    if (!phoneValid) {
      setError('Enter a valid phone number for the selected country');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, middleName, lastName, email, phone, password, role }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setView('otp');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code sent to your email');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/register/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      const loginRes = await signIn('credentials', { email, password, redirect: false });

      if (loginRes?.error) {
        router.push('/login?registered=true');
        return;
      }

      router.push('/profile?required=1');
      router.refresh();
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
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-[var(--foreground)]">
            {view === 'otp' ? 'Verify your email' : 'Create an account'}
          </h2>
        </div>

        <div className="card p-8 space-y-6">
          {error && (
            <div className="animate-fade-in rounded-xl bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
              {error}
            </div>
          )}

          {view === 'details' && (
            <>
              <form onSubmit={handleStartRegister} className="space-y-4" noValidate>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="label">First Name</label>
                    <input
                      type="text"
                      required
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="input"
                      placeholder="John"
                    />
                  </div>

                  <div>
                    <label className="label">Middle Name</label>
                    <input
                      type="text"
                      value={middleName}
                      onChange={(e) => setMiddleName(e.target.value)}
                      className="input"
                      placeholder="Optional"
                    />
                  </div>

                  <div>
                    <label className="label">Last Name</label>
                    <input
                      type="text"
                      required
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="input"
                      placeholder="Doe"
                    />
                  </div>
                </div>

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

                <div>
                  <label className="label">Phone Number</label>
                  <PhoneInput onChange={(value, valid) => { setPhone(value); setPhoneValid(valid); }} />
                </div>

                <div>
                  <label className="label">Password</label>
                  <PasswordInput
                    value={password}
                    onChange={setPassword}
                    placeholder="Create a strong password"
                    showChecklist
                  />
                </div>

                <div>
                  <label className="label">Account Role</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)} className="input" required>
                    <option value="donor">Food Donor</option>
                    <option value="volunteer">Volunteer</option>
                    <option value="shelter">Shelter / NGO</option>
                  </select>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Sending code...' : 'Continue'}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[var(--border)]"></div>
                <span className="flex-shrink mx-4 text-xs uppercase text-[var(--foreground-subtle)] font-semibold">Or register with</span>
                <div className="flex-grow border-t border-[var(--border)]"></div>
              </div>

              <button
                type="button"
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="btn-secondary w-full"
              >
                <Globe className="h-4 w-4" /> Continue with Google
              </button>
            </>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerify} className="space-y-4" noValidate>
              <div className="text-center mb-2">
                <p className="text-xs text-[var(--foreground-subtle)]">
                  We sent a code to <span className="font-semibold text-[var(--foreground)]">{email}</span>
                </p>
              </div>

              <div>
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

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Verifying...' : 'Verify & Create Account'}
              </button>

              <button
                type="button"
                onClick={() => { setView('details'); setOtp(''); setError(''); }}
                className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)] pt-2"
              >
                &larr; Edit details
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--foreground-subtle)]">
          Already have an account?{' '}
          <Link href="/login" className="font-semibold text-[var(--color-primary)] hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}