import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SignInWithOAuth } from "./sign-in-with-oauth";

export function SignInOtpForm({
    handleCodeSent,
}: {
    handleCodeSent: (email: string) => void;
}) {
    return (
        <Card>
            <CardHeader className="text-center">
                <CardTitle>Sign in to your account</CardTitle>
                <CardDescription>
                    Sign in to your account to continue
                </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
                <SignInWithOAuth redirectTo={"/"} />
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">
                            Or continue with
                        </span>
                    </div>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="m@example.com" />
                </div>
            </CardContent>
            <CardFooter>
                <Button className="w-full">Send Code</Button>
            </CardFooter>
        </Card>
    );
}