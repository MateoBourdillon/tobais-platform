/**
 * Módulo para generar PDFs de facturas
 * @author TOBAIS Technology
 * @date 06/05/2025
 */

import PDFDocument from 'pdfkit';
import { users, projects, invoices } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { db } from './db.js';
import fs from 'fs';
import path from 'path';

/**
 * Genera un PDF para una factura
 * @param {number} invoiceId - ID de la factura
 * @returns {Promise<Buffer>} - Contenido del PDF como Buffer
 */
export async function generateInvoicePDF(invoiceId) {
  try {
    // Import storage dynamically to avoid circular dependencies 
    const { storage } = await import('./storage.js');
    console.log(`Generating PDF for invoice ID: ${invoiceId}`);
    
    // 1. Obtener datos completos de la factura usando SQL directo
    const sqlQuery = `
      SELECT 
        i.id, i.user_id, i.project_id, i.number, i.description, i.status, 
        i.issue_date, i.due_date, i.total, i.notes, i.payment_method, 
        i.payment_date, i.stripe_invoice_id, i.stripe_payment_intent_id, 
        i.paypal_order_id, i.payment_link, i.items, i.metadata, i.created_at, i.updated_at,
        u.first_name, u.last_name, u.email
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.id = $1
      LIMIT 1
    `;
    
    const { db } = await import('./db.js');
    const results = await db.execute(sqlQuery, [invoiceId]);
    
    if (results.length === 0) {
      throw new Error(`Factura con ID ${invoiceId} no encontrada`);
    }
    
    const row = results[0];
    console.log(`Found invoice: ${row.number} for client ${row.first_name} ${row.last_name}`);
    
    // Prepare client and invoice objects
    const client = {
      id: row.user_id,
      firstName: row.first_name,
      lastName: row.last_name,
      email: row.email,
      phone: null // We don't store phone in the direct query
    };
    
    const invoice = {
      id: row.id,
      userId: row.user_id,
      projectId: row.project_id,
      number: row.number,
      description: row.description,
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      amount: parseFloat(String(row.total)),
      tax: 0,
      taxRate: 0,
      discount: 0,
      total: parseFloat(String(row.total)),
      notes: row.notes,
      paymentMethod: row.payment_method,
      paymentDate: row.payment_date,
      stripeInvoiceId: row.stripe_invoice_id,
      stripePaymentIntentId: row.stripe_payment_intent_id,
      paypalOrderId: row.paypal_order_id,
      paymentLink: row.payment_link,
      items: row.items,
      metadata: row.metadata,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    // 3. Obtener datos del proyecto si existe
    let project = null;
    if (invoice.projectId) {
      try {
        // Get project using a direct SQL query
        const projectQuery = `
          SELECT * FROM projects WHERE id = $1 LIMIT 1
        `;
        const projectResults = await db.execute(projectQuery, [invoice.projectId]);
        if (projectResults.length > 0) {
          project = projectResults[0];
        }
      } catch (projectError) {
        console.error("Error getting project data:", projectError);
        // Continue without project data
      }
    }
    
    // 4. Preparar datos del PDF
    const invoiceItems = JSON.parse(invoice.items || '[]');
    const invoiceMetadata = JSON.parse(invoice.metadata || '{}');
    
    // 5. Crear el documento PDF
    const pdfBuffer = await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          margin: 50,
          size: 'LETTER'
        });
        
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', err => reject(err));
        
        // Configurar fuentes
        doc.font('Helvetica');
        
        // Encabezado de la factura
        doc.fontSize(24)
          .fillColor('#2C3E50')
          .text('TOBAIS', { align: 'right' })
          .fontSize(10)
          .fillColor('#666')
          .text('Technology On Business Artificial Intelligence Solutions', { align: 'right' })
          .moveDown(0.5);
        
        // Información de contacto de TOBAIS
        doc.fontSize(9)
          .text('www.tobais.tech', { align: 'right' })
          .text('sales@tobais.com', { align: 'right' })
          .text('+1 (704) 207-1760', { align: 'right' })
          .moveDown(1);
        
        // Información del cliente
        doc.fontSize(10)
          .fillColor('#000')
          .text(`FACTURAR A:`, { continued: false })
          .text(`${client.firstName} ${client.lastName}`, { continued: false })
          .text(`${client.email}`, { continued: false });
        
        if (client.phone) {
          doc.text(`${client.phone}`, { continued: false });
        }
        
        if (invoiceMetadata.brand) {
          doc.text(`${invoiceMetadata.brand}`, { continued: false });
        }
        
        doc.moveDown(1);
        
        // Información de la factura
        doc.fontSize(18)
          .fillColor('#2C3E50')
          .text(`FACTURA #${invoice.number}`, { align: 'left' })
          .moveDown(0.5);
        
        // Tabla de información de la factura
        doc.fontSize(10)
          .fillColor('#000');
        
        // Crear tabla simple con fechas y estado
        doc.text(`Fecha de emisión: ${invoice.issueDate.toLocaleDateString()}`, { continued: false })
          .text(`Fecha de vencimiento: ${invoice.dueDate.toLocaleDateString()}`, { continued: false })
          .text(`Estado: ${getInvoiceStatusInSpanish(invoice.status)}`, { continued: false })
          .moveDown(1);
        
        // Descripción del proyecto si existe
        if (project) {
          doc.fillColor('#2C3E50')
            .fontSize(12)
            .text('Proyecto', { continued: false })
            .fillColor('#000')
            .fontSize(10)
            .text(`${project.name}`, { continued: false })
            .text(`${project.description}`, { continued: false })
            .moveDown(1);
        }
        
        // Descripción de la factura
        doc.fillColor('#2C3E50')
          .fontSize(12)
          .text('Descripción', { continued: false })
          .fillColor('#000')
          .fontSize(10)
          .text(`${invoice.description}`, { continued: false })
          .moveDown(1);
        
        // Tabla de elementos de la factura
        doc.fillColor('#2C3E50')
          .fontSize(12)
          .text('Detalle de Servicios', { continued: false })
          .moveDown(0.5);
        
        // Encabezados de la tabla
        const tableTop = doc.y;
        const tableLeft = 50;
        const tableWidth = doc.page.width - 100;
        const descriptionWidth = tableWidth * 0.6;
        const amountWidth = tableWidth * 0.2;
        const detailsWidth = tableWidth * 0.2;
        
        // Dibujar encabezados
        doc.fillColor('#2C3E50')
          .fontSize(10)
          .text('Descripción', tableLeft, tableTop, { width: descriptionWidth, align: 'left' })
          .text('Detalles', tableLeft + descriptionWidth, tableTop, { width: detailsWidth, align: 'left' })
          .text('Monto', tableLeft + descriptionWidth + detailsWidth, tableTop, { width: amountWidth, align: 'right' });
        
        // Línea después de los encabezados
        doc.moveTo(tableLeft, doc.y + 10)
          .lineTo(tableLeft + tableWidth, doc.y + 10)
          .stroke();
        
        doc.moveDown(0.5);
        
        // Listar elementos de la factura
        let currentY = doc.y;
        doc.fillColor('#000');
        
        for (const item of invoiceItems) {
          doc.text(item.description, tableLeft, currentY, { width: descriptionWidth, align: 'left' })
            .text(item.details || '', tableLeft + descriptionWidth, currentY, { width: detailsWidth, align: 'left' })
            .text(`$${(item.amount / 100).toFixed(2)}`, tableLeft + descriptionWidth + detailsWidth, currentY, { width: amountWidth, align: 'right' });
          
          currentY = doc.y + 10;
          doc.moveDown(0.5);
        }
        
        // Línea antes del total
        currentY = doc.y;
        doc.moveTo(tableLeft, currentY)
          .lineTo(tableLeft + tableWidth, currentY)
          .stroke();
        
        doc.moveDown(0.5);
        
        // Subtotal
        currentY = doc.y;
        doc.text('Subtotal:', tableLeft + descriptionWidth, currentY, { width: detailsWidth + 50, align: 'right' })
          .text(`$${(invoice.amount / 100).toFixed(2)}`, tableLeft + descriptionWidth + detailsWidth, currentY, { width: amountWidth, align: 'right' });
        
        doc.moveDown(0.5);
        
        // Impuestos
        currentY = doc.y;
        doc.text(`Impuestos (${(invoice.taxRate * 100).toFixed(1)}%):`, tableLeft + descriptionWidth, currentY, { width: detailsWidth + 50, align: 'right' })
          .text(`$${(invoice.tax / 100).toFixed(2)}`, tableLeft + descriptionWidth + detailsWidth, currentY, { width: amountWidth, align: 'right' });
        
        doc.moveDown(0.5);
        
        // Total
        currentY = doc.y;
        doc.fillColor('#2C3E50')
          .fontSize(12)
          .text('Total:', tableLeft + descriptionWidth, currentY, { width: detailsWidth + 50, align: 'right' })
          .text(`$${(invoice.total / 100).toFixed(2)}`, tableLeft + descriptionWidth + detailsWidth, currentY, { width: amountWidth, align: 'right' });
        
        doc.moveDown(1.5);
        
        // Notas
        if (invoice.notes) {
          doc.fillColor('#2C3E50')
            .fontSize(12)
            .text('Notas', { continued: false })
            .moveDown(0.5)
            .fillColor('#000')
            .fontSize(10)
            .text(invoice.notes, { continued: false })
            .moveDown(1);
        }
        
        // Información de pago
        doc.fillColor('#2C3E50')
          .fontSize(12)
          .text('Información de Pago', { continued: false })
          .moveDown(0.5)
          .fillColor('#000')
          .fontSize(10);
        
        if (invoice.paymentLink) {
          doc.text('Para realizar el pago, visite el siguiente enlace:', { continued: false })
            .fillColor('#0066cc')
            .text(invoice.paymentLink, { continued: false, link: invoice.paymentLink, underline: true });
        } else {
          doc.text('Por favor, contacte a sales@tobais.com para coordinar el pago.', { continued: false });
        }
        
        doc.fillColor('#000')
          .moveDown(0.5)
          .text('Métodos de pago aceptados: Tarjeta de crédito, PayPal', { continued: false })
          .moveDown(1);
        
        // Pie de página con aviso legal
        const legalDisclaimer = invoiceMetadata.legalDisclaimer || 
          'This invoice does not include sales tax. TOBAIS Technology reserves the right to apply applicable taxes based on the nature of the services and client location, in compliance with state and federal regulations.';
        
        doc.fontSize(8)
          .fillColor('#666')
          .text(legalDisclaimer, { align: 'center' })
          .moveDown(0.5);
        
        // Copyright
        const currentYear = new Date().getFullYear();
        doc.text(`© ${currentYear} TOBAIS Technology. Todos los derechos reservados.`, { align: 'center' });
        
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('Error generando PDF de factura:', error);
    throw error;
  }
}

