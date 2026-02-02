import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Invoice } from "@/components/billing/InvoiceItem";

export function useInvoices() {
  const { user } = useAuth();
  const [selectedInvoices, setSelectedInvoices] = useState<number[]>([]);
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const { toast } = useToast();

  // Fetch invoices from the API
  const { data: invoices, isLoading, error, refetch } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
    enabled: !!user,
    queryFn: async () => {
      try {
        const response = await fetch("/api/invoices", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include" // Important for authentication cookies
        });
        
        if (!response.ok) {
          throw new Error(`Error fetching invoices: ${response.statusText}`);
        }
        
        return await response.json();
      } catch (error) {
        console.error("Error fetching invoices:", error);
        throw error;
      }
    }
  });
  
  // Split invoices by status
  const pendingInvoices = invoices?.filter(invoice => 
    invoice.status === 'pending' || invoice.status === 'overdue'
  ) || [];
  
  const paidInvoices = invoices?.filter(invoice => 
    invoice.status === 'paid'
  ) || [];
  
  // Selection management
  const toggleInvoiceSelection = (invoiceId: number) => {
    setSelectedInvoices(prev => 
      prev.includes(invoiceId)
        ? prev.filter(id => id !== invoiceId)
        : [...prev, invoiceId]
    );
  };
  
  const selectedTotal = invoices
    ?.filter(invoice => selectedInvoices.includes(invoice.id))
    .reduce((sum, invoice) => sum + invoice.total, 0) || 0;
  
  // Payment handling
  const createPaymentIntent = async (invoiceIds: number[]) => {
    if (invoiceIds.length === 0) return null;
    
    setIsCreatingIntent(true);
    
    try {
      // Create a payment intent for the selected invoices
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceIds }),
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to create payment intent: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.clientSecret) {
        return data.clientSecret;
      } else {
        throw new Error('No client secret returned');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      toast({
        title: "Error creating payment",
        description: error.message || "Could not process payment request",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsCreatingIntent(false);
    }
  };
  
  const handlePaySelected = async (invoiceIdsToUse?: number[]) => {
    const idsToUse = invoiceIdsToUse || selectedInvoices;
    
    const secret = await createPaymentIntent(idsToUse);
    if (secret) {
      setClientSecret(secret);
      setShowPaymentForm(true);
    }
  };
  
  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
    setClientSecret("");
    // Refresh invoice data after payment modal is closed
    // in case a payment was successful
    refetch();
  };

  return {
    invoices,
    pendingInvoices,
    paidInvoices,
    isLoading,
    error,
    selectedInvoices,
    selectedTotal,
    toggleInvoiceSelection,
    handlePaySelected,
    isCreatingIntent,
    clientSecret,
    showPaymentForm,
    handleClosePaymentForm
  };
}