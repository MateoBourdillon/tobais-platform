/**
 * Script para crear facturas para Maryuri Alba y el proyecto Matoro Bridge Platform
 * @author TOBAIS Technology
 * @date 06/05/2025
 */

import { db } from './db';
import { eq } from 'drizzle-orm';
import { users, projects, invoices } from '../shared/schema';
import Stripe from 'stripe';

// Configuración de Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Variable de entorno STRIPE_SECRET_KEY no configurada');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

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
export async function createMaryuriInvoice() {
  try {
    console.log('Iniciando creación de factura para Maryuri Alba...');
    
    // 1. Encontrar el cliente por su email
    const [client] = await db.select().from(users).where(eq(users.email, 'dimartoro@outlook.com'));
    
    if (!client) {
      throw new Error('Cliente Maryuri Alba no encontrado');
    }
    
    console.log('Cliente encontrado:', client.id, client.email);
    
    // 2. Encontrar el proyecto Matoro Bridge Platform
    const [project] = await db.select().from(projects).where(eq(projects.title, 'Matoro Bridge Platform by Matoro Consulting LLC - Global Workforce Integration & Migration Services'));
    
    if (!project) {
      throw new Error('Proyecto Matoro Bridge Platform no encontrado');
    }
    
    console.log('Proyecto encontrado:', project.id, project.title);
    
    // 3. Generar número de factura
    const invoiceNumber = '0001-MB';
    
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
        description: invoiceDescription,
        status: 'pending',
        issueDate: today,
        dueDate: dueDate,
        total: totalAmount / 100, // Convertir centavos a dólares para el campo numeric(10,2)
        notes: invoiceNotes,
        items: invoiceItems,
        taxRate: taxRate,
        metadata: JSON.stringify({
          brand: 'Matoro Consulting LLC',
          projectFullValue: 2500.00, // $2,500.00
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
    
    console.log('Factura para Maryuri Alba creada exitosamente:', updatedInvoice.id);
    return updatedInvoice;
  } catch (error) {
    console.error('Error al crear factura para Maryuri Alba:', error);
    throw error;
  }
}

// Auto-ejecutar la función
createMaryuriInvoice()
  .then((invoice) => {
    console.log('Factura creada:', invoice);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error al crear factura:', error);
    process.exit(1);
  });