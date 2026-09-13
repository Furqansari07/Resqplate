'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import NotificationBell from '@/components/NotificationBell';
import Logo from '@/components/Logo';
import {
  LayoutDashboard,
  UtensilsCrossed,
  Bike,
  Route,
  Home as HomeIcon,
  ShieldCheck,
  BadgeCheck,
  User as UserIcon,
  LogOut,
} from 'lucide-react';

type SessionUser = {
  name?: string;
  role?: 'donor' | 'volunteer' | 'shelter' | 'admin';
  verificationStatus?: string;
  profilePhotoUrl?: string;
};

type NavLink = {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
};

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const user = session?.user as SessionUser | undefined;

  const links: NavLink[] = [{ href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard }];

  if (mounted) {
    if (user?.role === 'donor') {
      links.push({ href: '/donations', label: 'Donations', Icon: UtensilsCrossed });
    }

    if (user?.role === 'volunteer') {
      links.push({ href: '/volunteer', label: 'Available Pickups', Icon: Bike });
      links.push({ href: '/volunteer/pickups', label: 'My Pickups', Icon: Route });
    }

    if (user?.role === 'shelter') {
      links.push({ href: '/shelter', label: 'Shelter', Icon: HomeIcon });
    }
    if (user?.role === 'admin') {
      links.push({ href: '/admin', label: 'Admin', Icon: ShieldCheck });
    }
    if (user?.role === 'volunteer' || user?.role === 'shelter' || user?.role === 'donor') {
      links.push({ href: '/profile/verify', label: 'Get Verified', Icon: BadgeCheck });
    }
  }

  links.push({ href: '/profile', label: 'Profile', Icon: UserIcon });

  const isLinkActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }

    if (href === '/volunteer') {
      return pathname === '/volunteer';
    }

    if (href === '/profile') {
      return pathname === '/profile';
    }

    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const linkClasses = (href: string) =>
    `nav-link ${isLinkActive(href) ? 'nav-link-active' : 'nav-link-inactive'}`;

  const initial = (user?.name || '?').trim().charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--background)]/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-3 py-2.5 sm:px-4 lg:px-6">
        <div className="flex min-w-0 items-center gap-3 lg:gap-5">
          <Link
            href="/dashboard"
            className="flex shrink-0 items-center gap-2 text-lg font-bold text-[var(--foreground)] transition-opacity hover:opacity-80"
          >
            <Logo size={30} />
            <span>ResQPlate</span>
          </Link>

          {/* Nav links with text labels. Its own overflow scroll (not the
              whole header row's), so it never clips sibling dropdowns
              like the notification bell. */}
          <nav className="hidden max-w-full items-center gap-0.5 overflow-x-auto sm:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${linkClasses(link.href)} inline-flex shrink-0 items-center gap-1.5 !px-2.5`}
              >
                <link.Icon className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">{link.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {mounted && user?.name && (
            <div className="hidden items-center gap-2 lg:flex">
              <div className="relative shrink-0">
                {user.profilePhotoUrl ? (
                  <img
                    src={user.profilePhotoUrl}
                    alt={user.name}
                    className="h-8 w-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-xs font-bold text-[var(--color-secondary)]">
                    {initial}
                  </span>
                )}
                {user.verificationStatus === 'verified' && (
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white ring-2 ring-[var(--background)]">
                    <BadgeCheck className="h-2.5 w-2.5" />
                  </span>
                )}
              </div>
              <span className="whitespace-nowrap text-sm text-[var(--foreground)]">
                <b>{user.name}</b>
                {user.role ? (
                  <span className="ml-1 text-[var(--foreground-subtle)]">
                    ({user.role})
                  </span>
                ) : null}
              </span>
            </div>
          )}

          {mounted && user?.name && (
            <div className="relative shrink-0 lg:hidden">
              {user.profilePhotoUrl ? (
                <img
                  src={user.profilePhotoUrl}
                  alt={user.name}
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-secondary-light)] text-xs font-bold text-[var(--color-secondary)]">
                  {initial}
                </span>
              )}
              {user.verificationStatus === 'verified' && (
                <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[var(--color-secondary)] text-white ring-2 ring-[var(--background)]">
                  <BadgeCheck className="h-2.5 w-2.5" />
                </span>
              )}
            </div>
          )}

          <NotificationBell />

          <button
            type="button"
            onClick={() => signOut({ redirectTo: '/' })}
            className="btn-secondary !px-3 !py-2 text-sm"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden lg:inline">Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile-only expanded links strip, with text labels */}
      <nav className="flex gap-1 overflow-x-auto border-t border-[var(--border)] px-3 py-2 sm:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`${linkClasses(link.href)} inline-flex shrink-0 items-center gap-1.5`}
          >
            <link.Icon className="h-4 w-4" />
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}