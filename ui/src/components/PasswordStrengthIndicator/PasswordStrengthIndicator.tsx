'use client';

import { PasswordStrength } from '@/lib/wallet/browserWallet';

interface PasswordStrengthIndicatorProps {
    strength: PasswordStrength;
}

export default function PasswordStrengthIndicator({ strength }: PasswordStrengthIndicatorProps) {
    const getColor = () => {
        switch (strength.score) {
            case 0:
            case 1:
                return 'bg-red-500';
            case 2:
                return 'bg-orange-500';
            case 3:
                return 'bg-yellow-500';
            case 4:
                return 'bg-emerald-500';
            default:
                return 'bg-gray-500';
        }
    };

    const getLabel = () => {
        switch (strength.score) {
            case 0:
            case 1:
                return 'Weak';
            case 2:
                return 'Fair';
            case 3:
                return 'Good';
            case 4:
                return 'Strong';
            default:
                return '';
        }
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${getColor()}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                </div>
                <span className={`text-xs font-medium ${getColor().replace('bg-', 'text-')}`}>
                    {getLabel()}
                </span>
            </div>
            {strength.feedback.length > 0 && (
                <ul className="text-xs text-slate-400 space-y-1">
                    {strength.feedback.map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                            <span className="text-slate-600">•</span>
                            <span>{item}</span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
