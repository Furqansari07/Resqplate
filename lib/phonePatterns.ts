type PhonePattern = {
  regex: RegExp;
  example: string;
};

// Keyed by ISO2 country code — matches PhoneInput's selected country.
export const phonePatterns: Record<string, PhonePattern> = {
  IN: { regex: /^[6-9]\d{9}$/, example: '9876543210' },
  US: { regex: /^[2-9]\d{2}[2-9]\d{6}$/, example: '2025551234' },
  CA: { regex: /^[2-9]\d{2}[2-9]\d{6}$/, example: '4165551234' },
  GB: { regex: /^7\d{9}$/, example: '7911123456' },
  AU: { regex: /^4\d{8}$/, example: '412345678' },
  DE: { regex: /^1\d{9,10}$/, example: '15123456789' },
  FR: { regex: /^[67]\d{8}$/, example: '612345678' },
  IT: { regex: /^3\d{8,9}$/, example: '3123456789' },
  ES: { regex: /^[67]\d{8}$/, example: '612345678' },
  BR: { regex: /^\d{2}9\d{8}$/, example: '11987654321' },
  CN: { regex: /^1[3-9]\d{9}$/, example: '13812345678' },
  JP: { regex: /^[7-9]0\d{8}$/, example: '9012345678' },
  PK: { regex: /^3\d{9}$/, example: '3001234567' },
  BD: { regex: /^1[3-9]\d{8}$/, example: '1712345678' },
  NP: { regex: /^9\d{9}$/, example: '9812345678' },
  LK: { regex: /^7\d{8}$/, example: '712345678' },
  AE: { regex: /^5\d{8}$/, example: '501234567' },
  SA: { regex: /^5\d{8}$/, example: '512345678' },
  NG: { regex: /^[789]\d{9}$/, example: '8012345678' },
  ZA: { regex: /^[6-8]\d{8}$/, example: '821234567' },
  RU: { regex: /^9\d{9}$/, example: '9123456789' },
};

const fallbackPattern: PhonePattern = {
  regex: /^\d{6,14}$/,
  example: '',
};

export function validatePhoneForCountry(iso2: string, nationalNumber: string) {
  const digits = nationalNumber.replace(/\D/g, '');
  const pattern = phonePatterns[iso2] || fallbackPattern;

  if (!digits) {
    return { valid: false, message: 'Phone number is required' };
  }

  if (!pattern.regex.test(digits)) {
    return {
      valid: false,
      message: pattern.example
        ? `Enter a valid number for this country (e.g. ${pattern.example})`
        : 'Enter a valid phone number',
    };
  }

  return { valid: true, message: '' };
}