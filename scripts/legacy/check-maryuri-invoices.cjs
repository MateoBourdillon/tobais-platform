// Script para verificar las facturas de Maryuri en la base de datos
require('dotenv').config();
const postgres = require('postgres');

// Conectar a la base de datos
const sql = postgres(process.env.DATABASE_URL);

async function checkMaryuriInvoices() {
  try {
    console.log('Buscando a Maryuri Alba en la base de datos...');
    
    // Buscar usuario por nombre
    const users = await sql`
      SELECT * FROM users 
      WHERE first_name = 'Maryuri' AND last_name = 'Alba'
    `;
    
    if (users.length === 0) {
      console.log('No se encontró a Maryuri Alba en la base de datos');
      return;
    }
    
    const user = users[0];
    console.log(`Usuario encontrado: ID=${user.id}, Nombre=${user.first_name} ${user.last_name}, Email=${user.email}`);
    
    // Buscar proyectos asociados al usuario
    console.log(`\nBuscando proyectos para el usuario ID=${user.id}...`);
    const projects = await sql`
      SELECT p.* 
      FROM projects p
      LEFT JOIN project_users pu ON p.id = pu.project_id
      WHERE p.client_id = ${user.id} OR pu.user_id = ${user.id} OR p.user_id = ${user.id}
    `;
    
    if (projects.length === 0) {
      console.log('No se encontraron proyectos para este usuario');
    } else {
      console.log(`Se encontraron ${projects.length} proyectos:`);
      projects.forEach(project => {
        console.log(`- ID=${project.id}, Nombre="${project.name}", Estado=${project.status}`);
      });
    }
    
    // Buscar facturas directamente asociadas al usuario
    console.log(`\nBuscando facturas directamente asociadas al usuario ID=${user.id}...`);
    const directInvoices = await sql`
      SELECT * FROM invoices WHERE user_id = ${user.id}
    `;
    
    if (directInvoices.length === 0) {
      console.log('No se encontraron facturas directamente asociadas a este usuario');
    } else {
      console.log(`Se encontraron ${directInvoices.length} facturas directas:`);
      directInvoices.forEach(invoice => {
        console.log(`- ID=${invoice.id}, Número=${invoice.number}, Total=${invoice.total}, Estado=${invoice.status}`);
      });
    }
    
    // Buscar facturas asociadas a proyectos del usuario
    console.log(`\nBuscando facturas asociadas a proyectos del usuario...`);
    const projectIds = projects.map(p => p.id);
    
    if (projectIds.length === 0) {
      console.log('No hay proyectos para buscar facturas');
    } else {
      const projectInvoices = await sql`
        SELECT i.* 
        FROM invoices i
        WHERE i.project_id IN ${sql(projectIds)}
      `;
      
      if (projectInvoices.length === 0) {
        console.log('No se encontraron facturas asociadas a los proyectos del usuario');
      } else {
        console.log(`Se encontraron ${projectInvoices.length} facturas de proyectos:`);
        projectInvoices.forEach(invoice => {
          console.log(`- ID=${invoice.id}, Número=${invoice.number}, Total=${invoice.total}, Estado=${invoice.status}, ProjectID=${invoice.project_id}`);
        });
      }
    }
    
    // Probar la consulta SQL combinada que usamos en getInvoices
    console.log('\nProbando consulta SQL combinada de getInvoices...');
    const allInvoices = await sql`
      SELECT i.* 
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      LEFT JOIN project_users pu ON p.id = pu.project_id
      WHERE i.user_id = ${user.id} OR pu.user_id = ${user.id} OR p.client_id = ${user.id} OR p.user_id = ${user.id}
      ORDER BY i.created_at DESC
    `;
    
    if (allInvoices.length === 0) {
      console.log('No se encontraron facturas con la consulta combinada');
    } else {
      console.log(`La consulta combinada encontró ${allInvoices.length} facturas:`);
      allInvoices.forEach(invoice => {
        console.log(`- ID=${invoice.id}, Número=${invoice.number}, Total=${invoice.total}, Estado=${invoice.status}, ProjectID=${invoice.project_id || 'N/A'}, UserID=${invoice.user_id}`);
      });
    }
    
  } catch (error) {
    console.error('Error al verificar facturas:', error);
  } finally {
    await sql.end();
  }
}

checkMaryuriInvoices();