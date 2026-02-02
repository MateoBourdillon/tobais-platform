// Script para añadir la columna phone a la tabla de usuarios
const { Pool } = require('pg');

async function addPhoneColumn() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // Añadir la columna phone
    console.log('Añadiendo columna phone a la tabla de usuarios...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS phone VARCHAR(20)
    `);
    
    // Actualizar el teléfono de Diana Castro
    console.log('Actualizando teléfono de Diana Castro...');
    await pool.query(`
      UPDATE users
      SET phone = '980-279-2784'
      WHERE username = 'dimartoro'
    `);
    
    console.log('Columna phone añadida correctamente');
    
    // Verificar la estructura de la tabla
    const tableInfo = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('Estructura actual de la tabla users:');
    tableInfo.rows.forEach(col => {
      console.log(`- ${col.column_name}: ${col.data_type}`);
    });
    
    // Verificar datos de Diana
    const diana = await pool.query(`
      SELECT * FROM users WHERE username = 'dimartoro'
    `);
    
    if (diana.rows.length > 0) {
      console.log('\nDatos de usuario Diana Castro actualizados:');
      console.log('- ID:', diana.rows[0].id);
      console.log('- Username:', diana.rows[0].username);
      console.log('- Email:', diana.rows[0].email);
      console.log('- First Name:', diana.rows[0].first_name);
      console.log('- Last Name:', diana.rows[0].last_name);
      console.log('- Full Name:', diana.rows[0].full_name);
      console.log('- Phone:', diana.rows[0].phone);
      console.log('- Role:', diana.rows[0].role);
    }
    
  } catch (error) {
    console.error('Error al añadir la columna phone:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

addPhoneColumn().catch(console.error);