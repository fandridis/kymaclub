import React from 'react';
import { Euro } from 'lucide-react';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';
import { eurosToCredits } from '@repo/utils/credits';

interface EuroPriceInputProps {
    value?: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    name?: string;
    placeholder?: string;
    error?: string;
    required?: boolean;
    className?: string;
    showCreditEquivalent?: boolean;
}

export const EuroPriceInput: React.FC<EuroPriceInputProps> = ({
    value = '',
    onChange,
    onBlur,
    name,
    placeholder = 'Price',
    error,
    required = false,
    className,
    showCreditEquivalent = true,
}) => {
    // Convert cents value back to euros for display
    const displayValue = value ? (parseInt(value) / 100).toString() : '';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Only allow integers (no decimals)
        if (/^\d*$/.test(inputValue)) {
            // Convert euros to cents for storage
            const euros = parseInt(inputValue) || 0;
            const cents = euros * 100;
            onChange?.(cents.toString());
        }
    };

    const handleBlur = () => {
        const centsValue = parseInt(value) || 0;
        const eurosValue = centsValue / 100;

        // Clamp value between 1 and 100 euros (100 to 10000 cents)
        if (eurosValue < 1) {
            onChange?.('100'); // 1 euro in cents
        } else if (eurosValue > 100) {
            onChange?.('10000'); // 100 euros in cents
        }

        // Call the original onBlur handler if provided
        onBlur?.();
    };

    const centsValue = parseInt(value) || 0;
    const eurosValue = centsValue / 100;
    const isValidPrice = centsValue >= 100 && centsValue <= 10000; // 1-100 euros in cents
    const creditEquivalent = eurosToCredits(eurosValue);

    return (
        <div className={cn("space-y-2", className)}>
            <Label className="flex items-center gap-2">
                <Euro className="h-4 w-4" />
                Price in Euros {required && <span className="text-red-500">*</span>}
            </Label>

            <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                    €
                </div>
                <Input
                    type="text"
                    name={name}
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={cn(
                        "pl-8",
                        showCreditEquivalent && isValidPrice && "pr-20",
                        error && "border-red-500 focus:border-red-500"
                    )}
                    min="1"
                    max="100"
                />
                {showCreditEquivalent && isValidPrice && (
                    <div className="absolute right-3 top-[18.5px] transform -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        {creditEquivalent} credits
                    </div>
                )}
            </div>

            {error && (
                <div className="text-sm text-red-500">
                    {error}
                </div>
            )}
        </div>
    );
};