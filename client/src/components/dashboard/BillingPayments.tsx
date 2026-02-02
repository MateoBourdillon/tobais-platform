import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, CreditCard, DollarSign, Loader2 } from "lucide-react";
import { useInvoices } from "@/hooks/use-invoices";
import PendingInvoices from "@/components/billing/PendingInvoices";
import PaidInvoices from "@/components/billing/PaidInvoices";
import PaymentModal from "@/components/billing/PaymentModal";

export default function BillingPayments() {
  const { t } = useLanguage();
  const { 
    pendingInvoices,
    paidInvoices,
    isLoading,
    selectedInvoices,
    selectedTotal,
    toggleInvoiceSelection,
    handlePaySelected,
    isCreatingIntent,
    clientSecret,
    showPaymentForm,
    handleClosePaymentForm
  } = useInvoices();
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("billing.title")}</CardTitle>
          <CardDescription>{t("billing.description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-10">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            {t("billing.title")}
          </CardTitle>
          <CardDescription>{t("billing.description")}</CardDescription>
        </CardHeader>
        
        <Tabs defaultValue="pending" className="w-full">
          <CardContent>
            <TabsList className="mb-4">
              <TabsTrigger value="pending" className="flex items-center">
                <Clock className="mr-2 h-4 w-4" />
                {t("billing.pendingInvoices")} 
                {pendingInvoices.length > 0 && 
                  <Badge variant="secondary" className="ml-2 bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                    {pendingInvoices.length}
                  </Badge>
                }
              </TabsTrigger>
              <TabsTrigger value="history">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t("billing.paymentHistory")}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="pending" className="mt-0">
              <PendingInvoices
                invoices={pendingInvoices}
                selectedInvoices={selectedInvoices}
                selectedTotal={selectedTotal}
                isCreatingIntent={isCreatingIntent}
                onSelect={toggleInvoiceSelection}
                onPaySelected={handlePaySelected}
              />
            </TabsContent>
            
            <TabsContent value="history" className="mt-0">
              <PaidInvoices invoices={paidInvoices} />
            </TabsContent>
          </CardContent>
        </Tabs>
        
        <CardFooter className="border-t border-gray-200 dark:border-gray-700 pt-4 pb-6 px-6">
          <div className="w-full flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t("billing.securePayment")}
            </p>
            <div className="flex space-x-2">
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 flex items-center">
                <CreditCard className="h-3 w-3 mr-1" />
                Stripe
              </span>
              <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-gray-600 dark:text-gray-400 flex items-center">
                <DollarSign className="h-3 w-3 mr-1" />
                PayPal
              </span>
            </div>
          </div>
        </CardFooter>
      </Card>

      {showPaymentForm && clientSecret && (
        <PaymentModal
          clientSecret={clientSecret}
          totalAmount={selectedTotal}
          invoiceCount={selectedInvoices.length}
          onClose={handleClosePaymentForm}
        />
      )}
    </>
  );
}