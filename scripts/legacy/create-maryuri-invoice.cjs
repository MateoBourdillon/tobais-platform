// Script para crear el proyecto Matoro Bridge Platform y las facturas de Maryuri Alba
const { Pool } = require('pg');

async function createMaryuriInvoice() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // 1. Verificar si Maryuri Alba existe como cliente
    const clientResult = await pool.query(`
      SELECT * FROM clients WHERE name ILIKE '%Maryuri%Alba%' OR email ILIKE '%maryuri%'
    `);
    
    let clientId;
    
    if (clientResult.rows.length === 0) {
      // Crear el cliente si no existe
      console.log('Creando cliente Maryuri Alba...');
      const newClient = await pool.query(`
        INSERT INTO clients (name, email, company, phone, address, city, state, country, zip_code, notes)
        VALUES ('Maryuri Alba', 'maryuri@matoroconsulting.com', 'Matoro Consulting LLC', '704-555-1234', '123 Business Ave', 'Charlotte', 'NC', 'USA', '28273', 'Cliente importante para el proyecto Matoro Bridge Platform')
        RETURNING id
      `);
      clientId = newClient.rows[0].id;
      console.log(`Cliente Maryuri Alba creado con ID: ${clientId}`);
    } else {
      clientId = clientResult.rows[0].id;
      console.log(`Cliente Maryuri Alba encontrado con ID: ${clientId}`);
    }
    
    // 2. Verificar si el proyecto existe
    const projectResult = await pool.query(`
      SELECT * FROM projects WHERE name ILIKE '%Matoro Bridge Platform%' AND client_id = $1
    `, [clientId]);
    
    let projectId;
    
    if (projectResult.rows.length === 0) {
      // Crear el proyecto si no existe
      console.log('Creando proyecto Matoro Bridge Platform...');
      const newProject = await pool.query(`
        INSERT INTO projects (name, description, status, start_date, client_id, budget, deadline, completion_date)
        VALUES ('Matoro Bridge Platform by Matoro Consulting LLC', 'Plataforma de conexión de servicios para Matoro Consulting LLC', 'active', NOW(), $1, 2500, NOW() + INTERVAL '30 days', NULL)
        RETURNING id
      `, [clientId]);
      projectId = newProject.rows[0].id;
      console.log(`Proyecto Matoro Bridge Platform creado con ID: ${projectId}`);
    } else {
      projectId = projectResult.rows[0].id;
      console.log(`Proyecto Matoro Bridge Platform encontrado con ID: ${projectId}`);
    }
    
    // 3. Crear las facturas (primera fase y fase final)
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const invoicePrefix = `INV-${currentYear}-${String(currentMonth).padStart(2, '0')}`;
    
    // Verificar si ya existen facturas para este proyecto
    const invoiceResult = await pool.query(`
      SELECT * FROM invoices WHERE project_id = $1
    `, [projectId]);
    
    if (invoiceResult.rows.length === 0) {
      // Crear primera factura (50% inicial)
      console.log('Creando factura inicial (50%)...');
      const firstInvoice = await pool.query(`
        INSERT INTO invoices (
          invoice_number, client_id, project_id, amount, status, issue_date, 
          due_date, notes, items, currency, tax_rate, discount
        )
        VALUES (
          $1 || '-001', $2, $3, 1250, 'pending', NOW(), 
          NOW() + INTERVAL '7 days', 'Pago inicial (50%) para el proyecto Matoro Bridge Platform', 
          '[{"description":"Pago inicial - Matoro Bridge Platform","quantity":1,"price":1250,"amount":1250}]', 
          'USD', 0, 0
        )
        RETURNING id, invoice_number
      `, [invoicePrefix, clientId, projectId]);
      
      console.log(`Factura inicial creada: ${firstInvoice.rows[0].invoice_number}`);
      
      // Crear segunda factura (50% final)
      console.log('Creando factura final (50%)...');
      const secondInvoice = await pool.query(`
        INSERT INTO invoices (
          invoice_number, client_id, project_id, amount, status, issue_date, 
          due_date, notes, items, currency, tax_rate, discount
        )
        VALUES (
          $1 || '-002', $2, $3, 1250, 'pending', NOW() + INTERVAL '25 days', 
          NOW() + INTERVAL '32 days', 'Pago final (50%) para el proyecto Matoro Bridge Platform', 
          '[{"description":"Pago final - Matoro Bridge Platform","quantity":1,"price":1250,"amount":1250}]', 
          'USD', 0, 0
        )
        RETURNING id, invoice_number
      `, [invoicePrefix, clientId, projectId]);
      
      console.log(`Factura final creada: ${secondInvoice.rows[0].invoice_number}`);
    } else {
      console.log('Ya existen facturas para este proyecto:');
      invoiceResult.rows.forEach(invoice => {
        console.log(`- Factura ${invoice.invoice_number}: $${invoice.amount} (${invoice.status})`);
      });
    }
    
    // 4. Verificar todo lo creado
    console.log('\nResumen del cliente:');
    const clientDetails = await pool.query('SELECT * FROM clients WHERE id = $1', [clientId]);
    console.log(clientDetails.rows[0]);
    
    console.log('\nResumen del proyecto:');
    const projectDetails = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    console.log(projectDetails.rows[0]);
    
    console.log('\nResumen de facturas:');
    const invoiceDetails = await pool.query('SELECT * FROM invoices WHERE project_id = $1', [projectId]);
    invoiceDetails.rows.forEach(invoice => {
      console.log(`- Factura ${invoice.invoice_number}:`);
      console.log(`  Monto: $${invoice.amount}`);
      console.log(`  Estado: ${invoice.status}`);
      console.log(`  Fecha emisión: ${invoice.issue_date}`);
      console.log(`  Fecha vencimiento: ${invoice.due_date}`);
    });
    
    // 5. Verificar el usuario de Maryuri
    const userResult = await pool.query(`
      SELECT * FROM users WHERE username ILIKE '%maryuri%' OR email ILIKE '%maryuri%'
    `);
    
    if (userResult.rows.length === 0) {
      console.log('\nNo se encontró un usuario para Maryuri Alba. Debes crearlo manualmente.');
    } else {
      console.log('\nUsuario de Maryuri encontrado:');
      console.log(`- Username: ${userResult.rows[0].username}`);
      console.log(`- Email: ${userResult.rows[0].email}`);
      console.log(`- Rol: ${userResult.rows[0].role}`);
    }
    
  } catch (error) {
    console.error('Error al crear el proyecto y facturas para Maryuri:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

createMaryuriInvoice().catch(console.error);