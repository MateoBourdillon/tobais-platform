// Script para crear el proyecto Matoro Bridge Platform y las facturas para Maryuri Alba
const { Pool } = require('pg');

async function createMatoroInvoices() {
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
      throw new Error('No se encontró el usuario de Maryuri Alba. Por favor, crea el usuario primero.');
    }
    
    const userId = userResult.rows[0].id;
    console.log(`Usuario de Maryuri encontrado con ID: ${userId}`);
    
    // 2. Verificar si el proyecto Matoro Bridge Platform existe
    const projectResult = await pool.query(`
      SELECT * FROM projects WHERE title ILIKE '%Matoro Bridge Platform%'
    `);
    
    let projectId;
    
    if (projectResult.rows.length === 0) {
      // Crear el proyecto si no existe
      console.log('Creando proyecto Matoro Bridge Platform...');
      const newProject = await pool.query(`
        INSERT INTO projects (
          title, title_es, description, description_es, 
          client_id, status, start_date, end_date, image, featured
        )
        VALUES (
          'Matoro Bridge Platform by Matoro Consulting LLC', 
          'Plataforma Matoro Bridge por Matoro Consulting LLC', 
          'Bridge platform connecting services for Matoro Consulting LLC', 
          'Plataforma puente que conecta servicios para Matoro Consulting LLC', 
          $1, 'active', NOW(), NOW() + INTERVAL '30 days', NULL, true
        )
        RETURNING id
      `, [userId]);
      
      projectId = newProject.rows[0].id;
      console.log(`Proyecto Matoro Bridge Platform creado con ID: ${projectId}`);
    } else {
      projectId = projectResult.rows[0].id;
      console.log(`Proyecto Matoro Bridge Platform encontrado con ID: ${projectId}`);
    }
    
    // 3. Crear las facturas (primera fase y fase final)
    // Generar número de factura con formato: MB-2025-001 (MB = Matoro Bridge)
    const currentYear = new Date().getFullYear();
    const invoicePrefix = `MB-${currentYear}`;
    
    // Verificar si ya existen facturas para este proyecto
    const invoiceResult = await pool.query(`
      SELECT * FROM invoices WHERE project_id = $1
    `, [projectId]);
    
    if (invoiceResult.rows.length === 0) {
      // Crear primera factura (50% inicial - $1,250)
      console.log('Creando factura inicial (50%)...');
      
      // Crear los items de la factura como JSONB
      const firstInvoiceItems = JSON.stringify([
        {
          description: "Pago inicial (50%) - Matoro Bridge Platform",
          quantity: 1,
          price: 1250,
          amount: 1250
        }
      ]);
      
      const firstInvoice = await pool.query(`
        INSERT INTO invoices (
          user_id, project_id, number, description, status, 
          issue_date, due_date, total, notes, items
        )
        VALUES (
          $1, $2, $3 || '-001', 'Pago inicial para proyecto Matoro Bridge Platform', 'pending', 
          NOW(), NOW() + INTERVAL '7 days', 1250, 'Primera cuota del 50% del proyecto', $4
        )
        RETURNING id, number
      `, [userId, projectId, invoicePrefix, firstInvoiceItems]);
      
      console.log(`Factura inicial creada: ${firstInvoice.rows[0].number} con ID: ${firstInvoice.rows[0].id}`);
      
      // Crear segunda factura (50% final - $1,250)
      console.log('Creando factura final (50%)...');
      
      // Crear los items de la factura como JSONB
      const secondInvoiceItems = JSON.stringify([
        {
          description: "Pago final (50%) - Matoro Bridge Platform",
          quantity: 1,
          price: 1250,
          amount: 1250
        }
      ]);
      
      const secondInvoice = await pool.query(`
        INSERT INTO invoices (
          user_id, project_id, number, description, status, 
          issue_date, due_date, total, notes, items
        )
        VALUES (
          $1, $2, $3 || '-002', 'Pago final para proyecto Matoro Bridge Platform', 'pending', 
          NOW() + INTERVAL '25 days', NOW() + INTERVAL '32 days', 1250, 'Cuota final del 50% del proyecto', $4
        )
        RETURNING id, number
      `, [userId, projectId, invoicePrefix, secondInvoiceItems]);
      
      console.log(`Factura final creada: ${secondInvoice.rows[0].number} con ID: ${secondInvoice.rows[0].id}`);
    } else {
      console.log('Ya existen facturas para este proyecto:');
      invoiceResult.rows.forEach(invoice => {
        console.log(`- Factura ${invoice.number}: $${invoice.total} (${invoice.status})`);
      });
    }
    
    // 4. Verificar todo lo creado
    console.log('\nResumen del usuario:');
    console.log(`- ID: ${userResult.rows[0].id}`);
    console.log(`- Username: ${userResult.rows[0].username}`);
    console.log(`- Email: ${userResult.rows[0].email}`);
    console.log(`- Name: ${userResult.rows[0].first_name} ${userResult.rows[0].last_name}`);
    
    console.log('\nResumen del proyecto:');
    const projectDetails = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    console.log(`- ID: ${projectDetails.rows[0].id}`);
    console.log(`- Title: ${projectDetails.rows[0].title}`);
    console.log(`- Status: ${projectDetails.rows[0].status}`);
    console.log(`- Start Date: ${projectDetails.rows[0].start_date}`);
    
    console.log('\nResumen de facturas:');
    const invoiceDetails = await pool.query('SELECT * FROM invoices WHERE project_id = $1 ORDER BY issue_date', [projectId]);
    invoiceDetails.rows.forEach(invoice => {
      console.log(`- Factura ${invoice.number}:`);
      console.log(`  Total: $${invoice.total}`);
      console.log(`  Estado: ${invoice.status}`);
      console.log(`  Fecha emisión: ${invoice.issue_date}`);
      console.log(`  Fecha vencimiento: ${invoice.due_date}`);
      console.log(`  Descripción: ${invoice.description}`);
    });
    
  } catch (error) {
    console.error('Error al crear el proyecto y facturas para Maryuri:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

createMatoroInvoices().catch(console.error);