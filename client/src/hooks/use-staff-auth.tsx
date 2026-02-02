import { useAuth } from "./use-auth";
import { User } from "@shared/schema";
import { useMemo } from "react";

export interface StaffUser extends User {
  // Extended interface for staff-specific functionality
  isStaff: boolean;
  canManageAllBriefs: boolean;
}

export function useStaffAuth() {
  const { user, isLoading, error, loginMutation, logoutMutation } = useAuth();

  // Check if user has staff level access (adminLevel >= 1)
  const isStaff = useMemo(() => {
    return !!(user && (user.adminLevel || 0) >= 1);
  }, [user]);

  // Check if user can manage all briefs (adminLevel >= 3)
  const canManageAllBriefs = useMemo(() => {
    return !!(user && (user.adminLevel || 0) >= 3);
  }, [user]);

  // Enhanced user object with staff-specific properties
  const staffUser = useMemo(() => {
    if (!user || !isStaff) return null;
    
    return {
      ...user,
      isStaff: true,
      canManageAllBriefs,
      // Map to legacy properties for compatibility
      role: user.adminLevel === 6 ? 'superadmin' : 
            user.adminLevel >= 5 ? 'admin' : 
            user.adminLevel >= 3 ? 'manager' : 'staff',
      permissions: user.adminLevel >= 3 ? ['manage_all_briefs'] : ['manage_own_briefs']
    };
  }, [user, isStaff, canManageAllBriefs]);

  return {
    user: staffUser as StaffUser | null,
    isLoading,
    error,
    isAuthenticated: !!user,
    isStaff,
    canManageAllBriefs,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginLoading: loginMutation.isPending,
    loginError: loginMutation.error,
    isLogoutLoading: logoutMutation.isPending,
  };
}