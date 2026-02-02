/**
 * Script para actualizar una factura con un enlace de pago Stripe
 */

import { db } from './db';
import { eq } from 'drizzle-orm';
import { invoices } from '../migrations/schema';
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
    
    console.log('Creando producto en Stripe...');
    // Crear un producto en Stripe
    const product = await stripe.products.create({
      name: productName,
      description: 'Servicios de TOBAIS Technology para Matoro Consulting LLC',
    });

    console.log('Creando precio en Stripe...');
    // Crear un precio para el producto
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(invoiceData.total * 100), // Convertir de dólares a centavos
      currency: 'usd',
    });

    console.log('Creando enlace de pago...');
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
 * Actualiza una factura con el enlace de pago
 */
async function updateInvoicePaymentLink(invoiceId: number) {
  try {
    console.log(`Buscando factura con ID ${invoiceId}...`);
    const [invoice] = await db.select().from(invoices).where(eq(invoices.id, invoiceId));
    
    if (!invoice) {
      throw new Error(`Factura con ID ${invoiceId} no encontrada`);
    }
    
    console.log('Factura encontrada:', invoice);
    
    // Crear enlace de pago
    console.log('Creando enlace de pago Stripe...');
    const paymentLink = await createStripePaymentLink({
      id: invoice.id,
      number: invoice.number,
      userId: invoice.userId,
      projectId: invoice.projectId,
      description: invoice.description,
      total: Number(invoice.total), // Asegurarse de que sea un número
    });
    
    // Actualizar factura con enlace de pago
    console.log('Actualizando factura con enlace de pago...');
    const [updatedInvoice] = await db
      .update(invoices)
      .set({
        paymentLink: paymentLink,
        updatedAt: new Date()
      })
      .where(eq(invoices.id, invoiceId))
      .returning();
    
    console.log('Factura actualizada con enlace de pago:', updatedInvoice);
    return updatedInvoice;
  } catch (error) {
    console.error('Error al actualizar factura con enlace de pago:', error);
    throw error;
  }
}

// Ejecutar para la factura con ID 3
const invoiceId = 3;

updateInvoicePaymentLink(invoiceId)
  .then((invoice) => {
    console.log('Actualización completada:', invoice);
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en la actualización:', error);
    process.exit(1);
  });