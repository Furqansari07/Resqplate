export type ValidationResult = { valid: boolean; message?: string };

export function validateEmail(email: string): ValidationResult {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email.trim()) return { valid: false, message: 'Email is required' };
  if (!re.test(email)) return { valid: false, message: 'Enter a valid email address' };
  return { valid: true };
}

export type PasswordRuleCheck = {
  key: string;
  label: string;
  test: (password: string) => boolean;
};

export const passwordRules: PasswordRuleCheck[] = [
  { key: 'length', label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { key: 'lowercase', label: 'One lowercase letter (a-z)', test: (p) => /[a-z]/.test(p) },
  { key: 'number', label: 'One number (0-9)', test: (p) => /[0-9]/.test(p) },
  { key: 'special', label: 'One special character (!@#$%...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

export function validatePassword(password: string): ValidationResult {
  const failed = passwordRules.filter((rule) => !rule.test(password));
  if (failed.length > 0) {
    return { valid: false, message: `Password needs: ${failed.map((f) => f.label).join(', ')}` };
  }
  return { valid: true };
}

export function validatePhone(phone: string): ValidationResult {
  const digits = phone.replace(/\D/g, '');
  if (!phone) return { valid: false, message: 'Phone number is required' };
  if (digits.length < 8) return { valid: false, message: 'Enter a valid phone number with country code' };
  return { valid: true };
}

export function validateName(value: string, label: string): ValidationResult {
  if (!value || !value.trim()) {
    return { valid: false, message: `${label} is required` };
  }

  if (!/^[A-Za-z\s'-]+$/.test(value.trim())) {
    return { valid: false, message: `${label} can only contain letters` };
  }

  if (value.trim().length < 2) {
    return { valid: false, message: `${label} must be at least 2 characters` };
  }

  return { valid: true };
}

export function validateRequired(value: string, label: string): ValidationResult {
  if (!value || !value.trim()) return { valid: false, message: `${label} is required` };
  return { valid: true };
}