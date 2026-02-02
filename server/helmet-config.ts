import helmet from 'helmet';
import { Express } from 'express';
import { log } from './vite';

export function setupSecurityHeaders(app: Express) {
  // Detectar si estamos en entorno de desarrollo
  const isDevelopment = process.env.NODE_ENV !== 'production' || !process.env.NODE_ENV;
  
  if (isDevelopment) {
    log('Development mode: Minimal security headers to allow Vite development server');
    
    // Solo headers básicos en desarrollo
    app.use(helmet.dnsPrefetchControl({ allow: true }));
    app.use(helmet.frameguard({ action: 'sameorigin' }));
    
    // No aplicar CSP en desarrollo
    log('CSP disabled in development mode for Vite compatibility');
    return;
  }

  // PRODUCCIÓN: Configuración completa de seguridad
  log('Production mode: Full security headers enabled');
  
  // Establecer encabezados de seguridad básicos necesarios
  app.use(helmet.dnsPrefetchControl({ allow: true }));
  app.use(helmet.frameguard({ action: 'sameorigin' }));
  app.use(helmet.permittedCrossDomainPolicies());
  
  // Asegurar conexiones HTTPS - Configuración más estricta
  app.use(helmet.hsts({
    maxAge: 31536000, // 365 días en segundos
    includeSubDomains: true,
    preload: true
  }));
  
  // Añadir nivel extra de seguridad con políticas de características (Permissions-Policy)
  // Actualización de Feature-Policy a Permissions-Policy (estándar actual)
  app.use((req, res, next) => {
    // Feature-Policy para compatibilidad con navegadores antiguos
    res.setHeader(
      'Feature-Policy',
      "fullscreen 'self'; payment 'self' https://api.stripe.com https://*.paypal.com https://*.stripe.com https://js.stripe.com https://checkout.stripe.com; camera 'none'; microphone 'none'; geolocation 'none'"
    );
    
    // Permissions-Policy para navegadores modernos
    res.setHeader(
      'Permissions-Policy',
      "fullscreen=(self), payment=(self 'https://api.stripe.com' 'https://*.paypal.com' 'https://*.stripe.com' 'https://js.stripe.com' 'https://checkout.stripe.com'), camera=(), microphone=(), geolocation=(), interest-cohort=()"
    );
    
    next();
  });
  
  // Prevenir el clickjacking
  app.use(helmet.xFrameOptions({ action: 'sameorigin' }));
  
  // Configurar CSP (Content Security Policy) para garantizar seguridad y mostrar el candado
  app.use(
    helmet.contentSecurityPolicy({
      directives: {
        // Permitir carga de recursos desde el propio sitio y desde dominios específicos necesarios
        defaultSrc: ["'self'", "https:", "*.tobais.com", "tobais.com", "www.tobais.com"],
        
        // Permitir conexiones API y WebSockets
        connectSrc: [
          "'self'", 
          "*.tobais.com", 
          "tobais.com",
          "*.replit.app", 
          "*.repl.co", 
          "api.stripe.com", 
          "*.stripe.com", 
          "*.paypal.com", 
          "api.openai.com",
          "wss://*.replit.app",
          "ws://127.0.0.1:5000",
          "ws://localhost:5000",
          "http://127.0.0.1:5000",
          "http://localhost:5000",
          "*"
        ],
        
        // Permitir imágenes de cualquier fuente
        imgSrc: ["'self'", "data:", "https:", "blob:", "*"],
        
        // Scripts necesarios para el funcionamiento
        scriptSrc: [
          "'self'", 
          "'unsafe-inline'", 
          "'unsafe-eval'", 
          "*.stripe.com", 
          "*.paypal.com", 
          "*.tobais.com",
          "tobais.com",
          "http://127.0.0.1:5000",
          "http://localhost:5000",
          "ws://127.0.0.1:5000",
          "ws://localhost:5000",
          "*"
        ],
        
        // Estilos necesarios
        styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "*"],
        
        // Fuentes necesarias
        fontSrc: ["'self'", "fonts.gstatic.com", "*"],
        
        // Frames necesarios para los procesadores de pago
        frameSrc: ["'self'", "*.stripe.com", "*.paypal.com", "*"],
      },
      
      // No reportar errores de CSP para evitar problemas con la consola
      reportOnly: false
    })
  );

  log('Security headers (Helmet) configured successfully');
}