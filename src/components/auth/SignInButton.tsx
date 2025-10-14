import { SignInButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function SignInButtonComponent() {
  return (
    <div>
      <SignedOut>
        <SignInButton mode="modal">
          <Button variant="default">Sign In</Button>
        </SignInButton>
      </SignedOut>
      <SignedIn>
        {/* User is signed in */}
      </SignedIn>
    </div>
  );
}