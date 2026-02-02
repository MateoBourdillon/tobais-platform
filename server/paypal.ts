// Importamos los módulos necesarios del SDK de PayPal
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Variables para control de estado
let paypalInitialized = false;
let paypalSdk: any;
let paypalClient: any;
let environment: any;

// Definir las URLs de PayPal para cada entorno
const PAYPAL_API_BASE = {
  LIVE: 'https://api-m.paypal.com',
  SANDBOX: 'https://api-m.sandbox.paypal.com'
};

// Variable para guardar la URL base actual
let currentPayPalApiBase = '';

// Configura el entorno de PayPal basado en si estamos en producción o desarrollo
const clientId = process.env.PAYPAL_CLIENT_ID;
const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
// Forzar entorno de producción (siempre activo para las credenciales de producción)
const forceProduction = true; // Forzamos a usar siempre el entorno de producción (LIVE) para las credenciales live

// Verificar y validar credenciales de PayPal
if (!clientId || !clientSecret) {
  console.warn('Warning: Missing PayPal credentials. PayPal payments will not work properly.');
  // No lanzar error para permitir que la aplicación continúe funcionando
} else {
  try {
    // @ts-ignore - Usar require para módulos que no soportan completamente ESM
    paypalSdk = require('@paypal/checkout-server-sdk');
    
    // Detección automática de si es una credencial de producción (Live) o Sandbox
    // Las credenciales de producción suelen comenzar con "A" seguido de letras/números
    // Las credenciales de sandbox suelen comenzar con "A" seguido de letras/números y contienen "sb-"
    const isLiveCredential = forceProduction || (clientId && clientId.startsWith('A') && !clientId.includes('sb-'));
    
    console.log('PayPal environment mode:', forceProduction ? 'FORCED LIVE/PRODUCTION' : 
      (isLiveCredential ? 'DETECTED LIVE/PRODUCTION' : 'DETECTED SANDBOX'));
    
    // Establecer la URL base según el entorno
    currentPayPalApiBase = isLiveCredential ? PAYPAL_API_BASE.LIVE : PAYPAL_API_BASE.SANDBOX;
    console.log('Using PayPal API Base URL:', currentPayPalApiBase);
    
    // Inicializar el entorno basado en la detección o configuración explícita
    if (isLiveCredential) {
      environment = new paypalSdk.core.LiveEnvironment(clientId, clientSecret);
      console.log('Using LIVE PayPal environment with endpoint', PAYPAL_API_BASE.LIVE);
    } else {
      environment = new paypalSdk.core.SandboxEnvironment(clientId, clientSecret);
      console.log('Using SANDBOX PayPal environment with endpoint', PAYPAL_API_BASE.SANDBOX);
    }
    
    // Crear el cliente HTTP de PayPal
    paypalClient = new paypalSdk.core.PayPalHttpClient(environment);
    
    paypalInitialized = true;
    console.log('PayPal configuration initialized with client ID:', clientId.substring(0, 5) + '...');
  } catch (error) {
    console.error('Error initializing PayPal SDK:', error);
    paypalInitialized = false;
  }
}

// Función para verificar el estado de la configuración de PayPal
export function isPayPalInitialized() {
  return paypalInitialized && !!paypalClient;
}

// Exportar el cliente HTTP de PayPal (puede ser null)
export { paypalClient };

// Función para crear una orden de PayPal
export async function createPayPalOrder(amount: number, currency: string = 'USD') {
  // Verificar si PayPal está configurado correctamente
  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not initialized. Check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
  }

  try {
    // Using Node.js native fetch instead of PayPal SDK due to Content-Type header issues
    // Generate access token first
    const tokenResponse = await fetch(`${currentPayPalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('PayPal OAuth error:', errorData);
      throw new Error(`PayPal authentication failed: ${errorData.error_description || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Failed to obtain PayPal access token');
    }

    // Now create the order with the access token
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: amount.toFixed(2),
          },
        },
      ]
    };

    // Registrar información adicional para depuración
    const isLiveEnvironment = true; // Always using LIVE environment
    console.log(`Creating PayPal order in ${isLiveEnvironment ? 'LIVE' : 'SANDBOX'} environment`);
    console.log(`Using PayPal endpoint base: ${currentPayPalApiBase}`);
    console.log('Order details:', {
      currency,
      amount: amount.toFixed(2),
      path: '/v2/checkout/orders',
      method: 'POST'
    });

    const orderResponse = await fetch(`${currentPayPalApiBase}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(orderData)
    });

    if (!orderResponse.ok) {
      const errorData = await orderResponse.json();
      console.error('PayPal order creation error:', errorData);
      throw new Error(`PayPal order creation failed: ${errorData.message || 'Unknown error'}`);
    }

    const orderResult = await orderResponse.json();
    console.log('PayPal order created successfully with ID:', orderResult.id);
    return orderResult;
  } catch (err: any) {
    console.error('Error creating PayPal order:', err);
    
    // Registrar detalles adicionales sobre el error
    console.error('PayPal Error Details:', {
      message: err.message,
      statusCode: err.statusCode || err.status,
      name: err.name,
      details: err.details || 'No additional details',
    });
    
    // Mejorar el mensaje de error para facilitar la depuración
    if (err.statusCode === 401 || err.status === 401 || err.message.includes('authentication failed')) {
      console.error('AUTHENTICATION ERROR: Invalid PayPal credentials or unauthorized access');
      throw new Error('PayPal authentication failed. Please check your credentials (PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET)');
    } else if (err.name === 'Error' && err.message.includes('Failed to fetch')) {
      console.error('NETWORK ERROR: Could not connect to PayPal servers');
      throw new Error('Could not connect to PayPal servers. Please check your internet connection and PayPal service status.');
    } else if (err.statusCode === 400 || err.status === 400) {
      console.error('BAD REQUEST: Invalid PayPal request parameters');
      throw new Error(`PayPal request error: ${err.message}. Please check your request parameters.`);
    } else if (err.statusCode === 403 || err.status === 403) {
      console.error('FORBIDDEN: Access denied to PayPal API');
      throw new Error('PayPal access denied. Your account may not have permissions to use this API or your credentials are scoped incorrectly.');
    } else if (err.statusCode === 422 || err.status === 422) {
      console.error('UNPROCESSABLE ENTITY: PayPal could not process the request');
      throw new Error(`PayPal could not process the request: ${err.message}`);
    } else if (err.statusCode === 500 || err.status === 500) {
      console.error('SERVER ERROR: PayPal server error');
      throw new Error('PayPal server error. Please try again later or contact PayPal support.');
    }
    
    // Si no es un error conocido, lanzar el error original
    throw err;
  }
}

// Función para capturar un pago de PayPal
export async function capturePayPalOrder(orderId: string) {
  // Verificar si PayPal está configurado correctamente
  if (!clientId || !clientSecret) {
    throw new Error('PayPal is not initialized. Check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET');
  }

  try {
    // Using Node.js native fetch instead of PayPal SDK due to Content-Type header issues
    // Generate access token first
    const tokenResponse = await fetch(`${currentPayPalApiBase}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('PayPal OAuth error:', errorData);
      throw new Error(`PayPal authentication failed: ${errorData.error_description || 'Unknown error'}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      throw new Error('Failed to obtain PayPal access token');
    }

    // Registrar información adicional para depuración
    const isLiveEnvironment = true; // Always using LIVE environment
    console.log(`Capturing PayPal order in ${isLiveEnvironment ? 'LIVE' : 'SANDBOX'} environment`);
    console.log(`Using PayPal endpoint base: ${currentPayPalApiBase}`);
    console.log('Capture details:', {
      orderId,
      path: `/v2/checkout/orders/${orderId}/capture`,
      method: 'POST'
    });

    const captureResponse = await fetch(`${currentPayPalApiBase}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({})
    });

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json();
      console.error('PayPal order capture error:', errorData);
      throw new Error(`PayPal order capture failed: ${errorData.message || 'Unknown error'}`);
    }

    const captureResult = await captureResponse.json();
    console.log('PayPal order captured successfully with ID:', captureResult.id);
    return captureResult;
  } catch (err: any) {
    console.error('Error capturing PayPal payment:', err);
    
    // Registrar detalles adicionales sobre el error
    console.error('PayPal Capture Error Details:', {
      message: err.message,
      statusCode: err.statusCode || err.status,
      name: err.name,
      details: err.details || 'No additional details',
      orderId
    });
    
    // Mejorar el mensaje de error para facilitar la depuración
    if (err.statusCode === 401 || err.status === 401 || err.message.includes('authentication failed')) {
      console.error('AUTHENTICATION ERROR: Invalid PayPal credentials or unauthorized access');
      throw new Error('PayPal authentication failed. Please check your credentials');
    } else if (err.name === 'Error' && err.message.includes('Failed to fetch')) {
      console.error('NETWORK ERROR: Could not connect to PayPal servers');
      throw new Error('Could not connect to PayPal servers. Please check your internet connection and PayPal service status.');
    } else if (err.statusCode === 400 || err.status === 400) {
      console.error('BAD REQUEST: Invalid PayPal request parameters');
      throw new Error(`PayPal request error: ${err.message}. Please check your request parameters.`);
    } else if (err.statusCode === 403 || err.status === 403) {
      console.error('FORBIDDEN: Access denied to PayPal API');
      throw new Error('PayPal access denied. Your account may not have permissions to use this API or your credentials are scoped incorrectly.');
    } else if (err.statusCode === 422 || err.status === 422) {
      console.error('UNPROCESSABLE ENTITY: PayPal could not process the capture');
      throw new Error(`PayPal could not process the capture: ${err.message}`);
    } else if (err.statusCode === 500 || err.status === 500) {
      console.error('SERVER ERROR: PayPal server error');
      throw new Error('PayPal server error. Please try again later or contact PayPal support.');
    }
    
    // Si no es un error conocido, lanzar el error original
    throw err;
  }
}

