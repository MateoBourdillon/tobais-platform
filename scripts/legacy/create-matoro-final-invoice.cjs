// Script para crear la factura final del proyecto Matoro Bridge Platform
const { Pool } = require('pg');

async function createMatoroFinalInvoice() {
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
    
    // 2. Obtener el proyecto Matoro Bridge Platform
    const projectResult = await pool.query(`
      SELECT * FROM projects WHERE title ILIKE '%Matoro Bridge Platform%'
    `);
    
    if (projectResult.rows.length === 0) {
      throw new Error('No se encontró el proyecto Matoro Bridge Platform.');
    }
    
    const projectId = projectResult.rows[0].id;
    console.log(`Proyecto Matoro Bridge Platform encontrado con ID: ${projectId}`);
    
    // 3. Verificar las facturas existentes
    const invoiceResult = await pool.query(`
      SELECT * FROM invoices WHERE project_id = $1 ORDER BY due_date
    `, [projectId]);
    
    console.log(`Facturas encontradas: ${invoiceResult.rows.length}`);
    
    // Ver si ya hay una segunda factura
    let hasFinalInvoice = false;
    
    if (invoiceResult.rows.length > 0) {
      // Mostrar las facturas existentes
      console.log('Facturas existentes:');
      invoiceResult.rows.forEach((invoice, index) => {
        console.log(`${index + 1}. Factura ${invoice.number}: $${invoice.total} (${invoice.status})`);
        
        // Si es una factura con descripción que incluye "final" o "second" o tiene número que termina en "002"
        if (
          invoice.description?.toLowerCase().includes('final') || 
          invoice.description?.toLowerCase().includes('second') ||
          invoice.number?.endsWith('002')
        ) {
          hasFinalInvoice = true;
          console.log('   ⚠️ Esta parece ser la factura final.');
        }
      });
    }
    
    // Si no hay una segunda factura, crearla
    if (!hasFinalInvoice) {
      // Crear segunda factura (50% final - $1,250)
      console.log('Creando factura final (50%)...');
      
      // Determinar el formato de número adecuado
      let invoicePrefix = 'INV-2025-05';
      
      // Si hay una factura existente, usar el mismo formato pero incrementar el contador
      if (invoiceResult.rows.length > 0) {
        const lastInvoiceNumber = invoiceResult.rows[0].number;
        // Extraer el prefijo (todo hasta el último guión)
        const lastNumberParts = lastInvoiceNumber.split('-');
        if (lastNumberParts.length >= 2) {
          // Extraer el prefijo sin el número de secuencia
          invoicePrefix = lastNumberParts.slice(0, -1).join('-');
        }
      }
      
      // Crear los items de la factura como JSONB
      const finalInvoiceItems = JSON.stringify([
        {
          description: "Pago final (50%) - Matoro Bridge Platform",
          quantity: 1,
          price: 1250,
          amount: 1250
        }
      ]);
      
      const finalInvoice = await pool.query(`
        INSERT INTO invoices (
          user_id, project_id, number, description, status, 
          issue_date, due_date, total, notes, items
        )
        VALUES (
          $1, $2, $3 || '-002', 'Final Payment - Matoro Bridge Platform by Matoro Consulting LLC', 'pending', 
          NOW() + INTERVAL '25 days', NOW() + INTERVAL '32 days', 1250, 'Pago final del 50% del proyecto', $4
        )
        RETURNING id, number
      `, [userId, projectId, invoicePrefix, finalInvoiceItems]);
      
      console.log(`Factura final creada: ${finalInvoice.rows[0].number} con ID: ${finalInvoice.rows[0].id}`);
    } else {
      console.log('Ya existe una factura final para este proyecto. No se ha creado una nueva.');
    }
    
    // 4. Verificar todas las facturas
    console.log('\nResumen de facturas actualizado:');
    const updatedInvoiceDetails = await pool.query('SELECT * FROM invoices WHERE project_id = $1 ORDER BY issue_date', [projectId]);
    updatedInvoiceDetails.rows.forEach(invoice => {
      console.log(`- Factura ${invoice.number}:`);
      console.log(`  Total: $${invoice.total}`);
      console.log(`  Estado: ${invoice.status}`);
      console.log(`  Fecha emisión: ${invoice.issue_date}`);
      console.log(`  Fecha vencimiento: ${invoice.due_date}`);
      console.log(`  Descripción: ${invoice.description}`);
    });
    
  } catch (error) {
    console.error('Error al crear la factura final para Maryuri:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

createMatoroFinalInvoice().catch(console.error);