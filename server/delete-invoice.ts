/**
 * Script para eliminar una factura específica de la base de datos
 */

import { db } from './db';

async function deleteInvoiceByNumber(invoiceNumber: string) {
  try {
    console.log(`Buscando factura con número: ${invoiceNumber}`);
    
    // Usar SQL crudo para evitar problemas con el mapeo del esquema
    const query = `
      SELECT id, number, total FROM invoices
      WHERE number = $1
    `;
    
    const result = await db.execute(query, [invoiceNumber]);
    
    if (result.length === 0) {
      console.log(`No se encontró ninguna factura con el número: ${invoiceNumber}`);
      return false;
    }
    
    const invoiceId = result[0].id;
    console.log(`Factura encontrada: ID=${invoiceId}, Monto=${result[0].total}`);
    
    // Eliminar la factura usando SQL directo
    const deleteQuery = `
      DELETE FROM invoices
      WHERE id = $1
    `;
    await db.execute(deleteQuery, [invoiceId]);
    
    console.log(`Factura ${invoiceNumber} eliminada correctamente`);
    return true;
  } catch (error) {
    console.error(`Error al eliminar la factura ${invoiceNumber}:`, error);
    throw error;
  }
}

// Eliminar la factura de Maryuri Alba
deleteInvoiceByNumber('0001-MB')
  .then(success => {
    if (success) {
      console.log('Factura eliminada correctamente');
    } else {
      console.log('No se pudo eliminar la factura');
    }
    process.exit(0);
  })
  .catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });