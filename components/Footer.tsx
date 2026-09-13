import Logo from '@/components/Logo';

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-2 text-center">
        <span className="flex items-center gap-2 text-sm font-bold text-[var(--foreground)]">
          <Logo size={20} />
          ResQPlate
        </span>
        <p className="text-xs text-[var(--foreground-subtle)]">
          © {new Date().getFullYear()} ResQPlate. All rights reserved.
        </p>
      </div>
    </footer>
  );
}