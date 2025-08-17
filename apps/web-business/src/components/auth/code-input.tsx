import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

export function CodeInput({ length = 6 }: { length?: number }) {
    return (
        <div className="mb-4 w-full flex justify-center">
            <InputOTP maxLength={8} name="code" id="code" data-testid="otp-input">
                <InputOTPGroup className="w-full">
                    {Array(length)
                        .fill(null)
                        .map((_, index) => (
                            <InputOTPSlot key={index} index={index} className="w-10 h-10" />
                        ))}
                </InputOTPGroup>
            </InputOTP>
        </div>
    );
}