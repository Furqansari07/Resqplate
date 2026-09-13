'use client';

import { useEffect, useState } from 'react';
import { Quote, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    quote: "We used to throw away trays of food every night. Now it's picked up within the hour.",
    name: 'Restaurant Owner',
    role: 'Donor',
  },
  {
    quote: 'The verification badge means I trust every pickup I accept — it feels safe and organized.',
    name: 'Delivery Volunteer',
    role: 'Volunteer',
  },
  {
    quote: 'Real-time tracking lets us plan meals for the day before the food even arrives.',
    name: 'Shelter Coordinator',
    role: 'Shelter / NGO',
  },
];

export default function HomeCarousel() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goTo = (i: number) => setIndex((i + testimonials.length) % testimonials.length);

  return (
    <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="animate-fade-in-up mb-8 text-center">
        <span className="badge bg-[var(--color-accent-light)] text-[var(--color-accent)]">What people say</span>
        <h2 className="mt-4 text-3xl font-bold text-[var(--foreground)] sm:text-4xl">
          Voices from the network
        </h2>
      </div>

      <div className="card animate-scale-in relative overflow-hidden p-8 sm:p-10">
        <Quote className="h-8 w-8 text-[var(--color-primary)] opacity-40" />

        <p key={index} className="animate-fade-in mt-4 min-h-20 text-lg font-medium text-[var(--foreground)] sm:text-xl">
          "{testimonials[index].quote}"
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <p className="font-semibold text-[var(--foreground)]">{testimonials[index].name}</p>
            <p className="text-sm text-[var(--foreground-subtle)]">{testimonials[index].role}</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-2)]"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] text-[var(--foreground-muted)] transition-colors hover:bg-[var(--surface-2)]"
              aria-label="Next testimonial"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-1.5">
          {testimonials.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-6 bg-[var(--color-primary)]' : 'w-1.5 bg-[var(--surface-2)]'
              }`}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}