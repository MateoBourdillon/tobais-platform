import { useLanguage } from "@/contexts/LanguageContext";
import { FileText } from "lucide-react";
import InvoiceItem, { Invoice } from "./InvoiceItem";

interface PaidInvoicesProps {
  invoices: Invoice[];
}

export default function PaidInvoices({ invoices }: PaidInvoicesProps) {
  const { t } = useLanguage();

  if (invoices.length === 0) {
    return (
      <div className="text-center py-10 text-gray-500 dark:text-gray-400">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
          {t("billing.noPaymentHistory")}
        </h3>
        <p>{t("billing.noCompletedPayments")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {invoices.map(invoice => (
        <InvoiceItem
          key={invoice.id}
          invoice={invoice}
          selectable={false}
        />
      ))}
    </div>
  );
}