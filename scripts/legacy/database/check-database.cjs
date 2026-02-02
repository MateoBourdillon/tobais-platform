// Script para comprobar todos los datos relevantes en la base de datos
require('dotenv').config();
const postgres = require('postgres');

// Conectar a la base de datos
const sql = postgres(process.env.DATABASE_URL);

async function checkDatabase() {
  try {
    console.log('=== VERIFICANDO BASE DE DATOS ===');
    
    // 1. Verificar usuarios
    console.log('\n--- USUARIOS ---');
    const users = await sql`SELECT id, username, email, first_name, last_name, role FROM users ORDER BY id`;
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}, Nombre: ${user.first_name} ${user.last_name}, Role: ${user.role || 'user'}`);
    });
    
    // 2. Verificar proyectos
    console.log('\n--- PROYECTOS ---');
    const projects = await sql`SELECT id, title, client_id, status FROM projects ORDER BY id`;
    projects.forEach(project => {
      console.log(`ID: ${project.id}, Título: ${project.title}, ClientID: ${project.client_id}, Estado: ${project.status}`);
    });
    
    // 3. Verificar relaciones project_users
    console.log('\n--- RELACIONES PROJECT_USERS ---');
    const projectUsers = await sql`
      SELECT pu.*, u.username, p.title as project_title
      FROM project_users pu
      JOIN users u ON pu.user_id = u.id
      JOIN projects p ON pu.project_id = p.id
      ORDER BY pu.project_id, pu.user_id
    `;
    projectUsers.forEach(pu => {
      console.log(`ProjectID: ${pu.project_id} (${pu.project_title}), UserID: ${pu.user_id} (${pu.username}), Role: ${pu.role}`);
    });
    
    // 4. Verificar facturas
    console.log('\n--- FACTURAS ---');
    const invoices = await sql`
      SELECT i.*, u.username, p.title as project_title
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.id
    `;
    invoices.forEach(invoice => {
      console.log(`ID: ${invoice.id}, Número: ${invoice.number}, Usuario: ${invoice.username}, Proyecto: ${invoice.project_title || 'N/A'}, Total: $${invoice.total/100}, Estado: ${invoice.status}`);
    });
    
    // 5. Verificar la contraseña de Maryuri específicamente
    console.log('\n--- VERIFICACIÓN DE CREDENCIALES DE MARYURI ---');
    const maryuri = await sql`SELECT id, username, email, password FROM users WHERE first_name = 'Maryuri' AND last_name = 'Alba'`;
    if (maryuri.length > 0) {
      const user = maryuri[0];
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      console.log(`Password hash (primeros 20 caracteres): ${user.password.substring(0, 20)}...`);
    } else {
      console.log('Usuario Maryuri Alba no encontrado');
    }
    
  } catch (error) {
    console.error('Error verificando la base de datos:', error);
  } finally {
    await sql.end();
  }
}

checkDatabase();