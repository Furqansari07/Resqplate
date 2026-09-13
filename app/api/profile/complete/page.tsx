'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function CompleteProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const [organizationName, setOrganizationName] = useState('');
  const [address, setAddress] = useState('');
  const [shelterCapacity, setShelterCapacity] = useState('');
  const [shelterCapacityUnit, setShelterCapacityUnit] = useState('meals');
  const [vehicleType, setVehicleType] = useState('');

  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/profile')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setOrganizationName(data.user.organizationName || '');
          setAddress(data.user.address || '');
          setShelterCapacity(data.user.shelterCapacity?.toString() || '');
          setShelterCapacityUnit(data.user.shelterCapacityUnit || 'meals');
          setVehicleType(data.user.vehicleType || '');
        }
      })
      .finally(() => setLoadingProfile(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName,
          address,
          shelterCapacity: shelterCapacity ? Number(shelterCapacity) : undefined,
          shelterCapacityUnit,
          vehicleType,
        }),
      });

      if (!res.ok) throw new Error('Could not save profile');

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <p className="text-[var(--foreground-muted)] text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--background)] px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 animate-fade-in-up">
        <div className="text-center">
          <span className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-[var(--color-primary-light)] text-2xl">
            📋
          </span>
          <h1 className="mt-4 text-3xl font-extrabold text-[var(--foreground)]">
            Complete your profile
          </h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            This helps donors, volunteers, and shelters trust and coordinate with you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-8 space-y-4">
          {error && (
            <div className="rounded-xl bg-[var(--color-danger-light)] p-3 text-sm text-[var(--color-danger)] border border-[var(--color-danger)]/20">
              {error}
            </div>
          )}

          {(role === 'donor' || role === 'shelter') && (
            <div>
              <label className="label">
                {role === 'shelter' ? 'NGO / Shelter Name' : 'Business / Restaurant Name'}
              </label>
              <input
                type="text"
                required
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="input"
              />
            </div>
          )}

          <div>
            <label className="label">
              {role === 'shelter' ? 'Shelter Address' : role === 'donor' ? 'Pickup Address' : 'Your Address'}
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="input"
            />
          </div>

          {role === 'shelter' && (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="label">Capacity</label>
                <input
                  type="number"
                  min={0}
                  required
                  value={shelterCapacity}
                  onChange={(e) => setShelterCapacity(e.target.value)}
                  className="input"
                />
              </div>
              <div className="w-32">
                <label className="label">Unit</label>
                <select value={shelterCapacityUnit} onChange={(e) => setShelterCapacityUnit(e.target.value)} className="input">
                  <option value="meals">Meals</option>
                  <option value="kg">Kg</option>
                </select>
              </div>
            </div>
          )}

          {role === 'volunteer' && (
            <div>
              <label className="label">
                Vehicle Type <span className="normal-case text-[var(--foreground-subtle)]">(optional)</span>
              </label>
              <input
                type="text"
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="input"
                placeholder="e.g. Bike, Car, On foot"
              />
            </div>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Saving...' : 'Save & Continue'}
          </button>

          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="w-full text-center text-xs text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
          >
            Skip for now
          </button>
        </form>
      </div>
    </div>
  );
}