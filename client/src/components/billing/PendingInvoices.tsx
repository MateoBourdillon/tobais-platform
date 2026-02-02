import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle, CreditCard, Loader2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import InvoiceItem, { Invoice } from "./InvoiceItem";

interface PendingInvoicesProps {
  invoices: Invoice[];
  selectedInvoices: number[];
  selectedTotal: number;
  isCreatingIntent: boolean;
  onSelect: (id: number) => void;
  onPaySelected: (ids?: number[]) => void;
}

export default function PendingInvoices({
  invoices,
  selectedInvoices,
  selectedTotal,
  isCreatingIntent,
  onSelect,
  onPaySelected
}: PendingInvoicesProps) {
  const { t } = useLanguage();

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {t("billing.allPaid")}
        </h3>
        <p>{t("billing.noPendingInvoices")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <InvoiceItem
          key={invoice.id}
          invoice={invoice}
          isSelected={selectedInvoices.includes(invoice.id)}
          onSelect={onSelect}
          onPayNow={(id) => onPaySelected([id])}
        />
      ))}
      
      {selectedInvoices.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {t("billing.selectedInvoices").replace('{count}', selectedInvoices.length.toString())}
            </span>
            <span className="font-semibold text-gray-900 dark:text-white text-lg">
              {formatCurrency(selectedTotal)}
            </span>
          </div>
          <Button 
            onClick={() => onPaySelected()} 
            className="w-full"
            size="lg"
            disabled={isCreatingIntent}
          >
            {isCreatingIntent ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("checkout.processing")}
              </>
            ) : (
              <>
                <CreditCard className="mr-2 h-4 w-4" />
                {t("billing.payNow")}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}