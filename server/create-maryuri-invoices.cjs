/**
 * Script para crear facturas para Maryuri Alba - Proyecto Matoro Bridge Platform
 * 
 * Este script se debe ejecutar desde el servidor Express
 */

// Importar dependencias locales
// Usar path completo para el storage
const path = require('path');
const storagePath = path.resolve(__dirname, 'storage.js');
console.log(`Loading storage from: ${storagePath}`);
const { storage } = require(storagePath);

async function createMaryuriInvoices() {
  try {
    console.log("Iniciando creación de facturas para Maryuri Alba...");
    
    // 1. Buscar cliente Maryuri Alba
    const users = await storage.getUsers();
    console.log(`Usuarios encontrados: ${users.length}`);
    users.forEach(u => console.log(`- ID: ${u.id}, Usuario: ${u.username}, Email: ${u.email || 'N/A'}`));
    
    let maryuri = users.find(user => 
      (user.email && user.email.toLowerCase().includes('maryuri')) || 
      (user.firstName && user.firstName.toLowerCase().includes('maryuri'))
    );
    
    if (!maryuri) {
      console.log("No se encontró la cliente Maryuri Alba, creando usuario...");
      const newUser = await storage.createUser({
        username: "maryuri",
        password: "password123", // Temporal
        email: "maryuri@matoro.com",
        firstName: "Maryuri",
        lastName: "Alba",
        role: "user"
      });
      console.log(`Usuario creado con ID: ${newUser.id}`);
      maryuri = newUser;
    } else {
      console.log(`Cliente encontrado con ID: ${maryuri.id}`);
    }
    
    // 2. Buscar o crear el proyecto Matoro Bridge
    const projects = await storage.getProjects();
    console.log(`Proyectos encontrados: ${projects.length}`);
    projects.forEach(p => console.log(`- ID: ${p.id}, Nombre: ${p.name}`));
    
    let matoroProject = projects.find(project => 
      project.name && project.name.includes('Matoro Bridge')
    );
    
    if (!matoroProject) {
      console.log("Proyecto no encontrado. Creando nuevo proyecto...");
      matoroProject = await storage.createProject({
        name: "Matoro Bridge Platform by Matoro Consulting LLC",
        description: "Desarrollo de plataforma web para Matoro Bridge con funcionalidad completa de gestión de usuarios, pagos y reportes",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días después
        budget: 2500.00,
        clientId: maryuri.id
      });
      console.log(`Proyecto creado: ${matoroProject.id} - ${matoroProject.name}`);
    } else {
      console.log(`Proyecto encontrado: ${matoroProject.id} - ${matoroProject.name}`);
      
      // Asegurar que el proyecto esté asignado a Maryuri
      if (matoroProject.clientId !== maryuri.id) {
        console.log("Actualizando proyecto para asignarlo a Maryuri...");
        await storage.updateProject(matoroProject.id, {
          clientId: maryuri.id
        });
        console.log("Proyecto actualizado y asignado a Maryuri");
      }
    }
    
    // 3. Generar números de factura únicos
    console.log("Generando facturas...");
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    let invoiceCount = 1;
    
    // 4. Crear la primera factura (pago inicial - 50%)
    const invoiceNumber1 = `INV-${year}-${month}-${String(invoiceCount++).padStart(4, '0')}`;
    
    const invoice1 = await storage.createInvoice({
      number: invoiceNumber1,
      userId: maryuri.id,
      projectId: matoroProject.id,
      description: "Pago inicial - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      issueDate: new Date(),
      notes: "Pago inicial correspondiente al 50% del presupuesto total del proyecto",
      metadata: JSON.stringify({
        type: "initial_payment",
        percentage: 50,
        projectPhase: "Development Start"
      }),
      items: JSON.stringify([
        { 
          description: "Análisis inicial y diseño - Matoro Bridge Platform", 
          amount: 500.00 
        },
        { 
          description: "Desarrollo front-end inicial - Matoro Bridge Platform", 
          amount: 400.00 
        },
        { 
          description: "Configuración de base de datos - Matoro Bridge Platform", 
          amount: 350.00 
        }
      ])
    });
    
    console.log(`Primera factura creada: ${invoice1.id} - ${invoice1.number}`);
    
    // 5. Crear la segunda factura (pago final - 50%)
    const invoiceNumber2 = `INV-${year}-${month}-${String(invoiceCount++).padStart(4, '0')}`;
    
    const invoice2 = await storage.createInvoice({
      number: invoiceNumber2,
      userId: maryuri.id,
      projectId: matoroProject.id,
      description: "Pago final - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      status: "pending",
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
      issueDate: new Date(),
      notes: "Pago final correspondiente al 50% restante del presupuesto total del proyecto a entregar al completar el desarrollo",
      metadata: JSON.stringify({
        type: "final_payment",
        percentage: 50,
        projectPhase: "Project Completion"
      }),
      items: JSON.stringify([
        { 
          description: "Desarrollo de APIs y backend - Matoro Bridge Platform", 
          amount: 500.00 
        },
        { 
          description: "Finalización de interfaces de usuario - Matoro Bridge Platform", 
          amount: 450.00 
        },
        { 
          description: "Pruebas y despliegue final - Matoro Bridge Platform", 
          amount: 300.00 
        }
      ])
    });
    
    console.log(`Segunda factura creada: ${invoice2.id} - ${invoice2.number}`);
    
    // 6. Retornar información
    return {
      success: true,
      message: "Facturas para Maryuri Alba creadas exitosamente",
      client: {
        id: maryuri.id,
        name: `${maryuri.firstName || ''} ${maryuri.lastName || ''}`.trim(),
        email: maryuri.email
      },
      project: {
        id: matoroProject.id,
        name: matoroProject.name,
        budget: matoroProject.budget
      },
      invoices: [
        {
          id: invoice1.id,
          number: invoice1.number,
          total: invoice1.total,
          status: invoice1.status,
          dueDate: invoice1.dueDate
        },
        {
          id: invoice2.id,
          number: invoice2.number,
          total: invoice2.total,
          status: invoice2.status,
          dueDate: invoice2.dueDate
        }
      ]
    };
  } catch (error) {
    console.error("Error creando facturas para Maryuri Alba:", error);
    throw error;
  }
}

// Exportar la función para su uso
module.exports = {
  createMaryuriInvoices
};