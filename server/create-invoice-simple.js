/**
 * Script simple para crear una factura directamente con JavaScript (ESM)
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import Stripe from 'stripe';
import ws from 'ws';

// Configurar WebSocket para Neon
neonConfig.webSocketConstructor = ws;

// Configuración de la base de datos
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function createInvoice() {
  // Conexión directa
  const client = await pool.connect();
  
  try {
    console.log('Iniciando creación de factura...');
    
    // 1. Obtener usuario
    const userResult = await client.query(
      "SELECT id, email FROM users WHERE email = 'dimartoro@outlook.com'"
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Usuario no encontrado');
    }
    
    const userId = userResult.rows[0].id;
    console.log('Usuario encontrado:', userId);
    
    // 2. Obtener proyecto
    const projectResult = await client.query(
      "SELECT id, title FROM projects WHERE title LIKE '%Matoro Bridge%'"
    );
    
    if (projectResult.rows.length === 0) {
      throw new Error('Proyecto no encontrado');
    }
    
    const projectId = projectResult.rows[0].id;
    console.log('Proyecto encontrado:', projectId);
    
    // 3. Crear factura
    const invoiceNumber = '0002-MB';
    const description = 'Matoro Bridge Platform (50% upfront payment)';
    const issueDate = new Date();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);
    const total = 1250.00;
    
    const result = await client.query(
      `INSERT INTO invoices (
        user_id, project_id, number, description, status,
        issue_date, due_date, total, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
      [
        userId, 
        projectId, 
        invoiceNumber, 
        description, 
        'pending',
        issueDate.toISOString(),
        dueDate.toISOString(),
        total,
        issueDate.toISOString(),
        issueDate.toISOString()
      ]
    );
    
    if (result.rows.length === 0) {
      throw new Error('No se pudo crear la factura');
    }
    
    const invoice = result.rows[0];
    console.log('Factura creada:', invoice.id);
    
    // 4. Crear enlace de pago Stripe
    const product = await stripe.products.create({
      name: `Factura ${invoiceNumber}: ${description}`,
      description: 'Servicios de TOBAIS Technology'
    });
    
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: Math.round(total * 100), // Convertir a centavos
      currency: 'usd'
    });
    
    const paymentLink = await stripe.paymentLinks.create({
      line_items: [{ price: price.id, quantity: 1 }],
      after_completion: {
        type: 'redirect',
        redirect: {
          url: `${process.env.BASE_URL || 'https://tobais.tech'}/dashboard/invoices/thank-you?invoice=${invoice.id}`
        }
      }
    });
    
    // 5. Actualizar factura con enlace de pago
    const updateResult = await client.query(
      `UPDATE invoices SET payment_link = $1, updated_at = $2 WHERE id = $3 RETURNING *`,
      [paymentLink.url, new Date().toISOString(), invoice.id]
    );
    
    console.log('Factura actualizada con enlace de pago:', paymentLink.url);
    
    return updateResult.rows[0] || invoice;
  } finally {
    client.release();
  }
}

// Ejecutar la función
createInvoice()
  .then(invoice => {
    console.log('Factura creada exitosamente:', invoice.id, invoice.number);
    process.exit(0);
  })
  .catch(error => {
    console.error('Error al crear factura:', error);
    process.exit(1);
  });