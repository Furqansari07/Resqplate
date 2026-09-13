'use client';

import { useState } from 'react';
import { passwordRules } from '@/lib/validators';

type PasswordInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  showChecklist?: boolean;
  autoComplete?: string;
};

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  showChecklist = false,
  autoComplete = 'off',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          required
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input pr-11"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground)] transition-colors"
          tabIndex={-1}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? '🙈' : '👁️'}
        </button>
      </div>

      {showChecklist && value.length > 0 && (
        <ul className="mt-2 space-y-1 animate-fade-in">
          {passwordRules.map((rule) => {
            const passed = rule.test(value);
            return (
              <li
                key={rule.key}
                className={`flex items-center gap-2 text-xs transition-colors ${
                  passed ? 'text-[var(--color-secondary)]' : 'text-[var(--foreground-subtle)]'
                }`}
              >
                <span>{passed ? '✓' : '○'}</span>
                {rule.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}