import Link from 'next/link';

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[var(--background)] px-4 sm:px-6 lg:px-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[var(--color-accent-light)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-[var(--color-secondary-light)] blur-2xl"
      />

      <div className="card-warm relative w-full max-w-md space-y-8 p-8 text-center">
        <div>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-3xl bg-[var(--color-primary-light)] text-3xl">
            🍲
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-[var(--color-primary)]">
            ResQPlate
          </h1>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Connecting food donors, volunteers, and shelters to eliminate
            food waste and fight hunger — one plate at a time.
          </p>
        </div>

        <div className="space-y-3">
          <Link href="/login" className="btn-primary w-full">
            Log In
          </Link>

          <Link href="/register" className="btn-secondary w-full">
            Create an Account
          </Link>
        </div>

        <div className="flex justify-center gap-6 pt-2 text-xs text-[var(--color-text-muted)]">
          <span>🥕 Donors</span>
          <span>🚴 Volunteers</span>
          <span>🏠 Shelters</span>
        </div>
      </div>
    </div>
  );
}