// Clases para los requests de PayPal
// Estas clases son utilizadas por el SDK de PayPal internamente para hacer las solicitudes
// La URL base (api-m.paypal.com o api-m.sandbox.paypal.com) es manejada automáticamente
// por el SDK según el entorno que se configure (LiveEnvironment o SandboxEnvironment)
class PayPalOrdersCreateRequest {
  preferHeader: string | null = null;
  body: any;

  // Este path es relativo a la URL base de PayPal que el SDK determina automáticamente
  // - En producción (LIVE): https://api-m.paypal.com/v2/checkout/orders
  // - En sandbox: https://api-m.sandbox.paypal.com/v2/checkout/orders
  path = '/v2/checkout/orders';
  method = 'POST';
  
  requestBody(body: any) {
    this.body = body;
  }
  
  prefer(value: string) {
    this.preferHeader = value;
  }

  headers() {
    // Ensure Content-Type header is properly set
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    if (this.preferHeader) {
      headers.Prefer = this.preferHeader;
    }
    
    return headers;
  }
}

class PayPalOrdersCaptureRequest {
  path: string;
  method = 'POST';
  body: any;

  constructor(orderId: string) {
    // Este path es relativo a la URL base de PayPal que el SDK determina automáticamente
    // - En producción (LIVE): https://api-m.paypal.com/v2/checkout/orders/{orderId}/capture
    // - En sandbox: https://api-m.sandbox.paypal.com/v2/checkout/orders/{orderId}/capture
    this.path = `/v2/checkout/orders/${orderId}/capture`;
  }
  
  requestBody(body: any) {
    this.body = body;
  }

  headers() {
    // Ensure Content-Type header is properly set
    return {
      'Content-Type': 'application/json'
    };
  }
}