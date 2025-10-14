import { useUser } from "@clerk/nextjs";

export function useAuth() {
  const { isSignedIn, user, isLoaded } = useUser();

  return {
    isSignedIn,
    user,
    isLoaded,
    // Extract common user properties
    userName: user?.fullName || user?.username || user?.primaryEmailAddress?.emailAddress,
    userEmail: user?.primaryEmailAddress?.emailAddress,
    userId: user?.id,
    // Check if user has specific role (you can customize this based on your needs)
    isAdmin: user?.publicMetadata?.role === "admin",
    role: user?.publicMetadata?.role || "user",
  };
}