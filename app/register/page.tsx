'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function RegisterPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'volunteer',
    address: '',
    phone: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Same warm-up as the login page — gets Mongoose's first (slow)
    // connection to Atlas out of the way before the user submits.
    fetch('/api/test_db').catch(() => {});
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Unable to create account');
        return;
      }

      router.replace('/login');
    } catch {
      setError('Unable to reach the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[var(--background)] px-4 py-12">
      <div className="mx-auto max-w-md">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-secondary-light)] text-2xl">
            🌱
          </div>
          <h1 className="text-3xl font-bold text-[var(--foreground)]">
            Join ResQPlate
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            Create your account and start making a difference
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          autoComplete="off"
          className="card-warm mt-8 space-y-4 p-6 sm:p-8"
        >
          {error && (
            <p className="rounded-2xl border border-[var(--color-primary)]/30 bg-[var(--color-primary-light)] p-3 text-sm text-[var(--color-primary-hover)]">
              {error}
            </p>
          )}

          <div>
            <label htmlFor="register-name" className="label-warm">
              Full Name
            </label>
            <input
              id="register-name"
              name="name"
              required
              autoComplete="off"
              placeholder="Enter your full name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-warm"
            />
          </div>

          <div>
            <label htmlFor="register-email" className="label-warm">
              Email Address
            </label>
            <input
              id="register-email"
              name="email"
              required
              type="email"
              autoComplete="off"
              placeholder="Enter your email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-warm"
            />
          </div>

          <div>
            <label htmlFor="register-password" className="label-warm">
              Password
            </label>
            <input
              id="register-password"
              name="password"
              required
              type="password"
              minLength={8}
              autoComplete="off"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-warm"
            />
          </div>

          <div>
            <label htmlFor="register-role" className="label-warm">
              I am registering as a
            </label>
            <select
              id="register-role"
              name="role"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="input-warm"
            >
              <option value="donor">Food Donor</option>
              <option value="volunteer">Volunteer</option>
              <option value="shelter">Shelter / NGO</option>
            </select>
          </div>

          <div>
            <label htmlFor="register-address" className="label-warm">
              Address{' '}
              <span className="font-normal text-[var(--color-text-muted)]">
                (optional)
              </span>
            </label>
            <input
              id="register-address"
              name="address"
              autoComplete="off"
              placeholder="Enter your address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="input-warm"
            />
          </div>

          <div>
            <label htmlFor="register-phone" className="label-warm">
              Phone Number{' '}
              <span className="font-normal text-[var(--color-text-muted)]">
                (optional)
              </span>
            </label>
            <input
              id="register-phone"
              name="phone"
              type="tel"
              autoComplete="off"
              placeholder="Enter your phone number"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="input-warm"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm text-[var(--color-text-muted)]">
            Already registered?{' '}
            <Link href="/login" className="font-semibold text-[var(--color-primary)]">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}