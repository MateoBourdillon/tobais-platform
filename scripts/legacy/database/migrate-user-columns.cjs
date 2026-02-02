// Script para modificar la estructura de la tabla de usuarios
const { Pool } = require('pg');

async function migrateUserTable() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // Iniciar transacción
    await pool.query('BEGIN');
    
    console.log('Añadiendo columnas first_name y last_name...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255)
    `);
    
    console.log('Migración de datos desde full_name a first_name y last_name...');
    // Obtener todos los usuarios
    const users = await pool.query('SELECT id, full_name FROM users');
    
    // Actualizar cada usuario dividiendo el full_name
    for (const user of users.rows) {
      if (user.full_name) {
        const nameParts = user.full_name.split(' ');
        let firstName = nameParts[0] || '';
        let lastName = nameParts.slice(1).join(' ') || '';
        
        await pool.query(
          'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
          [firstName, lastName, user.id]
        );
      }
    }
    
    // Para Diana Castro específicamente
    await pool.query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE username = $3',
      ['Diana', 'Castro', 'dimartoro']
    );
    
    // Commit de la transacción
    await pool.query('COMMIT');
    
    console.log('Migración completada con éxito.');
    console.log('NOTA: La columna full_name se mantiene por compatibilidad, pero ahora first_name y last_name son las columnas principales.');
    
    // Verificar la actualización de Diana
    const dianaUser = await pool.query('SELECT * FROM users WHERE username = $1', ['dimartoro']);
    if (dianaUser.rows.length > 0) {
      console.log('Datos de Diana Castro actualizados:');
      console.log('- first_name:', dianaUser.rows[0].first_name);
      console.log('- last_name:', dianaUser.rows[0].last_name);
      console.log('- full_name (mantenido):', dianaUser.rows[0].full_name);
    }
    
  } catch (error) {
    // Rollback en caso de error
    await pool.query('ROLLBACK');
    console.error('Error en la migración:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

migrateUserTable().catch(console.error);