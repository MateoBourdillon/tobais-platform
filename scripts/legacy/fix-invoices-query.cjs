// Script para corregir la consulta de facturas
const { Pool } = require('pg');

async function fixInvoicesQuery() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // 1. Verificar el usuario de Maryuri
    const userResult = await pool.query(`
      SELECT * FROM users WHERE username = 'maryuri' OR email ILIKE '%maryuri%'
    `);
    
    if (userResult.rows.length === 0) {
      throw new Error('No se encontró el usuario de Maryuri Alba.');
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Usuario de Maryuri encontrado con ID: ${userId}`);
    
    // 2. Verificar las facturas existentes
    const invoiceResult = await pool.query(`
      SELECT * FROM invoices
      WHERE user_id = $1 OR user_id IS NULL
    `, [userId]);
    
    console.log(`Se encontraron ${invoiceResult.rows.length} facturas para revisar.`);
    
    // 3. Verificar y corregir cada factura
    for (const invoice of invoiceResult.rows) {
      if (invoice.user_id === null) {
        console.log(`Corrigiendo factura ${invoice.number} (ID: ${invoice.id}) sin usuario asignado...`);
        
        // Actualizar la factura para asignarle el usuario correcto
        await pool.query(`
          UPDATE invoices 
          SET user_id = $1 
          WHERE id = $2
        `, [userId, invoice.id]);
        console.log(`Factura ${invoice.number} actualizada con usuario ID: ${userId}`);
      } else {
        console.log(`Factura ${invoice.number} (ID: ${invoice.id}) ya tiene usuario asignado: ${invoice.user_id}`);
      }
    }
    
    // 4. Verificar que todas las facturas estén asociadas correctamente a un proyecto
    const projectResult = await pool.query(`
      SELECT * FROM projects WHERE title ILIKE '%Matoro Bridge Platform%'
    `);
    
    if (projectResult.rows.length === 0) {
      throw new Error('No se encontró el proyecto Matoro Bridge Platform.');
    }
    
    const projectId = projectResult.rows[0].id;
    console.log(`Proyecto Matoro Bridge Platform encontrado con ID: ${projectId}`);
    
    // 5. Asociar facturas al proyecto si no lo están
    for (const invoice of invoiceResult.rows) {
      if (invoice.project_id === null) {
        console.log(`Asociando factura ${invoice.number} (ID: ${invoice.id}) al proyecto...`);
        
        // Actualizar la factura para asignarle el proyecto correcto
        await pool.query(`
          UPDATE invoices 
          SET project_id = $1 
          WHERE id = $2
        `, [projectId, invoice.id]);
        console.log(`Factura ${invoice.number} actualizada con proyecto ID: ${projectId}`);
      } else {
        console.log(`Factura ${invoice.number} (ID: ${invoice.id}) ya tiene proyecto asignado: ${invoice.project_id}`);
      }
    }
    
    // 6. Verificar estado final de las facturas después de las correcciones
    const finalResult = await pool.query(`
      SELECT i.*, p.title as project_name, u.username as client_username
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN users u ON i.user_id = u.id
      WHERE i.user_id = $1
    `, [userId]);
    
    console.log(`\nVerificación final - ${finalResult.rows.length} facturas para Maryuri Alba:`);
    
    finalResult.rows.forEach(invoice => {
      console.log(`- Factura ${invoice.number} ($${invoice.total}): Proyecto "${invoice.project_name}", Cliente: ${invoice.client_username}`);
    });
    
  } catch (error) {
    console.error('Error en la corrección de facturas:', error);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

fixInvoicesQuery().catch(console.error);