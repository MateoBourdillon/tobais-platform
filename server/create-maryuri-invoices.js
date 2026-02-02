/**
 * Script para crear facturas para Maryuri Alba y el proyecto Matoro Bridge Platform
 * @author TOBAIS Technology
 * @date 06/05/2025
 */

import { db } from './db.js'; // Cambiamos a db.ts
import { eq } from 'drizzle-orm';
import { users, projects, invoices } from '../shared/schema.js'; // Cambiamos a schema.ts
import Stripe from 'stripe';
import { sendInvoiceEmail } from './email.js';
import { generateInvoicePDF, saveInvoicePDF } from './invoice-pdf.js';

// Configuración de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Variable de entorno STRIPE_SECRET_KEY no configurada');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

/**
 * Genera un número de factura único para el proyecto Matoro Bridge
 * @returns {string} Número de factura en formato '0001-MB'
 */
async function generateInvoiceNumber() {
  // Número fijo para la primera factura
  return '0001-MB';
}

/**
 * Busca el cliente Maryuri Alba por nombre
 * Si no existe, lo crea
 * @returns {Promise<Object>} El cliente encontrado o creado
 */
async function findOrCreateMaryuriAlba() {
  // Buscar usuario existente
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'maryuri@matoroconsulting.com'));

  if (existingUser) {
    console.log('Cliente Maryuri Alba encontrado:', existingUser.id);
    return existingUser;
  }

  // Si no existe, crear el usuario
  console.log('Cliente Maryuri Alba no encontrado, creando nuevo registro...');
  const [newUser] = await db
    .insert(users)
    .values({
      firstName: 'Maryuri',
      lastName: 'Alba',
      email: 'maryuri@matoroconsulting.com',
      username: 'maryurialba',
      password: 'hash_placeholder_temporal', // En producción, usar password hasheado adecuadamente
      phone: '+1 (999) 888-7777', // Placeholder, actualizar con datos reales
      role: 'client',
      status: 'active',
      bio: 'CEO de Matoro Consulting LLC',
      preferences: JSON.stringify({ language: 'es' }),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning();

  console.log('Cliente Maryuri Alba creado con ID:', newUser.id);
  return newUser;
}

/**
 * Busca o crea el proyecto Matoro Bridge Platform
 * @param {number} clientId ID del cliente
 * @returns {Promise<Object>} El proyecto encontrado o creado
 */
async function findOrCreateMatoroBridgeProject(clientId) {
  // Buscar proyecto existente
  const [existingProject] = await db
    .select()
    .from(projects)
    .where(eq(projects.name, 'Matoro Bridge Platform'));

  if (existingProject) {
    console.log('Proyecto Matoro Bridge Platform encontrado:', existingProject.id);
    return existingProject;
  }

  // Si no existe, crear el proyecto
  console.log('Proyecto Matoro Bridge Platform no encontrado, creando nuevo registro...');
  const [newProject] = await db
    .insert(projects)
    .values({
      userId: clientId,
      name: 'Matoro Bridge Platform',
      description: 'Plataforma bilingüe de servicios para Matoro Consulting LLC que facilita servicios de migración, consultoría y recursos para clientes internacionales.',
      status: 'in_progress',
      budget: 2500 * 100, // $2,500.00 en centavos
      startDate: new Date(),
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)), // 3 meses después
      createdAt: new Date(),
      updatedAt: new Date(),
      adminNotes: 'Proyecto premium para Maryuri Alba. Prioridad alta. Incluye branding completo, sitio web bilingüe, dashboard administrativo, gestión documental segura, MIA (Agente de Inteligencia Migratoria), integración de pagos, blog y soporte continuo.'
    })
    .returning();

  console.log('Proyecto Matoro Bridge Platform creado con ID:', newProject.id);
  return newProject;
}

/**
 * Crea un enlace de pago en Stripe para la factura
 * @param {object} invoiceData Datos de la factura
 * @returns {Promise<string>} URL del enlace de pago
 */
