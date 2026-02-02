/**
 * Utilidad para generar facturas correctamente
 * @author TOBAIS Technology
 * @date 06/05/2025
 */

import { db } from './db';
import Stripe from 'stripe';

// Configuración de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Variable de entorno STRIPE_SECRET_KEY no configurada');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Crea un enlace de pago en Stripe para la factura
 * @param {object} invoiceData Datos de la factura
 * @returns {Promise<string>} URL del enlace de pago
 */
async function createStripePaymentLink(invoiceData: any) {
  try {
    const productName = `Factura ${invoiceData.number}: ${invoiceData.description}`;
    
    // Crear un producto en Stripe
    const product = await stripe.products.create({
      name: productName,
      description: 'Servicios de TOBAIS Technology',
    });

    // Usar el monto en centavos para Stripe
    const amountInCents = Math.round(parseFloat(String(invoiceData.amount)) * 100);

    // Crear un precio para el producto
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountInCents,
      currency: 'usd',
    });

    // Crear un enlace de pago
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.BASE_URL || 'https://tobais.tech'}/dashboard/invoices/thank-you?invoice=${invoiceData.id}`,
        },
      },
      metadata: {
        invoiceId: invoiceData.id.toString(),
        invoiceNumber: invoiceData.number,
        clientId: invoiceData.userId.toString(),
        projectId: invoiceData.projectId ? invoiceData.projectId.toString() : '',
      },
    });

    console.log('Enlace de pago Stripe creado:', paymentLink.url);
    return paymentLink.url;
  } catch (error) {
    console.error('Error al crear enlace de pago Stripe:', error);
    throw error;
  }
}

/**
 * Genera un número de factura único basado en el cliente y la fecha
 * @param {string} clientId - ID o iniciales del cliente
 * @returns {string} - Número de factura único
 */
async function generateInvoiceNumber(clientPrefix: string): Promise<string> {
  try {
    // Buscar facturas existentes con el mismo prefijo usando SQL directo
    const query = `SELECT number FROM invoices WHERE number = $1 LIMIT 1`;
    const existingInvoices = await db.execute(query, [clientPrefix]);
    
    // Si ya existe una factura con ese número exacto, añadir un contador al final
    if (existingInvoices.length > 0) {
      // Obtener todas las facturas que empiezan con el prefijo
      const likeQuery = `SELECT number FROM invoices WHERE number LIKE $1 ORDER BY number DESC LIMIT 1`;
      const similarInvoices = await db.execute(likeQuery, [`${clientPrefix}%`]);
      
      if (similarInvoices.length > 0) {
        const lastNumber = similarInvoices[0].number;
        // Extraer el contador al final del número (si existe)
        const match = lastNumber.match(/-(\d+)$/);
        if (match) {
          const counter = parseInt(match[1], 10) + 1;
          return `${clientPrefix}-${counter.toString().padStart(2, '0')}`;
        } else {
          // Si no tiene contador, añadir -02
          return `${clientPrefix}-02`;
        }
      }
    }
    
    // Si no existe, usar el prefijo como está
    return clientPrefix;
  } catch (error) {
    console.error('Error al generar número de factura:', error);
    throw error;
  }
}

/**
 * Crea una nueva factura
 * @param {Object} invoiceData - Datos de la factura
 * @returns {Promise<Object>} - La factura creada
 */
export async function createNewInvoice(invoiceData: {
  clientEmail: string;
  projectId?: number;
  invoiceNumber: string;
  description: string;
  amount: number;
  dueDate?: Date;
  taxRate?: number;
  notes?: string;
  items?: any[];
}) {
  try {
    console.log('Iniciando creación de factura...');
    
    // 1. Encontrar el cliente por su email
    const userQuery = `SELECT id, email, first_name, last_name FROM users WHERE email = $1 LIMIT 1`;
    const userResult = await db.execute(userQuery, [invoiceData.clientEmail]);
    
    if (userResult.length === 0) {
      throw new Error(`Cliente con email ${invoiceData.clientEmail} no encontrado`);
    }
    
    const client = userResult[0];
    console.log('Cliente encontrado:', client.id, client.email);
    
    // 2. Encontrar el proyecto si se proporciona ID
    let project = null;
    if (invoiceData.projectId) {
      const projectQuery = `SELECT id, title FROM projects WHERE id = $1 LIMIT 1`;
      const projectResult = await db.execute(projectQuery, [invoiceData.projectId]);
      
      if (projectResult.length > 0) {
        project = projectResult[0];
        console.log('Proyecto encontrado:', project.id, project.title);
      }
    }
    
    // 3. Generar número de factura si es necesario
    const invoiceNumber = await generateInvoiceNumber(invoiceData.invoiceNumber);
    
    // 4. Preparar datos de la factura
    const today = new Date();
    
    // Asegurarnos de que dueDate sea un objeto Date válido
    let dueDate = invoiceData.dueDate;
    if (!dueDate) {
      dueDate = new Date(today);
      dueDate.setDate(today.getDate() + 14); // 14 días para pagar por defecto
    } else if (!(dueDate instanceof Date)) {
      dueDate = new Date(dueDate);
    }
    
    // Asegurarnos de que todos los valores numéricos sean correctos
    const invoiceAmount = invoiceData.amount;
    const taxRate = invoiceData.taxRate || 0.0;
    const taxAmount = invoiceAmount * (taxRate / 100);
    const totalAmount = invoiceAmount + taxAmount;
    
    // Si se proporcionan items como objetos, convertirlos a JSON
    let itemsJson = "[]";
    if (invoiceData.items && Array.isArray(invoiceData.items)) {
      itemsJson = JSON.stringify(invoiceData.items);
    }
    
    const metadata = JSON.stringify({
      issuedBy: 'TOBAIS Technology On Business Artificial Intelligence Solutions LLC',
      legalDisclaimer: 'This invoice does not include sales tax. TOBAIS Technology On Business Artificial Intelligence Solutions LLC reserves the right to apply applicable taxes based on the nature of the services and client location, in compliance with state and federal regulations.',
    });
    
    // 5. Crear la factura en la base de datos usando SQL directo
    console.log('Creando factura en la base de datos...');
    const insertQuery = `
      INSERT INTO invoices (
        user_id, project_id, number, description, status, 
        issue_date, due_date, total, notes, items, 
        tax_rate, metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 
        $6, $7, $8, $9, $10, 
        $11, $12, $13, $14
      ) RETURNING *
    `;
    
    const insertParams = [
      client.id,
      project?.id || null,
      invoiceNumber,
      invoiceData.description,
      'pending',
      today.toISOString(),
      dueDate.toISOString(),
      totalAmount,
      invoiceData.notes || '',
      itemsJson,
      taxRate,
      metadata,
      today.toISOString(),
      today.toISOString()
    ];
    
    const newInvoiceResult = await db.execute(insertQuery, insertParams);
    
    if (newInvoiceResult.length === 0) {
      throw new Error('No se pudo crear la factura');
    }
    
    const newInvoice = newInvoiceResult[0];
    
    // 6. Crear enlace de pago Stripe
    console.log('Factura creada, generando enlace de pago Stripe...');
    const paymentLink = await createStripePaymentLink({
      id: newInvoice.id,
      number: newInvoice.number,
      userId: client.id,
      projectId: project?.id,
      description: invoiceData.description,
      amount: totalAmount,
    });
    
    // 7. Actualizar factura con enlace de pago
    console.log('Actualizando factura con enlace de pago...');
    const updateQuery = `
      UPDATE invoices
      SET payment_link = $1, updated_at = $2
      WHERE id = $3
      RETURNING *
    `;
    
    const updateResult = await db.execute(updateQuery, [
      paymentLink,
      new Date().toISOString(),
      newInvoice.id
    ]);
    
    if (updateResult.length === 0) {
      throw new Error('No se pudo actualizar la factura con el enlace de pago');
    }
    
    const updatedInvoice = updateResult[0];
    console.log('Factura creada exitosamente:', updatedInvoice.id);
    return updatedInvoice;
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
}

// Función de ayuda para pruebas
export async function createInvoiceExample() {
  try {
    // Primero verifiquemos que el usuario existe
    const userQuery = `SELECT id, email FROM users WHERE email = $1 LIMIT 1`;
    const userResult = await db.execute(userQuery, ['dimartoro@outlook.com']);
    
    if (userResult.length === 0) {
      console.log('El usuario con email dimartoro@outlook.com no existe, buscando otro usuario');
      
      // Buscar cualquier usuario disponible (preferiblemente un cliente)
      const anyUserQuery = `SELECT id, email FROM users WHERE admin_level = 0 LIMIT 1`;
      const anyUserResult = await db.execute(anyUserQuery);
      
      if (anyUserResult.length === 0) {
        throw new Error('No se encontró ningún usuario para crear una factura de prueba');
      }
      
      console.log('Usuario encontrado:', anyUserResult[0].email);
      
      // Ejemplo de creación de factura con el usuario encontrado
      const invoice = await createNewInvoice({
        clientEmail: anyUserResult[0].email,
        invoiceNumber: '0002-TEST',
        description: 'Servicios de Diseño Web y Branding',
        amount: 500.00, // $500.00
        items: [
          {
            description: 'Diseño de Sitio Web Responsivo',
            details: 'Diseño y desarrollo de sitio web compatible con dispositivos móviles',
            amount: 300.00
          },
          {
            description: 'Diseño de Logo e Identidad Visual',
            details: 'Creación de logo, paleta de colores y guía de estilo',
            amount: 200.00
          }
        ],
        notes: 'Factura por servicios de diseño web y branding. Plazo de pago: 14 días.'
      });
      
      console.log('Factura ejemplo creada:', invoice);
      return invoice;
    } else {
      // Si el usuario dimartoro@outlook.com existe, usarlo
      console.log('Usuario encontrado:', userResult[0].email);
      
      // Ejemplo de creación de factura
      const invoice = await createNewInvoice({
        clientEmail: 'dimartoro@outlook.com',
        invoiceNumber: '0002-MB',
        description: 'Servicios de Diseño Web y Branding',
        amount: 500.00, // $500.00
        items: [
          {
            description: 'Diseño de Sitio Web Responsivo',
            details: 'Diseño y desarrollo de sitio web compatible con dispositivos móviles',
            amount: 300.00
          },
          {
            description: 'Diseño de Logo e Identidad Visual',
            details: 'Creación de logo, paleta de colores y guía de estilo',
            amount: 200.00
          }
        ],
        notes: 'Factura por servicios de diseño web y branding. Plazo de pago: 14 días.'
      });
      
      console.log('Factura ejemplo creada:', invoice);
      return invoice;
    }
  } catch (error) {
    console.error('Error al crear factura de ejemplo:', error);
    throw error;
  }
}

// Auto-ejecutar la función si este archivo se ejecuta directamente
// En módulos ES no podemos usar require.main, así que simplemente ejecutamos la función
createInvoiceExample()
  .then(() => {
    console.log('Proceso completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso:', error);
    process.exit(1);
  });