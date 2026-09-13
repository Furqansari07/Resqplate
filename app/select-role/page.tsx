'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Carrot, Bike, Home as HomeIcon } from 'lucide-react';

const roles = [
  {
    value: 'donor',
    Icon: Carrot,
    title: 'Food Donor',
    description: 'List surplus food from your restaurant, store, or kitchen for pickup.',
  },
  {
    value: 'volunteer',
    Icon: Bike,
    title: 'Volunteer Courier',
    description: 'Pick up donated food and deliver it to shelters near you.',
  },
  {
    value: 'shelter',
    Icon: HomeIcon,
    title: 'Shelter / NGO',
    description: 'Receive and confirm food donations for the people you serve.',
  },
];

export default function SelectRolePage() {
  const router = useRouter();
  const { update } = useSession();
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/user/select-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selected }),
      });

      if (!res.ok) {
        throw new Error('Could not save your role, please try again');
      }

      await update({ role: selected });
      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8 animate-fade-in-up">
        <div className="text-center">
          <span className="icon-badge mx-auto h-14 w-14 text-2xl">
            🍲
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-[var(--foreground)]">
            One more step
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            How would you like to use ResQPlate?
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20 text-center">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          {roles.map((role) => (
            <button
              key={role.value}
              type="button"
              onClick={() => setSelected(role.value)}
              className={`card card-hover p-6 text-left transition-all ${
                selected === role.value
                  ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40'
                  : ''
              }`}
            >
              <div className="icon-badge h-11 w-11">
                <role.Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-bold text-[var(--foreground)]">
                {role.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                {role.description}
              </p>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={!selected || loading}
          onClick={handleContinue}
          className="btn-primary w-full"
        >
          {loading ? 'Saving...' : 'Continue'}
        </button>
      </div>
    </div>
  );
}