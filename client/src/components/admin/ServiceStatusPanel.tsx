import React, { useEffect, useState } from 'react';
import { useTranslation } from '@/hooks/use-translation';
import { apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { ExternalLink, RotateCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GmailTester } from './GmailTester';

// Interface for PayPal status
interface PayPalStatus {
  initialized: boolean;
  clientIdConfigured: boolean;
  clientSecretConfigured: boolean;
  environment: string;
  apiEndpoint: string;
  message: string;
}

// Interface for Email service status
interface EmailStatus {
  status: {
    isInitialized: boolean;
    provider: string;
  };
  gmailCredentialsConfigured: boolean;
  message: string;
}

export const ServiceStatusPanel: React.FC = () => {
  const { t } = useTranslation();
  const [paypalStatus, setPayPalStatus] = useState<PayPalStatus | null>(null);
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchServiceStatus = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch PayPal status
        const paypalResponse = await apiRequest('GET', '/api/check-paypal-status');
        const paypalData = await paypalResponse.json();
        setPayPalStatus(paypalData);

        // Fetch Email status
        const emailResponse = await apiRequest('GET', '/api/check-email-status');
        const emailData = await emailResponse.json();
        setEmailStatus(emailData);
      } catch (err) {
        console.error('Error fetching service status:', err);
        setError(t('admin.serviceStatus.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchServiceStatus();
  }, [t]);

  if (loading) {
    return (
      <div className="rounded-lg bg-background border p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{t('admin.serviceStatus.title')}</h2>
        <div className="flex items-center justify-center p-6">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg bg-background border p-4 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">{t('admin.serviceStatus.title')}</h2>
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  const refreshStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch PayPal status
      const paypalResponse = await apiRequest('GET', '/api/check-paypal-status');
      const paypalData = await paypalResponse.json();
      setPayPalStatus(paypalData);

      // Fetch Email status
      const emailResponse = await apiRequest('GET', '/api/check-email-status');
      const emailData = await emailResponse.json();
      setEmailStatus(emailData);
    } catch (err) {
      console.error('Error fetching service status:', err);
      setError(t('admin.serviceStatus.fetchError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-background border p-4 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">{t('admin.serviceStatus.title')}</h2>
          <Button onClick={refreshStatus} size="sm" variant="outline" disabled={loading}>
            <RotateCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {t('admin.serviceStatus.refresh')}
          </Button>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2">
          {/* PayPal Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">PayPal</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                paypalStatus?.initialized 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {paypalStatus?.initialized 
                  ? t('admin.serviceStatus.active') 
                  : t('admin.serviceStatus.inactive')}
              </span>
            </div>
            
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('admin.serviceStatus.environment')}</dt>
                <dd className="font-medium">{paypalStatus?.environment.toUpperCase()}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('admin.serviceStatus.clientId')}</dt>
                <dd>
                  <span className={paypalStatus?.clientIdConfigured ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {paypalStatus?.clientIdConfigured ? '✓' : '✗'}
                  </span>
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('admin.serviceStatus.clientSecret')}</dt>
                <dd>
                  <span className={paypalStatus?.clientSecretConfigured ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {paypalStatus?.clientSecretConfigured ? '✓' : '✗'}
                  </span>
                </dd>
              </div>
            </dl>
            
            <p className="mt-3 text-xs text-muted-foreground">
              {paypalStatus?.message}
            </p>
          </div>

          {/* Email Status */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-medium">{t('admin.serviceStatus.email')}</h3>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                emailStatus?.status.isInitialized 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                {emailStatus?.status.isInitialized 
                  ? t('admin.serviceStatus.active') 
                  : t('admin.serviceStatus.inactive')}
              </span>
            </div>
            
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('admin.serviceStatus.provider')}</dt>
                <dd className="font-medium">{emailStatus?.status.provider}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">{t('admin.serviceStatus.gmailCredentials')}</dt>
                <dd>
                  <span className={emailStatus?.gmailCredentialsConfigured ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                    {emailStatus?.gmailCredentialsConfigured ? '✓' : '✗'}
                  </span>
                </dd>
              </div>
            </dl>
            
            <p className="mt-3 text-xs text-muted-foreground">
              {emailStatus?.message}
            </p>
            

          </div>
        </div>
        
        <div className="mt-4 text-xs text-muted-foreground">
          <p>
            <strong>{t('admin.serviceStatus.note')}</strong> {t('admin.serviceStatus.noteContent')}
          </p>
        </div>
      </div>
      
      {/* Gmail Tester Section */}
      <div className="rounded-lg bg-background border shadow-sm">
        <div className="p-4 border-b">
          <h2 className="text-xl font-semibold">Gmail API Diagnostics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Use esta herramienta para probar las credenciales de Gmail API y diagnosticar problemas.
          </p>
        </div>
        
        {!emailStatus?.status.isInitialized && emailStatus?.status.provider === 'Gmail API' && (
          <div className="p-4 border-b">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Problemas con las credenciales de Gmail API</AlertTitle>
              <AlertDescription>
                Se ha detectado un problema con el token de actualización de Gmail API. 
                Por favor, siga las instrucciones para obtener un nuevo token y actualice las credenciales.
              </AlertDescription>
            </Alert>
          </div>
        )}
        
        <div className="p-4">
          <GmailTester />
        </div>
      </div>
    </div>
  );
};

export default ServiceStatusPanel;