async function createStripePaymentLink(invoiceData) {
  try {
    const productName = `Factura ${invoiceData.number}: ${invoiceData.description}`;
    
    // Crear un producto en Stripe
    const product = await stripe.products.create({
      name: productName,
      description: 'Servicios de TOBAIS Technology para Matoro Consulting LLC',
    });

    // Crear un precio para el producto
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: invoiceData.amount,
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
 * Crea la factura para Maryuri Alba
 * @returns {Promise<Object>} La factura creada
 */
async function createMaryuriInvoices() {
  try {
    console.log('Iniciando creación de factura para Maryuri Alba...');
    
    // 1. Encontrar o crear el cliente
    const client = await findOrCreateMaryuriAlba();
    
    // 2. Encontrar o crear el proyecto
    const project = await findOrCreateMatoroBridgeProject(client.id);
    
    // 3. Generar número de factura
    const invoiceNumber = await generateInvoiceNumber();
    
    // 4. Preparar datos de la factura
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 14); // 14 días para pagar
    
    const invoiceAmount = 125000; // $1,250.00 (en centavos)
    const taxRate = 0.0; // 0% impuestos
    const taxAmount = 0; // $0.00 (en centavos)
    const totalAmount = invoiceAmount + taxAmount; // $1,250.00 (en centavos)
    
    const invoiceDescription = 'Matoro Bridge Platform (50% upfront payment)';
    
    const invoiceItems = JSON.stringify([
      {
        description: 'Strategic Branding & Visual Identity',
        details: 'Naming, logo design, color palette, tone of voice, and foundational assets',
        amount: 25000 // $250.00 (en centavos)
      },
      {
        description: 'Professional Website & Platform Development',
        details: 'Responsive, bilingual design with admin dashboard',
        amount: 50000 // $500.00 (en centavos)
      },
      {
        description: 'Secure Document Management & MIA Integration',
        details: 'Document upload/download with access control and MIA integration',
        amount: 25000 // $250.00 (en centavos)
      },
      {
        description: 'E-commerce & Payment Integration',
        details: 'Stripe/PayPal integration with payment tracking',
        amount: 15000 // $150.00 (en centavos)
      },
      {
        description: 'Blog & Publishing Space',
        details: 'Built-in blog with categories for articles and workshops',
        amount: 10000 // $100.00 (en centavos)
      },
      {
        description: 'Support & Marketing Services',
        details: '4 marketing campaigns, 3 months onboarding, 6 months warranty',
        amount: 25000 // $250.00 (en centavos)
      }
    ]);
    
    const invoiceNotes = 'Esta factura corresponde al 50% inicial del proyecto Matoro Bridge Platform. El monto restante será facturado al completar el proyecto.\n\nThis invoice covers the initial 50% of the Matoro Bridge Platform project. The remaining amount will be invoiced upon project completion.';
    
    // 5. Crear la factura en la base de datos (sin enlace de pago aún)
    console.log('Creando factura en la base de datos...');
    const [newInvoice] = await db
      .insert(invoices)
      .values({
        userId: client.id,
        projectId: project.id,
        number: invoiceNumber,
        status: 'pending',
        issueDate: today,
        dueDate: dueDate,
        amount: invoiceAmount,
        taxRate: taxRate,
        tax: taxAmount,
        total: totalAmount,
        description: invoiceDescription,
        notes: invoiceNotes,
        paymentMethod: 'stripe',
        items: invoiceItems,
        createdAt: today,
        updatedAt: today,
        metadata: JSON.stringify({
          brand: 'Matoro Consulting LLC',
          projectFullValue: 250000, // $2,500.00 (en centavos)
          issuedBy: 'TOBAIS Technology On Business Artificial Intelligence Solutions LLC',
          legalDisclaimer: 'This invoice does not include sales tax. TOBAIS Technology On Business Artificial Intelligence Solutions LLC reserves the right to apply applicable taxes based on the nature of the services and client location, in compliance with state and federal regulations.',
        })
      })
      .returning();
    
    // 6. Crear enlace de pago Stripe
    console.log('Factura creada, generando enlace de pago Stripe...');
    const paymentLink = await createStripePaymentLink({
      id: newInvoice.id,
      number: newInvoice.number,
      userId: client.id,
      projectId: project.id,
      description: invoiceDescription,
      amount: totalAmount,
    });
    
    // 7. Actualizar factura con enlace de pago
    console.log('Actualizando factura con enlace de pago...');
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        paymentLink: paymentLink,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, newInvoice.id))
      .returning();
    
    // 8. Generar PDF de la factura
    console.log('Generando PDF de la factura...');
    let pdfPath = null;
    
    try {
      // Generar y guardar el PDF
      pdfPath = await saveInvoicePDF(updatedInvoice.id);
      console.log(`PDF de factura generado en: ${pdfPath}`);
      
      // Actualizar la factura con la ruta del PDF
      await db
        .update(invoices)
        .set({
          metadata: JSON.stringify({
            ...JSON.parse(updatedInvoice.metadata || '{}'),
            pdfGenerated: true,
            pdfPath: pdfPath,
            pdfGeneratedDate: new Date().toISOString(),
          }),
          updatedAt: new Date()
        })
        .where(eq(invoices.id, updatedInvoice.id));
      
      console.log('Factura actualizada con información del PDF');
    } catch (pdfError) {
      console.error('Error al generar PDF de factura:', pdfError);
      // Continuamos a pesar del error en la generación del PDF
    }
    
    // 9. Enviar correo electrónico con la factura
    console.log('Enviando correo electrónico con la factura...');
    
    try {
      // Preparar datos para el correo electrónico
      const emailSent = await sendInvoiceEmail({
        to: client.email,
        clientName: `${client.firstName} ${client.lastName}`,
        invoiceNumber: updatedInvoice.number,
        amount: updatedInvoice.total / 100, // Convertir de centavos a dólares
        dueDate: updatedInvoice.dueDate,
        description: updatedInvoice.description,
        paymentLink: updatedInvoice.paymentLink,
        // TODO: Añadir el PDF como adjunto cuando el servicio de email esté configurado
        // attachments: pdfPath ? [{ path: pdfPath }] : undefined,
      });
      
      console.log(`Correo electrónico de factura ${emailSent ? 'enviado' : 'no enviado'}`);
      
      // Actualizar el estado del envío de correo en la factura
      if (emailSent) {
        await db
          .update(invoices)
          .set({
            metadata: JSON.stringify({
              ...JSON.parse(updatedInvoice.metadata || '{}'),
              emailSent: true,
              emailSentDate: new Date().toISOString(),
              pdfAttached: !!pdfPath,
            }),
            updatedAt: new Date()
          })
          .where(eq(invoices.id, updatedInvoice.id));
          
        console.log('Factura actualizada con información de envío de correo');
      }
    } catch (emailError) {
      console.error('Error al enviar correo electrónico de factura:', emailError);
      // Continuamos a pesar del error en el correo
    }
    
    console.log('Factura para Maryuri Alba creada exitosamente:', updatedInvoice.id);
    return updatedInvoice;
  } catch (error) {
    console.error('Error al crear factura para Maryuri Alba:', error);
    throw error;
  }
}

// Exportar la función principal
export { createMaryuriInvoices };