/**
 * Convierte el estado de la factura al español
 * @param {string} status - Estado en inglés
 * @returns {string} - Estado en español
 */
function getInvoiceStatusInSpanish(status) {
  const statusMap = {
    'pending': 'Pendiente',
    'paid': 'Pagada',
    'overdue': 'Vencida',
    'cancelled': 'Cancelada',
    'refunded': 'Reembolsada',
    'partial': 'Pago Parcial'
  };
  
  return statusMap[status] || status;
}

/**
 * Guarda el PDF de una factura en el sistema de archivos
 * @param {number} invoiceId - ID de la factura
 * @param {string} outputDir - Directorio de salida (opcional)
 * @returns {Promise<string>} - Ruta completa al archivo guardado
 */
export async function saveInvoicePDF(invoiceId, outputDir = './tmp/invoices') {
  try {
    // 1. Asegurarse de que el directorio exista
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 2. Obtener datos básicos de la factura para el nombre del archivo con SQL directo
    const { db } = await import('./db.js');
    const sqlQuery = `
      SELECT number, issue_date FROM invoices WHERE id = $1 LIMIT 1
    `;
    const results = await db.execute(sqlQuery, [invoiceId]);
    
    if (results.length === 0) {
      throw new Error(`Factura con ID ${invoiceId} no encontrada`);
    }
    
    const invoice = results[0];
    console.log(`Preparing to save PDF for invoice: ${invoice.number}`);
    
    // 3. Generar el PDF
    const pdfBuffer = await generateInvoicePDF(invoiceId);
    
    // 4. Definir nombre del archivo
    const fileName = `factura-${invoice.number}-${formatDateForFileName(invoice.issue_date)}.pdf`;
    const filePath = path.join(outputDir, fileName);
    
    // 5. Guardar el archivo
    fs.writeFileSync(filePath, pdfBuffer);
    console.log(`PDF de factura guardado en: ${filePath}`);
    
    return filePath;
  } catch (error) {
    console.error('Error guardando PDF de factura:', error);
    throw error;
  }
}

/**
 * Formatea una fecha para usarla en un nombre de archivo
 * @param {Date} date - Fecha a formatear
 * @returns {string} - Fecha formateada (YYYYMMDD)
 */
function formatDateForFileName(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  
  return `${year}${month}${day}`;
}