import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { EmailVerification } from "@/components/auth/email-verification";

interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  adminOnly?: boolean;
  staffOnly?: boolean;
}

export function ProtectedRoute({
  path,
  component: Component,
  adminOnly = false,
  staffOnly = false,
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Check if email verification is required
  if (!user.emailVerified) {
    return (
      <Route path={path}>
        <EmailVerification />
      </Route>
    );
  }

  // Check if route requires admin privileges
  if (adminOnly && user.role !== "admin" && user.role !== "superadmin") {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Check if route requires staff privileges (adminLevel >= 1)
  if (staffOnly && (user.adminLevel || 0) < 1) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}
