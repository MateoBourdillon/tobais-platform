import { db } from './db';
import Stripe from 'stripe';

// Configurar Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');

// Función para eliminar una factura por su número
async function deleteInvoiceByNumber(invoiceNumber: string) {
  try {
    console.log('Buscando factura para eliminar:', invoiceNumber);
    
    // Usar SQL directo sin parámetros
    const findQuery = `SELECT id, number, total FROM invoices WHERE number = '${invoiceNumber}'`;
    const result = await db.execute(findQuery);
    
    if (!result || result.length === 0) {
      console.log(`No se encontró ninguna factura con número ${invoiceNumber}`);
      return false;
    }
    
    const invoiceId = result[0].id;
    console.log(`Factura encontrada: ID=${invoiceId}, Total=${result[0].total}`);
    
    // Eliminar la factura
    const deleteQuery = `DELETE FROM invoices WHERE id = ${invoiceId}`;
    await db.execute(deleteQuery);
    
    console.log(`Factura ${invoiceNumber} eliminada correctamente`);
    return true;
  } catch (error) {
    console.error('Error al eliminar factura:', error);
    return false;
  }
}

// Función para crear una factura para Maryuri Alba
async function createMaryuriInvoice() {
  try {
    console.log('Buscando usuario Maryuri Alba (dimartoro@outlook.com)');
    
    // Buscar cliente
    const clientQuery = `SELECT id, email, first_name, last_name FROM users WHERE email = 'dimartoro@outlook.com'`;
    const clientResult = await db.execute(clientQuery);
    
    if (!clientResult || clientResult.length === 0) {
      throw new Error('Cliente Maryuri Alba no encontrado');
    }
    
    const client = clientResult[0];
    console.log('Cliente encontrado:', client.id, client.email);
    
    // Buscar proyecto Matoro Bridge
    const projectQuery = `SELECT id, title FROM projects WHERE title LIKE '%Matoro Bridge%'`;
    const projectResult = await db.execute(projectQuery);
    
    if (!projectResult || projectResult.length === 0) {
      throw new Error('Proyecto Matoro Bridge no encontrado');
    }
    
    const project = projectResult[0];
    console.log('Proyecto encontrado:', project.id, project.title);
    
    // Generar datos de la factura
    const invoiceNumber = '0002-MB';
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 14); // 14 días para pagar
    
    const amount = 1250.00; // $1,250.00
    const description = 'Matoro Bridge Platform (50% upfront payment)';
    
    const itemsJson = JSON.stringify([
      {
        description: 'Strategic Branding & Visual Identity',
        details: 'Naming, logo design, color palette, tone of voice, and foundational assets',
        amount: 250.00
      },
      {
        description: 'Professional Website & Platform Development',
        details: 'Responsive, bilingual design with admin dashboard',
        amount: 500.00
      },
      {
        description: 'Secure Document Management & MIA Integration',
        details: 'Document upload/download with access control and MIA integration',
        amount: 250.00
      },
      {
        description: 'E-commerce & Payment Integration',
        details: 'Stripe/PayPal integration with payment tracking',
        amount: 150.00
      },
      {
        description: 'Blog & Publishing Space',
        details: 'Built-in blog with categories for articles and workshops',
        amount: 100.00
      }
    ]);
    
    const notes = 'Esta factura corresponde al 50% inicial del proyecto Matoro Bridge Platform.';
    const metadataJson = JSON.stringify({
      issuedBy: 'TOBAIS Technology On Business Artificial Intelligence Solutions LLC',
      legalDisclaimer: 'This invoice does not include sales tax.'
    });
    
    // Crear factura
    console.log('Creando factura...');
    const query = `
      INSERT INTO invoices (
        user_id, project_id, number, description, status,
        issue_date, due_date, total, notes, items,
        metadata, created_at, updated_at
      ) VALUES (
        ${client.id}, ${project.id}, '${invoiceNumber}', '${description}', 'pending',
        '${today.toISOString()}', '${dueDate.toISOString()}', ${amount}, '${notes}', '${itemsJson}',
        '${metadataJson}', '${today.toISOString()}', '${today.toISOString()}'
      ) RETURNING *
    `;
    
    const result = await db.execute(query);
    
    if (!result || result.length === 0) {
      throw new Error('No se pudo crear la factura');
    }
    
    const invoice = result[0];
    console.log('Factura creada exitosamente:', invoice.id, invoice.number);
    
    // Crear enlace de pago en Stripe
    console.log('Creando enlace de pago en Stripe...');
    try {
      const product = await stripe.products.create({
        name: `Factura ${invoiceNumber}: ${description}`,
        description: 'Servicios de TOBAIS Technology'
      });
      
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: Math.round(amount * 100), // convertir a centavos
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
      
      // Actualizar factura con enlace de pago
      const updateQuery = `
        UPDATE invoices
        SET payment_link = '${paymentLink.url}', updated_at = '${new Date().toISOString()}'
        WHERE id = ${invoice.id}
        RETURNING *
      `;
      
      const updateResult = await db.execute(updateQuery);
      
      if (!updateResult || updateResult.length === 0) {
        console.warn('No se pudo actualizar la factura con el enlace de pago');
      } else {
        console.log('Factura actualizada con enlace de pago:', paymentLink.url);
      }
      
      return updateResult[0] || invoice;
    } catch (stripeError) {
      console.error('Error al crear enlace de pago en Stripe:', stripeError);
      return invoice; // Devolver la factura sin enlace de pago
    }
  } catch (error) {
    console.error('Error al crear factura:', error);
    throw error;
  }
}

// Ejecutar el script principal
async function main() {
  try {
    // 1. Primero eliminar la factura 0002-MB si existe
    await deleteInvoiceByNumber('0002-MB');
    
    // 2. Crear una nueva factura
    const invoice = await createMaryuriInvoice();
    
    console.log('Proceso completado con éxito');
    console.log('Nueva factura creada:', invoice.number, invoice.total);
    
    return { success: true, invoice };
  } catch (error) {
    console.error('Error en el proceso:', error);
    return { success: false, error };
  }
}

// Ejecutar el script
main()
  .then((result) => {
    console.log('Terminado:', result.success ? 'ÉXITO' : 'FALLO');
    process.exit(result.success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });