'use client';

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Slide = {
  image: string;
  path: string;
  tag: string;
  title: string;
  description: string;
};

const slides: Slide[] = [
  {
    image: '/screenshots/register.jpg',
    path: 'resqplate.app/register',
    tag: 'Sign Up',
    title: 'Create an account in under a minute',
    description: 'Pick a role, verify your email with a one-time code, and you\'re in.',
  },
  {
    image: '/screenshots/signin.jpg',
    path: 'resqplate.app/login',
    tag: 'Sign In',
    title: 'Multiple ways back in',
    description: 'Password, email code, or continue with Google — whichever is fastest.',
  },
  {
    image: '/screenshots/donor-dashboard.jpg',
    path: 'resqplate.app/dashboard',
    tag: 'Donor',
    title: 'Track every listing and pickup',
    description: 'Live counts of available listings, pickups in progress, and meals delivered.',
  },
  {
    image: '/screenshots/volunteer-dashboard.jpg',
    path: 'resqplate.app/dashboard',
    tag: 'Volunteer',
    title: 'Pickups and deliveries at a glance',
    description: 'See what\'s waiting for pickup, what\'s in transit, and completed deliveries.',
  },
  {
    image: '/screenshots/shelter-dashboard.jpg',
    path: 'resqplate.app/dashboard',
    tag: 'Shelter / NGO',
    title: 'Confirm receipt in one tap',
    description: 'Monitor incoming donations and confirm the moment food arrives.',
  },
];

export default function ProductShowcase() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i: number) => setIndex((i + slides.length) % slides.length);
  const slide = slides[index];

  return (
    <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold text-[var(--foreground)]">Inside ResQPlate</h2>
        <div className="flex flex-wrap gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.tag}
              type="button"
              onClick={() => goTo(i)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                i === index
                  ? 'bg-[var(--color-primary)] text-white'
                  : 'bg-[var(--surface-2)] text-[var(--foreground-subtle)] hover:text-[var(--foreground)]'
              }`}
            >
              {s.tag}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-hidden p-0">
        {/* Fake browser chrome */}
        <div className="flex items-center gap-1.5 border-b border-[var(--border)] bg-[var(--surface-2)] px-3 py-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#f87171]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#f59e0b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
          <div className="ml-2 flex-1 truncate rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-center text-[11px] text-[var(--foreground-subtle)]">
            {slide.path}
          </div>
        </div>

        {/* Screenshot with overlay arrows */}
        <div className="group relative flex h-[200px] items-center justify-center overflow-hidden bg-[var(--background)] sm:h-[260px] md:h-[320px]">
          <img
            key={index}
            src={slide.image}
            alt={slide.title}
            className="animate-fade-in h-full w-full object-contain"
          />

          <button
            type="button"
            onClick={() => goTo(index - 1)}
            className="absolute left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            aria-label="Previous screenshot"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
            aria-label="Next screenshot"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Compact caption row */}
        <div className="flex items-center justify-between gap-4 px-4 py-3">
          <div className="min-w-0">
            <p key={`t-${index}`} className="animate-fade-in truncate text-sm font-semibold text-[var(--foreground)]">
              {slide.title}
            </p>
            <p key={`d-${index}`} className="animate-fade-in mt-0.5 line-clamp-1 text-xs text-[var(--foreground-muted)]">
              {slide.description}
            </p>
          </div>
          <div className="flex shrink-0 gap-1">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index ? 'w-4 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--surface-2)]'
                }`}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}