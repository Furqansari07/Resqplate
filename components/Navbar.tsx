'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import NotificationBell from '@/components/NotificationBell';

type SessionUser = {
  name?: string;
  role?: 'donor' | 'volunteer' | 'shelter' | 'admin';
};

type NavLink = {
  href: string;
  label: string;
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user as SessionUser | undefined;

  const links: NavLink[] = [{ href: '/dashboard', label: 'Dashboard' }];

  if (user?.role === 'donor') {
    links.push({ href: '/donations', label: 'Donations' });
  }

  if (user?.role === 'volunteer') {
    links.push({ href: '/volunteer', label: 'Available Pickups' });
    links.push({ href: '/volunteer/pickups', label: 'My Pickups' });
  }

  if (user?.role === 'shelter') {
    links.push({ href: '/shelter', label: 'Shelter' });
  }
  if (user?.role === 'admin') {
    links.push({ href: '/admin', label: 'Admin' });
  }
  links.push({ href: '/profile', label: 'Profile' });

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const linkClasses = (href: string) =>
    `whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
      isLinkActive(href)
        ? 'bg-[var(--color-primary)] text-white shadow-sm'
        : 'text-[var(--foreground)] hover:bg-[var(--color-primary-light)]'
    }`;

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="border-b border-[var(--color-border)] bg-[var(--color-card)]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-xl font-bold text-[var(--color-primary)]"
          >
            <span className="text-2xl">🍲</span>
            ResQPlate
          </Link>

          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={linkClasses(link.href)}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {user?.name && (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-sm font-bold text-[var(--color-secondary-hover)]">
                {initial}
              </span>
              <span className="text-sm text-[var(--foreground)]">
                <b>{user.name}</b>
                {user.role ? (
                  <span className="ml-1 text-[var(--color-text-muted)]">
                    ({user.role})
                  </span>
                ) : null}
              </span>
            </div>
          )}

          <NotificationBell />

          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/login' })}
            className="rounded-full bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-primary-hover)]"
          >
            Sign Out
          </button>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--color-border)] px-4 py-2 sm:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={linkClasses(link.href)}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}