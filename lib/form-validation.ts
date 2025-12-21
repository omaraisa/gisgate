/**
 * Form Validation Utilities
 * Provides comprehensive client-side validation with Arabic error messages
 */

export interface ValidationRule {
  validate: (value: unknown) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'string') return value.trim().length > 0;
      if (typeof value === 'number') return true;
      if (Array.isArray(value)) return value.length > 0;
      return value !== null && value !== undefined;
    },
    message: `${fieldName} مطلوب`,
  }),

  email: (): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message: 'يرجى إدخال بريد إلكتروني صحيح',
  }),

  minLength: (min: number, fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      return value.length >= min;
    },
    message: `${fieldName} يجب أن يحتوي على ${min} أحرف على الأقل`,
  }),

  maxLength: (max: number, fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      return value.length <= max;
    },
    message: `${fieldName} يجب ألا يتجاوز ${max} حرف`,
  }),

  password: (): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      return (
        value.length >= 8 &&
        /[a-z]/.test(value) &&
        /[A-Z]/.test(value) &&
        /\d/.test(value)
      );
    },
    message: 'كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، حرف صغير، ورقم',
  }),

  passwordMatch: (password: string): ValidationRule => ({
    validate: (value) => value === password,
    message: 'كلمتا المرور غير متطابقتان',
  }),

  phoneNumber: (): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      // Allow various phone number formats
      const phoneRegex = /^[\d\s\-\+\(\)]{8,20}$/;
      return phoneRegex.test(value);
    },
    message: 'يرجى إدخال رقم هاتف صحيح',
  }),

  url: (): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: 'يرجى إدخال رابط صحيح',
  }),

  number: (fieldName: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value === 'number') return !isNaN(value);
      if (typeof value === 'string') return !isNaN(parseFloat(value));
      return false;
    },
    message: `${fieldName} يجب أن يكون رقماً`,
  }),

  min: (min: number, fieldName: string): ValidationRule => ({
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return typeof num === 'number' && num >= min;
    },
    message: `${fieldName} يجب أن يكون ${min} على الأقل`,
  }),

  max: (max: number, fieldName: string): ValidationRule => ({
    validate: (value) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      return typeof num === 'number' && num <= max;
    },
    message: `${fieldName} يجب ألا يتجاوز ${max}`,
  }),

  pattern: (pattern: RegExp, message: string): ValidationRule => ({
    validate: (value) => {
      if (typeof value !== 'string') return false;
      return pattern.test(value);
    },
    message,
  }),

  custom: (validator: (value: unknown) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
};

/**
 * Validate a single field
 */
export function validateField(value: unknown, rules: ValidationRule[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate multiple fields
 */
export function validateForm<T extends Record<string, unknown>>(
  values: T,
  rules: Record<keyof T, ValidationRule[]>
): Record<keyof T, ValidationResult> {
  const results = {} as Record<keyof T, ValidationResult>;

  for (const field in rules) {
    results[field] = validateField(values[field], rules[field]);
  }

  return results;
}

/**
 * Check if form is valid
 */
export function isFormValid<T extends Record<string, unknown>>(
  results: Record<keyof T, ValidationResult>
): boolean {
  return Object.values(results).every((result) => result.isValid);
}

/**
 * Get all form errors as flat array
 */
export function getFormErrors<T extends Record<string, unknown>>(
  results: Record<keyof T, ValidationResult>
): string[] {
  const errors: string[] = [];
  
  for (const field in results) {
    errors.push(...results[field].errors);
  }
  
  return errors;
}

/**
 * Sanitize string input (prevent XSS)
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize form data
 */
export function sanitizeFormData<T extends Record<string, unknown>>(data: T): T {
  const sanitized = {} as T;

  for (const key in data) {
    const value = data[key];
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value) as T[Extract<keyof T, string>];
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Real-time validation hook helper
 */
export interface FieldState<T> {
  value: T;
  error: string | null;
  touched: boolean;
  isDirty: boolean;
}

export function createFieldState<T>(initialValue: T): FieldState<T> {
  return {
    value: initialValue,
    error: null,
    touched: false,
    isDirty: false,
  };
}

export function validateFieldState<T>(
  state: FieldState<T>,
  rules: ValidationRule[]
): FieldState<T> {
  if (!state.touched) {
    return state;
  }

  const result = validateField(state.value, rules);
  
  return {
    ...state,
    error: result.errors[0] || null,
  };
}
