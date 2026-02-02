import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "@shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

const passwordSchema = z.string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .refine(
    (password) => /[A-Z]/.test(password),
    "La contraseña debe contener al menos una letra mayúscula"
  )
  .refine(
    (password) => /[a-z]/.test(password),
    "La contraseña debe contener al menos una letra minúscula"
  )
  .refine(
    (password) => /[0-9]/.test(password),
    "La contraseña debe contener al menos un número"
  )
  .refine(
    (password) => /[^A-Za-z0-9]/.test(password),
    "La contraseña debe contener al menos un carácter especial"
  );

// Basic registration schema without async validation (handled separately)
const registerSchema = insertUserSchema.extend({
  password: passwordSchema,
  email: z.string()
    .email("Por favor ingresa una dirección de correo electrónico válida"),
  username: z.string()
    .min(7, "El nombre de usuario debe tener al menos 7 caracteres"),
});

type RegisterData = z.infer<typeof registerSchema>;

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
    refetch,
  } = useQuery<SelectUser | null>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: async (user: SelectUser) => {
      // CRITICAL: Force refresh user data to ensure adminLevel is loaded
      await queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Wait for fresh data and get the latest user info
      const freshUserData = await queryClient.fetchQuery({
        queryKey: ["/api/user"],
        queryFn: getQueryFn({ on401: "returnNull" })
      });
      
      toast({
        title: "Login successful",
        description: "Welcome back!",
        variant: "default",
      });
      
      // Redirect staff to staff dashboard, regular users to main dashboard
      const userLevel = (freshUserData?.adminLevel || user.adminLevel || 0);
      if (userLevel >= 1) {
        // Staff level or higher - redirect to staff dashboard
        window.location.href = "/staff-dashboard";
      } else {
        // Regular user - redirect to main dashboard
        window.location.href = "/dashboard";
      }
    },
    onError: (error: any) => {
      // Handle email verification requirement
      if (error.status === 403 && error.requiresEmailVerification) {
        // Redirect to email verification with the email
        window.location.href = `/auth?mode=verify-email&email=${encodeURIComponent(error.email)}`;
        return;
      }
      
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterData) => {
      const res = await apiRequest("POST", "/api/register", userData);
      const responseData = await res.json();
      return responseData;
    },
    onSuccess: (response: any) => {
      console.log('Registration response:', response);
      
      // CRITICAL: Do not update query cache with user data after registration
      // This prevents automatic login behavior that would trigger dashboard navigation
      
      // Registration successful, redirect to verification
      if (response.requiresEmailVerification && response.email) {
        // Show success message before redirect
        toast({
          title: "Registration successful!",
          description: "Please check your email for verification code.",
          variant: "default",
        });
        // Redirect after a brief delay to show the message
        setTimeout(() => {
          console.log('Redirecting to verification page...');
          window.location.href = `/auth?mode=verify-email&email=${encodeURIComponent(response.email)}`;
        }, 1500);
      } else {
        // Fallback for old flow
        toast({
          title: "Registration successful",
          description: "Your account has been created!",
          variant: "default",
        });
      }
    },
    onError: (error: any) => {
      console.error('Registration error:', error);
      toast({
        title: "Registration failed",
        description: error.message || "Registration failed. Please try again.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Logout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        error,
        refetch,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
