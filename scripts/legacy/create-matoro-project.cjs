// Script para crear el proyecto Matoro Bridge Platform para Maryuri
require('dotenv').config();
const postgres = require('postgres');

// Conectar a la base de datos
const sql = postgres(process.env.DATABASE_URL);

async function createMatoroProject() {
  try {
    console.log('Iniciando creación del proyecto Matoro Bridge Platform...');
    
    // Buscar usuario Maryuri
    const maryuri = await sql`
      SELECT * FROM users 
      WHERE first_name = 'Maryuri' AND last_name = 'Alba'
    `;
    
    if (maryuri.length === 0) {
      console.error('No se encontró a Maryuri Alba en la base de datos');
      return;
    }
    
    const userId = maryuri[0].id;
    console.log(`Usuario encontrado: ID=${userId}, Nombre=${maryuri[0].first_name} ${maryuri[0].last_name}`);
    
    // Verificar si el proyecto ya existe
    const existingProject = await sql`
      SELECT * FROM projects WHERE name = 'Matoro Bridge Platform by Matoro Consulting LLC'
    `;
    
    if (existingProject.length > 0) {
      console.log(`El proyecto ya existe con ID=${existingProject[0].id}`);
      
      // Asegurarnos que esté asignado a Maryuri
      const existingAssignment = await sql`
        SELECT * FROM project_users 
        WHERE project_id = ${existingProject[0].id} AND user_id = ${userId}
      `;
      
      if (existingAssignment.length === 0) {
        console.log('Asignando proyecto existente a Maryuri...');
        await sql`
          INSERT INTO project_users (project_id, user_id, role)
          VALUES (${existingProject[0].id}, ${userId}, 'client')
        `;
        console.log('Proyecto asignado correctamente');
      } else {
        console.log('El proyecto ya está asignado a Maryuri');
      }
      
      return existingProject[0];
    }
    
    // Crear el proyecto
    console.log('Creando nuevo proyecto Matoro Bridge Platform...');
    const now = new Date();
    const projectData = {
      name: 'Matoro Bridge Platform by Matoro Consulting LLC',
      description: 'Web platform for Matoro Consulting LLC to connect with clients and manage bridge projects',
      status: 'active',
      start_date: now,
      end_date: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000), // 60 días después
      client_id: userId,
      total_budget: 2500,
      created_at: now,
      updated_at: now
    };
    
    const [newProject] = await sql`
      INSERT INTO projects ${sql(projectData)}
      RETURNING *
    `;
    
    console.log(`Proyecto creado exitosamente con ID=${newProject.id}`);
    
    // Agregar al usuario como cliente del proyecto
    console.log('Asignando proyecto a Maryuri como cliente...');
    await sql`
      INSERT INTO project_users (project_id, user_id, role)
      VALUES (${newProject.id}, ${userId}, 'client')
    `;
    
    console.log('Relación proyecto-usuario creada correctamente');
    
    // Agregar hitos al proyecto
    console.log('Creando hitos del proyecto...');
    const milestones = [
      {
        project_id: newProject.id,
        title: 'Project Kickoff and Requirements Gathering',
        title_es: 'Inicio del Proyecto y Recopilación de Requisitos',
        description: 'Initial meeting and detailed requirements documentation',
        description_es: 'Reunión inicial y documentación detallada de requisitos',
        due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 días después
        status: 'completed',
        completed_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 días antes (ya completado)
        sort_order: 1,
        created_at: now,
        updated_at: now
      },
      {
        project_id: newProject.id,
        title: 'Design and Prototyping',
        title_es: 'Diseño y Prototipado',
        description: 'UI/UX design and interactive prototype development',
        description_es: 'Diseño de UI/UX y desarrollo de prototipo interactivo',
        due_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000), // 21 días después
        status: 'in_progress',
        completed_at: null,
        sort_order: 2,
        created_at: now,
        updated_at: now
      },
      {
        project_id: newProject.id,
        title: 'Development Phase',
        title_es: 'Fase de Desarrollo',
        description: 'Frontend and backend implementation of the platform',
        description_es: 'Implementación frontend y backend de la plataforma',
        due_date: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000), // 45 días después
        status: 'pending',
        completed_at: null,
        sort_order: 3,
        created_at: now,
        updated_at: now
      },
      {
        project_id: newProject.id,
        title: 'Testing and Deployment',
        title_es: 'Pruebas y Despliegue',
        description: 'Quality assurance, bug fixing and production deployment',
        description_es: 'Control de calidad, corrección de errores y despliegue en producción',
        due_date: new Date(now.getTime() + 55 * 24 * 60 * 60 * 1000), // 55 días después
        status: 'pending',
        completed_at: null,
        sort_order: 4,
        created_at: now,
        updated_at: now
      }
    ];
    
    for (const milestone of milestones) {
      await sql`INSERT INTO project_milestones ${sql(milestone)}`;
    }
    
    console.log(`Creados ${milestones.length} hitos para el proyecto`);
    
    // Crear las facturas del proyecto
    console.log('Creando facturas para el proyecto...');
    
    // Factura de pago inicial (50%)
    const invoiceDate = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000); // 5 días antes
    const dueDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000); // 10 días después
    
    const initialInvoice = {
      user_id: userId,
      project_id: newProject.id,
      number: `INV-${new Date().getFullYear()}-05-0001`,
      status: 'pending',
      issue_date: invoiceDate,
      due_date: dueDate,
      amount: 1250 * 100, // en centavos (50% del total)
      tax: 0,
      discount: 0,
      total: 1250 * 100, // en centavos
      notes: 'Initial payment (50%) for Matoro Bridge Platform development',
      description: 'Matoro Bridge Platform - Initial Payment',
      items: JSON.stringify([{
        description: 'Web Platform Development - Initial Payment (50%)',
        quantity: 1,
        price: 1250 * 100,
        amount: 1250 * 100
      }]),
      created_at: invoiceDate,
      updated_at: invoiceDate
    };
    
    const [initialInvoiceResult] = await sql`
      INSERT INTO invoices ${sql(initialInvoice)}
      RETURNING *
    `;
    
    console.log(`Factura inicial creada con ID=${initialInvoiceResult.id}, Número=${initialInvoiceResult.number}`);
    
    // Factura de pago final (50%) - Esta se emitirá cuando se complete el proyecto
    const finalInvoice = {
      user_id: userId,
      project_id: newProject.id,
      number: `INV-${new Date().getFullYear()}-05-0002`,
      status: 'pending',
      issue_date: new Date(now.getTime() + 50 * 24 * 60 * 60 * 1000), // Se emitirá en 50 días
      due_date: new Date(now.getTime() + 64 * 24 * 60 * 60 * 1000), // Vence 14 días después de emitida
      amount: 1250 * 100, // en centavos (50% restante)
      tax: 0,
      discount: 0,
      total: 1250 * 100, // en centavos
      notes: 'Final payment (50%) for Matoro Bridge Platform development',
      description: 'Matoro Bridge Platform - Final Payment',
      items: JSON.stringify([{
        description: 'Web Platform Development - Final Payment (50%)',
        quantity: 1,
        price: 1250 * 100,
        amount: 1250 * 100
      }]),
      created_at: now,
      updated_at: now
    };
    
    const [finalInvoiceResult] = await sql`
      INSERT INTO invoices ${sql(finalInvoice)}
      RETURNING *
    `;
    
    console.log(`Factura final creada con ID=${finalInvoiceResult.id}, Número=${finalInvoiceResult.number}`);
    
    return newProject;
    
  } catch (error) {
    console.error('Error creando el proyecto:', error);
  } finally {
    await sql.end();
  }
}

createMatoroProject();