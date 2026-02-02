import { createContext, ReactNode, useContext } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Tipo para un ítem de factura
export type InvoiceItem = {
  description: string;
  quantity: number;
  price: number; // en centavos
  amount: number; // en centavos (quantity * price)
};

// Tipo para una factura
export type Invoice = {
  id: number;
  userId: number;
  projectId?: number;
  number: string;
  status: string; // pending, paid, cancelled, overdue
  issueDate: string;
  dueDate: string;
  amount: number; // en centavos
  tax: number; // en centavos
  discount: number; // en centavos
  total: number; // en centavos (amount + tax - discount)
  notes?: string;
  paymentMethod?: string;
  paymentDate?: string;
  stripeInvoiceId?: string;
  stripePaymentIntentId?: string;
  paypalOrderId?: string;
  items: InvoiceItem[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

// Tipo para una nueva factura
export type NewInvoice = Omit<Invoice, "id" | "createdAt" | "updatedAt"> & {
  userEmail?: string; // Para búsqueda por email
  userName?: string; // Para búsqueda por nombre
  projectName?: string; // Para búsqueda por nombre de proyecto
};

// Tipo para actualizar una factura
export type InvoiceUpdate = Partial<Omit<Invoice, "id" | "createdAt" | "updatedAt">>;

// Contexto para la gestión de facturas
type InvoiceManagementContextType = {
  invoices: Invoice[];
  isLoading: boolean;
  error: Error | null;
  createInvoiceMutation: ReturnType<typeof useMutation<Invoice, Error, NewInvoice>>;
  updateInvoiceMutation: ReturnType<typeof useMutation<Invoice, Error, { id: number; data: InvoiceUpdate }>>;
  markAsPaidMutation: ReturnType<typeof useMutation<Invoice, Error, { id: number; paymentMethod: string }>>;
  markAsCancelledMutation: ReturnType<typeof useMutation<Invoice, Error, number>>;
  markAsOverdueMutation: ReturnType<typeof useMutation<Invoice, Error, number>>;
  sendInvoiceEmailMutation: ReturnType<typeof useMutation<any, Error, number>>;
  generateInvoiceNumber: () => Promise<string>;
  users: any[];
  projects: any[];
  loadingUsers: boolean;
  loadingProjects: boolean;
};

export const InvoiceManagementContext = createContext<InvoiceManagementContextType | null>(null);

// Proveedor de contexto para la gestión de facturas
export function InvoiceManagementProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();

  // Obtener todas las facturas
  const {
    data: invoices = [],
    error,
    isLoading,
  } = useQuery<Invoice[], Error>({
    queryKey: ["/api/admin/invoices"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/invoices");
      return await res.json();
    },
  });

  // Obtener todos los usuarios para seleccionar en el formulario
  const {
    data: users = [],
    isLoading: loadingUsers,
  } = useQuery<any[], Error>({
    queryKey: ["/api/admin/users"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/users");
      return await res.json();
    },
  });

  // Obtener todos los proyectos para seleccionar en el formulario
  const {
    data: projects = [],
    isLoading: loadingProjects,
  } = useQuery<any[], Error>({
    queryKey: ["/api/admin/projects"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/projects");
      return await res.json();
    },
  });

  // Mutación para crear una nueva factura
  const createInvoiceMutation = useMutation({
    mutationFn: async (newInvoice: NewInvoice) => {
      const res = await apiRequest("POST", "/api/admin/invoices", newInvoice);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura creada",
        description: "La factura ha sido creada con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al crear la factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para actualizar una factura
  const updateInvoiceMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: InvoiceUpdate }) => {
      const res = await apiRequest("PUT", `/api/admin/invoices/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura actualizada",
        description: "La factura ha sido actualizada con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al actualizar la factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para marcar una factura como pagada
  const markAsPaidMutation = useMutation({
    mutationFn: async ({ id, paymentMethod }: { id: number; paymentMethod: string }) => {
      const res = await apiRequest("PUT", `/api/admin/invoices/${id}/mark-as-paid`, { paymentMethod });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura marcada como pagada",
        description: "La factura ha sido marcada como pagada con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al marcar la factura como pagada",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para marcar una factura como cancelada
  const markAsCancelledMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/invoices/${id}/mark-as-cancelled`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura cancelada",
        description: "La factura ha sido cancelada con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al cancelar la factura",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para marcar una factura como vencida
  const markAsOverdueMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/admin/invoices/${id}/mark-as-overdue`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/invoices"] });
      toast({
        title: "Factura marcada como vencida",
        description: "La factura ha sido marcada como vencida con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al marcar la factura como vencida",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutación para enviar una factura por email
  const sendInvoiceEmailMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("POST", `/api/admin/invoices/${id}/send-email`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Email enviado",
        description: "El email con la factura ha sido enviado con éxito",
        variant: "success",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error al enviar el email",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Función para generar un número de factura automáticamente
  const generateInvoiceNumber = async (): Promise<string> => {
    try {
      const res = await apiRequest("GET", "/api/admin/invoices/generate-number");
      const data = await res.json();
      return data.number;
    } catch (error) {
      console.error("Error al generar número de factura:", error);
      // Si ocurre un error, generar un número basado en la fecha
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const random = Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0");
      return `INV-${year}${month}-${random}`;
    }
  };

  return (
    <InvoiceManagementContext.Provider
      value={{
        invoices,
        isLoading,
        error,
        createInvoiceMutation,
        updateInvoiceMutation,
        markAsPaidMutation,
        markAsCancelledMutation,
        markAsOverdueMutation,
        sendInvoiceEmailMutation,
        generateInvoiceNumber,
        users,
        projects,
        loadingUsers,
        loadingProjects,
      }}
    >
      {children}
    </InvoiceManagementContext.Provider>
  );
}

// Hook para usar el contexto de gestión de facturas
export function useInvoiceManagement() {
  const context = useContext(InvoiceManagementContext);
  if (!context) {
    throw new Error("useInvoiceManagement debe ser usado dentro de un InvoiceManagementProvider");
  }
  return context;
}