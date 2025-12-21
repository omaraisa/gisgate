'use client';

import { useMemo } from 'react';
import { Check, X } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

interface PasswordStrength {
  score: number; // 0-4
  label: string;
  color: string;
  percentage: number;
  requirements: {
    minLength: boolean;
    hasLowercase: boolean;
    hasUppercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
}

export default function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo<PasswordStrength>(() => {
    if (!password) {
      return {
        score: 0,
        label: '',
        color: 'gray',
        percentage: 0,
        requirements: {
          minLength: false,
          hasLowercase: false,
          hasUppercase: false,
          hasNumber: false,
          hasSpecialChar: false,
        },
      };
    }

    const requirements = {
      minLength: password.length >= 8,
      hasLowercase: /[a-z]/.test(password),
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    // Calculate score based on requirements
    let score = 0;
    if (requirements.minLength) score++;
    if (requirements.hasLowercase) score++;
    if (requirements.hasUppercase) score++;
    if (requirements.hasNumber) score++;
    if (requirements.hasSpecialChar) score++;

    // Additional checks for very strong passwords
    if (password.length >= 12) score += 0.5;
    if (password.length >= 16) score += 0.5;

    // Normalize score to 0-4 range
    const normalizedScore = Math.min(4, Math.floor(score * 0.8));

    const labels = ['', 'ضعيفة جداً', 'ضعيفة', 'متوسطة', 'قوية'];
    const colors = ['gray', 'red', 'orange', 'yellow', 'green'];

    return {
      score: normalizedScore,
      label: labels[normalizedScore],
      color: colors[normalizedScore],
      percentage: (normalizedScore / 4) * 100,
      requirements,
    };
  }, [password]);

  if (!password) return null;

  const getColorClasses = (color: string) => {
    const classes = {
      red: 'bg-red-500',
      orange: 'bg-orange-500',
      yellow: 'bg-yellow-500',
      green: 'bg-green-500',
      gray: 'bg-gray-300',
    };
    return classes[color as keyof typeof classes] || classes.gray;
  };

  const getTextColorClasses = (color: string) => {
    const classes = {
      red: 'text-red-600',
      orange: 'text-orange-600',
      yellow: 'text-yellow-600',
      green: 'text-green-600',
      gray: 'text-gray-600',
    };
    return classes[color as keyof typeof classes] || classes.gray;
  };

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">قوة كلمة المرور</span>
          {strength.label && (
            <span className={`text-sm font-medium ${getTextColorClasses(strength.color)}`}>
              {strength.label}
            </span>
          )}
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${getColorClasses(strength.color)}`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="space-y-2">
          <p className="text-sm text-gray-600 font-medium">المتطلبات:</p>
          <ul className="space-y-1">
            <RequirementItem
              met={strength.requirements.minLength}
              text="8 أحرف على الأقل"
            />
            <RequirementItem
              met={strength.requirements.hasLowercase}
              text="حرف صغير واحد على الأقل (a-z)"
            />
            <RequirementItem
              met={strength.requirements.hasUppercase}
              text="حرف كبير واحد على الأقل (A-Z)"
            />
            <RequirementItem
              met={strength.requirements.hasNumber}
              text="رقم واحد على الأقل (0-9)"
            />
          </ul>
        </div>
      )}
    </div>
  );
}

interface RequirementItemProps {
  met: boolean;
  text: string;
}

function RequirementItem({ met, text }: RequirementItemProps) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {met ? (
        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
      ) : (
        <X className="w-4 h-4 text-gray-400 flex-shrink-0" />
      )}
      <span className={met ? 'text-green-700' : 'text-gray-600'}>{text}</span>
    </li>
  );
}
