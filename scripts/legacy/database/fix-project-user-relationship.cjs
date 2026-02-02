// Script para corregir la relación entre proyectos y usuarios
const { Pool } = require('pg');

async function fixProjectUserRelationship() {
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
    
    // 3. Verificar si existe la tabla de relación project_users
    const checkTableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'project_users'
      ) AS exists
    `);
    
    // Si no existe la tabla project_users, crearla
    if (!checkTableResult.rows[0].exists) {
      console.log('Creando tabla project_users...');
      await pool.query(`
        CREATE TABLE project_users (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL REFERENCES projects(id),
          user_id INTEGER NOT NULL REFERENCES users(id),
          role TEXT DEFAULT 'member',
          created_at TIMESTAMP DEFAULT NOW(),
          UNIQUE(project_id, user_id)
        )
      `);
      console.log('Tabla project_users creada.');
    } else {
      console.log('La tabla project_users ya existe.');
    }
    
    // 4. Asociar usuario con proyecto
    console.log('Asociando usuario con proyecto...');
    try {
      await pool.query(`
        INSERT INTO project_users (project_id, user_id, role)
        VALUES ($1, $2, 'owner')
        ON CONFLICT (project_id, user_id) DO NOTHING
      `, [projectId, userId]);
      console.log('Usuario asociado con proyecto correctamente.');
    } catch (error) {
      console.log('Error al insertar en la tabla project_users:', error.message);
      
      // Si el error es debido a la falta de la restricción única, modificar la tabla
      if (error.message.includes('project_users_project_id_user_id_key')) {
        await pool.query(`
          ALTER TABLE project_users 
          ADD CONSTRAINT project_users_project_id_user_id_key 
          UNIQUE (project_id, user_id)
        `);
        
        // Intentar insertar nuevamente
        await pool.query(`
          INSERT INTO project_users (project_id, user_id, role)
          VALUES ($1, $2, 'owner')
          ON CONFLICT (project_id, user_id) DO NOTHING
        `, [projectId, userId]);
        console.log('Usuario asociado con proyecto correctamente después de corregir la tabla.');
      }
    }
    
    // 5. Si no existe la relación directa en projects, actualizar el campo user_id
    console.log('Verificando si existe el campo user_id en la tabla projects...');
    try {
      const columnResult = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'projects' AND column_name = 'user_id'
        ) AS exists
      `);
      
      if (columnResult.rows[0].exists) {
        console.log('Actualizando el campo user_id en la tabla projects...');
        await pool.query(`
          UPDATE projects
          SET user_id = $1
          WHERE id = $2
        `, [userId, projectId]);
        console.log('Campo user_id actualizado correctamente.');
      } else {
        console.log('Agregando el campo user_id a la tabla projects...');
        await pool.query(`
          ALTER TABLE projects
          ADD COLUMN user_id INTEGER REFERENCES users(id)
        `);
        
        console.log('Actualizando el nuevo campo user_id...');
        await pool.query(`
          UPDATE projects
          SET user_id = $1
          WHERE id = $2
        `, [userId, projectId]);
        console.log('Campo user_id agregado y actualizado correctamente.');
      }
    } catch (error) {
      console.log('Error al actualizar la tabla projects:', error.message);
    }
    
    // 6. Verificar si la relación se estableció correctamente
    const projectUserResult = await pool.query(`
      SELECT p.* 
      FROM projects p
      LEFT JOIN project_users pu ON p.id = pu.project_id
      WHERE pu.user_id = $1 OR p.user_id = $1 OR p.client_id = $1
    `, [userId]);
    
    console.log(`\nProyectos asociados al usuario (${projectUserResult.rows.length}):`);
    projectUserResult.rows.forEach(project => {
      console.log(`- ${project.title} (ID: ${project.id})`);
    });
    
    // 7. Verificar facturas asociadas al usuario
    const invoiceResult = await pool.query(`
      SELECT i.* 
      FROM invoices i
      WHERE i.user_id = $1
    `, [userId]);
    
    console.log(`\nFacturas asociadas al usuario (${invoiceResult.rows.length}):`);
    invoiceResult.rows.forEach(invoice => {
      console.log(`- Factura ${invoice.number}: $${invoice.total} (${invoice.status})`);
    });
    
  } catch (error) {
    console.error('Error al corregir las relaciones:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

fixProjectUserRelationship().catch(console.error);