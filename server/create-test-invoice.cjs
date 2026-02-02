// Script para crear facturas reales para Maryuri Alba y el proyecto Matoro Bridge Platform
const { storage } = require('./storage');

async function createRealInvoices() {
  try {
    console.log("Iniciando creación de facturas reales para Maryuri Alba...");
    
    // Buscar el usuario Maryuri Alba que ya existe
    const users = await storage.getUsers();
    let maryuri = users.find(user => 
      (user.email && user.email.toLowerCase().includes('maryuri')) || 
      (user.firstName && user.firstName.toLowerCase().includes('maryuri'))
    );
    
    if (!maryuri) {
      console.error("ERROR: No se encontró la usuario Maryuri Alba en el sistema");
      console.log("Por favor verifique que la cuenta exista antes de continuar");
      return;
    }
    
    console.log("Usuario Maryuri Alba encontrado:", maryuri);
    
    // Buscar el proyecto Matoro Bridge Platform
    const projects = await storage.getProjects();
    let matoroProject = projects.find(project => 
      project.name && project.name.includes('Matoro Bridge')
    );
    
    if (!matoroProject) {
      console.log("El proyecto Matoro Bridge Platform no existe, creándolo...");
      matoroProject = await storage.createProject({
        name: "Matoro Bridge Platform",
        description: "Desarrollo de plataforma web para Matoro Bridge con funcionalidad completa de gestión de usuarios, pagos y reportes",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días después
        budget: 2500.00,
        clientId: maryuri.id
      });
      console.log("Proyecto Matoro Bridge Platform creado:", matoroProject);
    } else {
      console.log("Proyecto Matoro Bridge Platform encontrado:", matoroProject);
    }
    
    // Generar número de factura único
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const invoices = await storage.getInvoices();
    
    // Primera factura - Pago inicial
    const invoiceNumber1 = `INV-${year}-${month}-${String(invoices.length + 1).padStart(4, '0')}`;
    
    const invoice1 = await storage.createInvoice({
      number: invoiceNumber1,
      userId: maryuri.id,
      projectId: matoroProject.id,
      description: "Pago inicial - Proyecto Matoro Bridge Platform",
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
    
    console.log("Factura de pago inicial creada:", invoice1);
    
    // Segunda factura - Pago final
    const invoiceNumber2 = `INV-${year}-${month}-${String(invoices.length + 2).padStart(4, '0')}`;
    
    const invoice2 = await storage.createInvoice({
      number: invoiceNumber2,
      userId: maryuri.id,
      projectId: matoroProject.id,
      description: "Pago final - Proyecto Matoro Bridge Platform",
      total: 1250.00,
      status: "pending",
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 días después
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
    
    console.log("Factura de pago final creada:", invoice2);
    
    console.log("Proceso completado exitosamente!");
    console.log(`Se crearon 2 facturas reales para Maryuri Alba (ID: ${maryuri.id}) para el proyecto Matoro Bridge Platform (ID: ${matoroProject.id})`);
    console.log(`Números de factura: ${invoiceNumber1}, ${invoiceNumber2}`);
    
  } catch (error) {
    console.error("Error al crear facturas reales:", error);
  }
}

// Ejecutar la función
createRealInvoices();