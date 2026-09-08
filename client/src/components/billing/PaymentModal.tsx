import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { X } from "lucide-react";
import CheckoutForm from "@/components/payment/CheckoutForm";

// Initialize Stripe with the public key
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

if (!stripePublicKey) {
  console.error('Missing Stripe public key. Payments will not work correctly.');
}

// Sin clave, loadStripe recibe undefined y lanza al validarla, en cada carga de
// la web y no solo al pagar. Se carga solo si la clave existe; <Elements> acepta
// null y espera. Mismo criterio que checkout-page.tsx.
const stripePromise = stripePublicKey ? loadStripe(stripePublicKey) : null;

interface PaymentModalProps {
  clientSecret: string;
  totalAmount: number;
  invoiceCount: number;
  onClose: () => void;
}

export default function PaymentModal({
  clientSecret,
  totalAmount,
  invoiceCount,
  onClose
}: PaymentModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Options for Stripe Elements
  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
      variables: {
        colorPrimary: '#6366f1',
      },
    },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            {t("checkout.paymentInformation")}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="rounded-full h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-6">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              {t("checkout.orderSummary")}
            </h3>
            <div className="border rounded-md p-4 bg-gray-50 dark:bg-gray-800">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600 dark:text-gray-400">
                  {t("billing.selectedInvoices").replace('{count}', invoiceCount.toString())}
                </span>
                <span className="font-medium">{invoiceCount}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                <span>{t("checkout.total")}</span>
                <span className="text-primary-600 dark:text-primary-500">{formatCurrency(totalAmount)}</span>
              </div>
            </div>
          </div>
          
          <Elements stripe={stripePromise} options={options}>
            <CheckoutForm />
          </Elements>
        </div>
      </div>
    </div>
  );
}