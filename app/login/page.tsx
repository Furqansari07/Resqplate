'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Warms up the database connection in the background as soon as this
    // page loads, so by the time the user submits the form, Mongoose's
    // first (slow) connection to Atlas has already happened instead of
    // happening during their sign-in attempt.
    fetch('/api/test_db').catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });

      if (result?.error) {
        setError('Invalid email or password. Please try again.');
      } else {
        router.replace('/dashboard');
        router.refresh();
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-[var(--background)] px-4 py-12">
      <div className="mx-auto w-full max-w-md text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-2xl">
          👋
        </div>
        <h2 className="text-3xl font-bold text-[var(--foreground)]">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Sign in to ResQPlate
        </p>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md">
        <div className="card-warm p-6 sm:p-8">
          {error && (
            <div className="mb-4 rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] p-4 text-sm text-[var(--color-primary-hover)]">
              {error}
            </div>
          )}

          <form
            className="space-y-5"
            onSubmit={handleSubmit}
            autoComplete="off"
          >
            <div>
              <label htmlFor="login-email" className="label-warm">
                Email Address
              </label>
              <input
                id="login-email"
                name="email"
                type="email"
                required
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-warm"
              />
            </div>

            <div>
              <label htmlFor="login-password" className="label-warm">
                Password
              </label>
              <input
                id="login-password"
                name="password"
                type="password"
                required
                autoComplete="off"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-warm"
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">
              Don&apos;t have an account?{' '}
              <Link
                href="/register"
                className="font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
              >
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}