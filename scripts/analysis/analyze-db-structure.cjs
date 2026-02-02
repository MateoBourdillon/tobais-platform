// Script para analizar la estructura de la base de datos
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function analyzeDbStructure() {
  try {
    console.log('=== ANÁLISIS DE LA ESTRUCTURA DE LA BASE DE DATOS ===\n');
    
    // 1. Listar todas las tablas
    console.log('TABLAS EXISTENTES:');
    const tablesQuery = await pool.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    for (const row of tablesQuery.rows) {
      console.log(`- ${row.tablename}`);
    }
    console.log();
    
    // 2. Analizar estructura de tablas clave
    const keyTables = ['users', 'projects', 'project_users', 'invoices', 'orders'];
    
    for (const tableName of keyTables) {
      try {
        // Verificar si la tabla existe
        const tableExists = await pool.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = $1
          ) AS exists
        `, [tableName]);
        
        if (!tableExists.rows[0].exists) {
          console.log(`TABLA ${tableName.toUpperCase()}: No existe`);
          continue;
        }
        
        // Obtener estructura de columnas
        console.log(`ESTRUCTURA DE TABLA ${tableName.toUpperCase()}:`);
        const columnsQuery = await pool.query(`
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns
          WHERE table_name = $1
          ORDER BY ordinal_position
        `, [tableName]);
        
        for (const column of columnsQuery.rows) {
          console.log(`- ${column.column_name}: ${column.data_type} ${column.is_nullable === 'YES' ? '(nullable)' : '(not null)'} ${column.column_default ? `Default: ${column.column_default}` : ''}`);
        }
        
        // Obtener restricciones
        console.log(`\nRESTRICCIONES DE ${tableName.toUpperCase()}:`);
        const constraintsQuery = await pool.query(`
          SELECT con.conname AS constraint_name,
                 con.contype AS constraint_type,
                 CASE 
                    WHEN con.contype = 'p' THEN 'PRIMARY KEY'
                    WHEN con.contype = 'f' THEN 'FOREIGN KEY'
                    WHEN con.contype = 'u' THEN 'UNIQUE'
                    WHEN con.contype = 'c' THEN 'CHECK'
                    WHEN con.contype = 't' THEN 'TRIGGER'
                    WHEN con.contype = 'x' THEN 'EXCLUSION'
                    ELSE con.contype::text
                 END AS constraint_type_desc,
                 pg_get_constraintdef(con.oid) AS constraint_definition
          FROM pg_constraint con
          JOIN pg_class rel ON rel.oid = con.conrelid
          JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
          WHERE rel.relname = $1
          ORDER BY con.contype, con.conname
        `, [tableName]);
        
        if (constraintsQuery.rows.length === 0) {
          console.log('  No se encontraron restricciones');
        } else {
          for (const constraint of constraintsQuery.rows) {
            console.log(`- ${constraint.constraint_name} (${constraint.constraint_type_desc}): ${constraint.constraint_definition}`);
          }
        }
        
        // Contar registros
        const countQuery = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
        console.log(`\nTOTAL DE REGISTROS EN ${tableName.toUpperCase()}: ${countQuery.rows[0].count}`);
        
        // Mostrar algunos datos de ejemplo
        console.log(`\nDATOS DE EJEMPLO EN ${tableName.toUpperCase()}:`);
        const dataQuery = await pool.query(`SELECT * FROM ${tableName} LIMIT 5`);
        
        if (dataQuery.rows.length === 0) {
          console.log('  No hay datos disponibles');
        } else {
          for (const row of dataQuery.rows) {
            console.log(row);
          }
        }
        
        console.log('\n' + '-'.repeat(80) + '\n');
      } catch (error) {
        console.error(`Error analizando la tabla ${tableName}:`, error.message);
      }
    }
    
    // 3. Análisis específico de relaciones usuario-proyecto
    try {
      console.log('ANÁLISIS DE RELACIONES USUARIO-PROYECTO:');
      
      // Verificar si existen ambas tablas
      const projectsExist = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'projects'
        ) AS exists
      `);
      
      const projectUsersExist = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'project_users'
        ) AS exists
      `);
      
      if (projectsExist.rows[0].exists && projectUsersExist.rows[0].exists) {
        // Identificar relaciones inconsistentes
        const relationQuery = await pool.query(`
          SELECT 
            p.id AS project_id, 
            p.title AS project_title,
            p.client_id,
            u_client.username AS client_username,
            CASE WHEN pu.project_id IS NOT NULL THEN 'Sí' ELSE 'No' END AS tiene_relacion_project_users
          FROM projects p
          LEFT JOIN users u_client ON p.client_id = u_client.id
          LEFT JOIN project_users pu ON p.id = pu.project_id
          GROUP BY p.id, p.title, p.client_id, u_client.username, tiene_relacion_project_users
          ORDER BY p.id
        `);
        
        if (relationQuery.rows.length === 0) {
          console.log('  No hay proyectos en la base de datos');
        } else {
          console.log('  Análisis de proyectos y sus relaciones:');
          for (const row of relationQuery.rows) {
            console.log(`  - Proyecto ID ${row.project_id}: ${row.project_title}`);
            console.log(`    Cliente ID: ${row.client_id || 'No asignado'} (${row.client_username || 'N/A'})`);
            console.log(`    Tiene relaciones en project_users: ${row.tiene_relacion_project_users}`);
          }
        }
        
        // Verificar detalle de relaciones en project_users
        const projectUserDetailsQuery = await pool.query(`
          SELECT 
            pu.project_id,
            p.title AS project_title,
            pu.user_id,
            u.username,
            pu.role
          FROM project_users pu
          JOIN projects p ON pu.project_id = p.id
          JOIN users u ON pu.user_id = u.id
          ORDER BY pu.project_id, pu.user_id
        `);
        
        if (projectUserDetailsQuery.rows.length === 0) {
          console.log('\n  No hay relaciones en project_users');
        } else {
          console.log('\n  Detalle de relaciones en project_users:');
          for (const row of projectUserDetailsQuery.rows) {
            console.log(`  - Proyecto: ${row.project_title} (ID: ${row.project_id})`);
            console.log(`    Usuario: ${row.username} (ID: ${row.user_id}), Rol: ${row.role}`);
          }
        }
      } else {
        console.log('  Faltan tablas necesarias para este análisis');
      }
    } catch (error) {
      console.error('Error analizando relaciones usuario-proyecto:', error.message);
    }
    
    // 4. Análisis específico de facturas
    try {
      console.log('\nANÁLISIS DE FACTURAS:');
      
      const invoicesExist = await pool.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'invoices'
        ) AS exists
      `);
      
      if (invoicesExist.rows[0].exists) {
        // Analizar facturas por usuario
        const invoicesByUserQuery = await pool.query(`
          SELECT 
            u.id AS user_id,
            u.username,
            u.email,
            COUNT(i.id) AS total_invoices,
            SUM(CASE WHEN i.status = 'pending' THEN 1 ELSE 0 END) AS pending_invoices,
            SUM(CASE WHEN i.status = 'paid' THEN 1 ELSE 0 END) AS paid_invoices
          FROM users u
          LEFT JOIN invoices i ON u.id = i.user_id
          GROUP BY u.id, u.username, u.email
          ORDER BY total_invoices DESC
        `);
        
        console.log('  Facturas por usuario:');
        for (const row of invoicesByUserQuery.rows) {
          if (row.total_invoices > 0) {
            console.log(`  - ${row.username} (${row.email}): ${row.total_invoices} facturas (${row.pending_invoices} pendientes, ${row.paid_invoices} pagadas)`);
          }
        }
        
        // Analizar facturas con problemas de montos
        const invalidAmountQuery = await pool.query(`
          SELECT 
            id, 
            number, 
            user_id, 
            amount, 
            total,
            status
          FROM invoices
          WHERE amount < 100 OR total < 100
          ORDER BY id
        `);
        
        if (invalidAmountQuery.rows.length > 0) {
          console.log('\n  Facturas con posibles problemas de montos (menos de $1):');
          for (const row of invalidAmountQuery.rows) {
            console.log(`  - Factura ${row.number} (ID: ${row.id}): Amount=$${row.amount/100}, Total=$${row.total/100}, Estado=${row.status}`);
          }
        } else {
          console.log('\n  No se encontraron facturas con montos sospechosamente bajos');
        }
        
        // Analizar facturas sin proyecto asociado
        const noProjectQuery = await pool.query(`
          SELECT 
            i.id, 
            i.number, 
            i.user_id,
            u.username,
            i.total,
            i.status,
            i.issue_date
          FROM invoices i
          JOIN users u ON i.user_id = u.id
          WHERE i.project_id IS NULL
          ORDER BY i.id
        `);
        
        if (noProjectQuery.rows.length > 0) {
          console.log('\n  Facturas sin proyecto asociado:');
          for (const row of noProjectQuery.rows) {
            console.log(`  - Factura ${row.number} (ID: ${row.id}): Usuario=${row.username}, Total=$${row.total/100}, Estado=${row.status}`);
          }
        } else {
          console.log('\n  Todas las facturas tienen un proyecto asociado');
        }
      } else {
        console.log('  La tabla de facturas no existe');
      }
    } catch (error) {
      console.error('Error analizando facturas:', error.message);
    }
    
  } catch (error) {
    console.error('Error general en el análisis:', error);
  } finally {
    await pool.end();
  }
}

analyzeDbStructure().catch(console.error);