// Script para añadir la columna permissions a la tabla de usuarios
const { Pool } = require('pg');

async function addPermissionsColumn() {
  // Conexión a la base de datos usando DATABASE_URL
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('Conectando a la base de datos...');
    
    // Añadir la columna permissions como JSONB para almacenar permisos específicos
    console.log('Añadiendo columna permissions a la tabla de usuarios...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}'::jsonb
    `);
    
    // Actualizar los permisos para Diana Castro (todos los permisos)
    console.log('Actualizando permisos para Diana Castro...');
    const superadminPermissions = JSON.stringify({
      users: {
        create: true,
        read: true,
        update: true,
        delete: true,
        manage_admins: true
      },
      projects: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      invoices: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      clients: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      services: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      blog: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      social_media: {
        create: true,
        read: true,
        update: true,
        delete: true
      },
      settings: {
        update: true
      }
    });
    
    await pool.query(`
      UPDATE users
      SET permissions = $1::jsonb
      WHERE username = 'dimartoro' AND role = 'superadmin'
    `, [superadminPermissions]);
    
    console.log('Columna permissions añadida y configurada correctamente');
    
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
      SELECT id, username, email, first_name, last_name, full_name, phone, role, admin_level, permissions 
      FROM users WHERE username = 'dimartoro'
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
      console.log('- Admin Level:', diana.rows[0].admin_level);
      console.log('- Permissions:', JSON.stringify(diana.rows[0].permissions, null, 2));
    }
    
  } catch (error) {
    console.error('Error al añadir la columna permissions:', error);
  } finally {
    // Cerrar la conexión
    pool.end();
  }
}

addPermissionsColumn().catch(console.error);