// Script para conectar a Maryuri con el proyecto Matoro Bridge y crear facturas
require('dotenv').config();
const postgres = require('postgres');

// Conectar a la base de datos
const sql = postgres(process.env.DATABASE_URL);

async function linkMaryuriToMatoroBridge() {
  try {
    console.log('Iniciando conexión de Maryuri Alba con proyecto Matoro Bridge...');
    
    // Buscar a Maryuri Alba
    const [maryuri] = await sql`
      SELECT * FROM users 
      WHERE first_name = 'Maryuri' AND last_name = 'Alba'
    `;
    
    if (!maryuri) {
      console.error('No se encontró a Maryuri Alba en la base de datos');
      return;
    }
    
    console.log(`Usuario encontrado: ID=${maryuri.id}, Nombre=${maryuri.first_name} ${maryuri.last_name}, Email=${maryuri.email}`);
    
    // Buscar el proyecto Matoro Bridge
    const [project] = await sql`
      SELECT * FROM projects WHERE title = 'Matoro Bridge Platform by Matoro Consulting LLC'
    `;
    
    if (!project) {
      console.error('No se encontró el proyecto Matoro Bridge Platform');
      return;
    }
    
    console.log(`Proyecto encontrado: ID=${project.id}, Título=${project.title}`);
    
    // 1. Actualizar el client_id del proyecto para que apunte a Maryuri
    await sql`
      UPDATE projects
      SET client_id = ${maryuri.id}
      WHERE id = ${project.id}
    `;
    
    console.log(`Proyecto actualizado: client_id ahora es ${maryuri.id}`);
    
    // 2. Verificar si ya existe una relación project_users
    const [existingRelation] = await sql`
      SELECT * FROM project_users
      WHERE project_id = ${project.id} AND user_id = ${maryuri.id}
    `;
    
    if (existingRelation) {
      console.log('La relación proyecto-usuario ya existe');
    } else {
      // 3. Crear relación en project_users
      await sql`
        INSERT INTO project_users (project_id, user_id, role, created_at)
        VALUES (${project.id}, ${maryuri.id}, 'client', NOW())
      `;
      
      console.log('Relación proyecto-usuario creada correctamente');
    }
    
    // 4. Verificar si ya existen facturas para este proyecto
    const existingInvoices = await sql`
      SELECT * FROM invoices
      WHERE project_id = ${project.id}
    `;
    
    if (existingInvoices.length > 0) {
      console.log(`Ya existen ${existingInvoices.length} facturas para este proyecto`);
      
      // Actualizar las facturas para que apunten a Maryuri si es necesario
      if (existingInvoices.some(inv => inv.user_id !== maryuri.id)) {
        await sql`
          UPDATE invoices
          SET user_id = ${maryuri.id}
          WHERE project_id = ${project.id}
        `;
        
        console.log('Facturas actualizadas para asignarlas a Maryuri');
      }
    } else {
      // 5. Crear las facturas para el proyecto
      console.log('Creando facturas para el proyecto...');
      
      const now = new Date();
      const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 días después
      
      // Factura de pago inicial (50%)
      const initialInvoice = {
        user_id: maryuri.id,
        project_id: project.id,
        number: `INV-2025-05-0001`,
        status: 'pending',
        issue_date: now,
        due_date: dueDate,
        amount: 1250 * 100, // en centavos (50% del total)
        tax: 0,
        discount: 0,
        total: 1250 * 100, // en centavos
        description: 'Matoro Bridge Platform - Initial Payment',
        notes: 'Initial payment (50%) for Matoro Bridge Platform development',
        items: JSON.stringify([{
          description: 'Web Platform Development - Initial Payment (50%)',
          quantity: 1,
          price: 1250 * 100,
          amount: 1250 * 100
        }]),
        metadata: JSON.stringify({
          project_name: project.title,
          payment_number: 1,
          total_payments: 2
        }),
        created_at: now,
        updated_at: now
      };
      
      const [initialInvoiceResult] = await sql`
        INSERT INTO invoices ${sql(initialInvoice)}
        RETURNING *
      `;
      
      console.log(`Factura inicial creada con ID=${initialInvoiceResult.id}, Número=${initialInvoiceResult.number}`);
      
      // Factura de pago final (50%) - Esta se emitirá cuando se complete el proyecto
      const finalDueDate = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 60 días después
      const finalInvoice = {
        user_id: maryuri.id,
        project_id: project.id,
        number: `INV-2025-05-0002`,
        status: 'pending',
        issue_date: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000), // Se emitirá en 50 días
        due_date: finalDueDate,
        amount: 1250 * 100, // en centavos (50% restante)
        tax: 0,
        discount: 0,
        total: 1250 * 100, // en centavos
        description: 'Matoro Bridge Platform - Final Payment',
        notes: 'Final payment (50%) for Matoro Bridge Platform development',
        items: JSON.stringify([{
          description: 'Web Platform Development - Final Payment (50%)',
          quantity: 1,
          price: 1250 * 100,
          amount: 1250 * 100
        }]),
        metadata: JSON.stringify({
          project_name: project.title,
          payment_number: 2,
          total_payments: 2
        }),
        created_at: now,
        updated_at: now
      };
      
      const [finalInvoiceResult] = await sql`
        INSERT INTO invoices ${sql(finalInvoice)}
        RETURNING *
      `;
      
      console.log(`Factura final creada con ID=${finalInvoiceResult.id}, Número=${finalInvoiceResult.number}`);
    }
    
    console.log('Proceso completado con éxito. Maryuri ahora está correctamente vinculada al proyecto Matoro Bridge Platform');
    
  } catch (error) {
    console.error('Error en el proceso:', error);
  } finally {
    await sql.end();
  }
}

linkMaryuriToMatoroBridge();