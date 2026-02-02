// Script para actualizar el esquema de proyectos
const { Pool } = require('pg');

async function updateProjectsSchema() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // Verificar si la columna user_id ya existe en la tabla projects
    const columnExists = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'projects' AND column_name = 'user_id'
      ) as exists
    `);
    
    if (!columnExists.rows[0].exists) {
      console.log('Añadiendo columna user_id a la tabla projects...');
      
      // Añadir la columna user_id a la tabla projects
      await pool.query(`
        ALTER TABLE projects 
        ADD COLUMN user_id INTEGER REFERENCES users(id)
      `);
      
      console.log('Columna user_id añadida correctamente.');
    } else {
      console.log('La columna user_id ya existe en la tabla projects.');
    }
    
    // Actualizar las relaciones existentes
    console.log('Actualizando relaciones entre proyectos y usuarios...');
    
    // Actualizar proyectos con user_id basado en las relaciones en project_users
    const updateResult = await pool.query(`
      UPDATE projects p
      SET user_id = pu.user_id
      FROM project_users pu
      WHERE p.id = pu.project_id AND p.user_id IS NULL
    `);
    
    console.log(`Actualizados ${updateResult.rowCount} proyectos con la relación de usuario.`);
    
    // Verificar si hay proyectos sin user_id
    const orphanProjects = await pool.query(`
      SELECT * FROM projects WHERE user_id IS NULL
    `);
    
    console.log(`Hay ${orphanProjects.rowCount} proyectos sin usuario asignado.`);
    
    // Si hay proyectos sin usuario, podemos asignarlos al cliente si existe
    if (orphanProjects.rowCount > 0) {
      const updateClientProjects = await pool.query(`
        UPDATE projects
        SET user_id = client_id
        WHERE user_id IS NULL AND client_id IS NOT NULL
      `);
      
      console.log(`Asignados ${updateClientProjects.rowCount} proyectos a sus clientes.`);
    }
    
    // Verificar estado final
    const projectsResult = await pool.query(`
      SELECT p.id, p.title, p.client_id, p.user_id, 
             c.username as client_username, 
             u.username as user_username
      FROM projects p
      LEFT JOIN users c ON p.client_id = c.id
      LEFT JOIN users u ON p.user_id = u.id
    `);
    
    console.log('\nEstado final de proyectos:');
    projectsResult.rows.forEach(project => {
      console.log(`- Proyecto: ${project.title} (ID: ${project.id})`);
      console.log(`  Cliente: ${project.client_username || 'Ninguno'} (ID: ${project.client_id || 'Ninguno'})`);
      console.log(`  Usuario: ${project.user_username || 'Ninguno'} (ID: ${project.user_id || 'Ninguno'})`);
    });
    
  } catch (error) {
    console.error('Error en la actualización del esquema:', error);
  } finally {
    // Cerrar la conexión
    await pool.end();
  }
}

updateProjectsSchema().catch(console.error);