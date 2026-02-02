/**
 * Script para crear facturas reales para Maryuri Alba
 * Versión CommonJS (.cjs) para compatibilidad
 */

const { storage } = require('./storage');

/**
 * Genera un número de factura único basado en el año, mes y conteo actual
 */
async function generateInvoiceNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const invoices = await storage.getInvoices();
  return `INV-${year}-${month}-${String(invoices.length + 1).padStart(4, '0')}`;
}

/**
 * Encuentra un cliente por nombre, email o ID
 */
async function findClient(identifier) {
  const users = await storage.getUsers();
  
  if (typeof identifier === 'number') {
    return users.find(user => user.id === identifier) || null;
  }
  
  const normalizedIdentifier = identifier.toLowerCase();
  return users.find(user => 
    (user.email && user.email.toLowerCase().includes(normalizedIdentifier)) || 
    (user.firstName && user.firstName.toLowerCase().includes(normalizedIdentifier)) ||
    (user.lastName && user.lastName.toLowerCase().includes(normalizedIdentifier)) ||
    (user.username && user.username.toLowerCase().includes(normalizedIdentifier))
  ) || null;
}

/**
 * Encuentra un proyecto por nombre o ID, o lo crea si no existe
 */
async function findOrCreateProject(projectName, clientId, projectDetails = {}) {
  const projects = await storage.getProjects();
  
  // Buscar proyecto existente
  let project = projects.find(p => 
    p.name && p.name.toLowerCase().includes(projectName.toLowerCase()) &&
    p.clientId === clientId
  );
  
  // Si el proyecto existe pero con otro nombre, actualizarlo
  if (project && project.name !== projectName) {
    project = await storage.updateProject(project.id, { name: projectName });
    console.log(`Proyecto actualizado con nombre correcto: ${projectName}`);
  }
  
  // Si no existe, crearlo
  if (!project) {
    console.log(`Creando nuevo proyecto: ${projectName} para cliente ID ${clientId}`);
    
    project = await storage.createProject({
      name: projectName,
      description: projectDetails.description || `Proyecto ${projectName}`,
      status: projectDetails.status || 'active',
      startDate: projectDetails.startDate || new Date(),
      endDate: projectDetails.endDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días
      budget: projectDetails.budget || 0,
      clientId: clientId
    });
  }
  
  return project;
}

/**
 * Crea una factura para un cliente existente
 */
async function createClientInvoice(clientId, projectId, invoiceData = {}) {
  try {
    // Generar número de factura único
    const invoiceNumber = await generateInvoiceNumber();
    
    // Crear la factura
    const invoice = await storage.createInvoice({
      number: invoiceNumber,
      userId: clientId,
      projectId: projectId,
      description: invoiceData.description || "Factura de Servicios",
      total: invoiceData.total || 0,
      status: "pending",
      dueDate: invoiceData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      issueDate: new Date(),
      notes: invoiceData.notes || "",
      metadata: invoiceData.metadata || "{}",
      items: invoiceData.items || "[]"
    });
    
    console.log(`Factura creada exitosamente: ${invoiceNumber}`, invoice);
    return invoice;
  } catch (error) {
    console.error("Error al crear factura:", error);
    throw error;
  }
}

/**
 * Crea facturas para el proyecto Matoro Bridge Platform
 */
async function createMatoroInvoices() {
  try {
    console.log("Iniciando creación de facturas para el proyecto Matoro Bridge Platform...");
    
    // 1. Buscar cliente Maryuri Alba
    const maryuri = await findClient("maryuri");
    if (!maryuri) {
      throw new Error("No se encontró la cliente Maryuri Alba en el sistema");
    }
    console.log("Cliente encontrado:", maryuri.id, maryuri.firstName, maryuri.lastName);
    
    // 2. Buscar o crear el proyecto con el nombre exacto requerido
    const projectName = "Matoro Bridge Platform by Matoro Consulting LLC";
    const project = await findOrCreateProject(projectName, maryuri.id, {
      description: "Desarrollo de plataforma web para Matoro Bridge con funcionalidad completa de gestión de usuarios, pagos y reportes",
      budget: 2500.00
    });
    
    console.log("Proyecto configurado:", project.id, project.name);
    
    // 3. Crear la primera factura (pago inicial - 50%)
    const invoice1 = await createClientInvoice(maryuri.id, project.id, {
      description: "Pago inicial - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
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
    
    // 4. Crear la segunda factura (pago final - 50%)
    const invoice2 = await createClientInvoice(maryuri.id, project.id, {
      description: "Pago final - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
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
    
    console.log("Facturas creadas exitosamente:");
    console.log("- Factura inicial:", invoice1.number, `$${invoice1.total}`);
    console.log("- Factura final:", invoice2.number, `$${invoice2.total}`);
    
    return {
      client: {
        id: maryuri.id,
        name: `${maryuri.firstName} ${maryuri.lastName}`,
        email: maryuri.email
      },
      project: {
        id: project.id,
        name: project.name,
        budget: project.budget
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
    console.error("Error al crear facturas para Matoro Bridge Platform:", error);
    throw error;
  }
}

// Ejecutar la función principal
createMatoroInvoices()
  .then(result => {
    console.log("Resultado completo:");
    console.log(JSON.stringify(result, null, 2));
    console.log("Proceso completado exitosamente.");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error en el script:", error);
    process.exit(1);
  });