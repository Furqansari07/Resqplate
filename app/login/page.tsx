'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { Globe, Mail } from 'lucide-react';
import Logo from '@/components/Logo';
import PasswordInput from '@/components/PasswordInput';
import { validateEmail, validateRequired } from '@/lib/validators';

type LoginView = 'main' | 'email-otp' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<LoginView>('main');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [otpEmail, setOtpEmail] = useState('');
  const [otp, setOtp] = useState('');

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(email);
    const passwordCheck = validateRequired(password, 'Password');
    if (!emailCheck.valid) return setError(emailCheck.message!);
    if (!passwordCheck.valid) return setError(passwordCheck.message!);

    setLoading(true);
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const emailCheck = validateEmail(otpEmail);
    if (!emailCheck.valid) return setError(emailCheck.message!);

    setLoading(true);
    try {
      const res = await fetch('/api/auth/send-email-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: otpEmail }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');

      setView('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const res = await signIn('email-otp', { email: otpEmail, otp, redirect: false });
      if (res?.error) throw new Error('Invalid or expired code');

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Verification failed');
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
            {view === 'email-otp' ? 'Sign in with Email Code' : view === 'otp' ? 'Enter Verification Code' : 'Sign in to your account'}
          </h2>
        </div>

        <div className="card p-8 space-y-6">
          {error && (
            <div className="animate-fade-in rounded-xl bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
              {error}
            </div>
          )}

          {view === 'main' && (
            <>
              <form onSubmit={handleEmailLogin} className="space-y-4" noValidate>
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
                  <div className="flex items-center justify-between">
                    <label className="label">Password</label>
                    <Link href="/forgot-password" className="mb-1.5 text-xs font-semibold text-[var(--color-primary)] hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <PasswordInput value={password} onChange={setPassword} placeholder="••••••••" />
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full">
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </form>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-[var(--border)]"></div>
                <span className="flex-shrink mx-4 text-xs uppercase text-[var(--foreground-subtle)] font-semibold">Or continue with</span>
                <div className="flex-grow border-t border-[var(--border)]"></div>
              </div>

              <div className="space-y-3">
                <button type="button" onClick={handleGoogleLogin} className="btn-secondary w-full">
                  <Globe className="h-4 w-4" /> Continue with Google
                </button>

                <button
                  type="button"
                  onClick={() => { setView('email-otp'); setError(''); }}
                  className="btn-secondary w-full"
                >
                  <Mail className="h-4 w-4" /> Sign In with Email Code
                </button>
              </div>
            </>
          )}

          {view === 'email-otp' && (
            <form onSubmit={handleSendOtp} className="space-y-4" noValidate>
              <div>
                <label className="label">Email Address</label>
                <input
                  type="email"
                  required
                  value={otpEmail}
                  onChange={(e) => setOtpEmail(e.target.value)}
                  className="input"
                  placeholder="name@example.com"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Sending code...' : 'Send Code'}
              </button>

              <button
                type="button"
                onClick={() => { setView('main'); setError(''); }}
                className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)] pt-2"
              >
                &larr; Back to Password Sign In
              </button>
            </form>
          )}

          {view === 'otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4" noValidate>
              <div className="text-center mb-2">
                <p className="text-xs text-[var(--foreground-subtle)]">
                  Code sent to <span className="font-semibold text-[var(--foreground)]">{otpEmail}</span>
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
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setView('email-otp'); setOtp(''); setError(''); }}
                className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)] pt-2"
              >
                Use a different email
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-[var(--foreground-subtle)]">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-[var(--color-primary)] hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}