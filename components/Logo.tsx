export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="resqplate-gradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-accent)" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="12" fill="url(#resqplate-gradient)" />
      <path
        d="M13 12v6a2 2 0 0 0 2 2v8m0-8a2 2 0 0 0 2-2v-6m-2 8v-8m9 0v16a4.5 4.5 0 0 1-3-4.2c0-1.6.9-2.6 1.8-3.5.9-.9 1.7-1.9 1.7-3.5a4.5 4.5 0 0 0-.5-4.8Z"
        stroke="white"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}