import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

// Tipo para los permisos de administrador
type AdminPermissions = {
  role: string;
  adminLevel: number;
  isSuperAdmin: boolean;
  permissions: string[];
  canManageAdmins: boolean;
};

// Tipo para los datos de un administrador
export type Admin = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  role: string;
  adminLevel: number;
  permissions?: string[] | null;
  isActive: boolean;
  createdAt: string;
};

// Tipo para crear un nuevo administrador
export type NewAdmin = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  phone?: string;
  adminLevel: number;
  permissions?: string[];
};

// Tipo para actualizar datos de un administrador
export type AdminUpdate = Partial<Omit<Admin, "id" | "createdAt">>;

// Contexto de administración
type AdminContextType = {
  permissions: AdminPermissions | null;
  isLoading: boolean;
  error: Error | null;
  admins: Admin[];
  createAdminMutation: ReturnType<typeof useMutation<Admin, Error, NewAdmin>>;
  updateAdminMutation: ReturnType<typeof useMutation<Admin, Error, { id: number; data: AdminUpdate }>>;
  deactivateAdminMutation: ReturnType<typeof useMutation<Admin, Error, number>>;
  reactivateAdminMutation: ReturnType<typeof useMutation<Admin, Error, number>>;
};

export const AdminContext = createContext<AdminContextType | null>(null);

// Proveedor de contexto de administración
export function AdminProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();

  // Obtener permisos de administrador
  const {
    data: permissions,
    error,
    isLoading,
  } = useQuery<AdminPermissions | null, Error>({
    queryKey: ["/api/admin/check-permissions"],
    queryFn: async () => {
      if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
        return null;
      }
      try {
        const res = await apiRequest("GET", "/api/admin/check-permissions");
        const data = await res.json();
        return data.permissions;
      } catch (err) {
        return null;
      }
    },
    enabled: !!user && (user.role === "admin" || user.role === "superadmin"),
  });

  // Obtener la lista de administradores
  const { data: admins = [] } = useQuery<Admin[], Error>({
    queryKey: ["/api/admin/admins"],
    queryFn: async () => {
      if (!permissions?.canManageAdmins) {
        return [];
      }
      const res = await apiRequest("GET", "/api/admin/admins");
      return await res.json();
    },
    enabled: !!permissions?.canManageAdmins,
  });

  // Mutación para crear un nuevo administrador
  const createAdminMutation = useMutation({
    mutationFn: async (newAdmin: NewAdmin) => {
      const res = await apiRequest("POST", "/api/admin/admins", newAdmin);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Administrador creado",
        description: "El nuevo administrador ha sido creado con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear administrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar un administrador
  const updateAdminMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: AdminUpdate }) => {
      const res = await apiRequest("PUT", `/api/admin/admins/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Administrador actualizado",
        description: "Los datos del administrador han sido actualizados con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar administrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para desactivar un administrador
  const deactivateAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/admins/${id}/deactivate`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Administrador desactivado",
        description: "El administrador ha sido desactivado con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al desactivar administrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para reactivar un administrador
  const reactivateAdminMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/admins/${id}/reactivate`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/admins"] });
      toast({
        title: "Administrador reactivado",
        description: "El administrador ha sido reactivado con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al reactivar administrador",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return (
    <AdminContext.Provider
      value={{
        permissions,
        isLoading,
        error,
        admins,
        createAdminMutation,
        updateAdminMutation,
        deactivateAdminMutation,
        reactivateAdminMutation,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
}

// Hook para usar el contexto de administración
export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error("useAdmin debe ser usado dentro de un AdminProvider");
  }
  return context;
}