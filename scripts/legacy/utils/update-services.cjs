require('dotenv').config();
const { Pool } = require('pg');

// Crear pool de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateServices() {
  try {
    console.log("Conectando a la base de datos...");
    const client = await pool.connect();
    
    console.log("Actualizando servicios con nuevos precios y descripciones...");
    
    const services = [
      {
        id: 1,
        name: "Web Design",
        nameEs: "Diseño Web",
        description: "Custom responsive websites built with modern code, compelling AI-assisted copywriting, and clean, scalable design.",
        descriptionEs: "Sitios web responsivos personalizados creados con código moderno, redacción asistida por IA y diseño limpio y escalable.",
        price: 950,
        features: JSON.stringify(["Responsive design", "SEO optimization", "Modern UI/UX"]),
        featuresEs: JSON.stringify(["Diseño responsivo", "Optimización SEO", "UI/UX moderno"]),
        icon: "laptop-code",
        sortOrder: 1
      },
      {
        id: 2,
        name: "Automation",
        nameEs: "Automatización",
        description: "Streamline your operations using AI-powered automation: forms, email workflows, scheduling, payments, and CRM integrations.",
        descriptionEs: "Optimice sus operaciones con automatización impulsada por IA: formularios, flujos de correo electrónico, programación, pagos e integraciones CRM.",
        price: 1100,
        features: JSON.stringify(["Workflow automation", "AI integrations", "Business analytics"]),
        featuresEs: JSON.stringify(["Automatización de flujos", "Integraciones con IA", "Análisis de negocio"]),
        icon: "robot",
        sortOrder: 2
      },
      {
        id: 3,
        name: "Branding",
        nameEs: "Branding",
        description: "Stand out with a unique brand identity. We combine strategic thinking with AI-generated visuals, typography, and messaging.",
        descriptionEs: "Destáquese con una identidad de marca única. Combinamos pensamiento estratégico con visuales generados por IA, tipografía y mensajería.",
        price: 750,
        features: JSON.stringify(["Logo design", "Brand strategy", "Marketing materials"]),
        featuresEs: JSON.stringify(["Diseño de logo", "Estrategia de marca", "Materiales de marketing"]),
        icon: "paint-brush",
        sortOrder: 3
      },
      {
        id: 4,
        name: "Social Media Marketing",
        nameEs: "Marketing en Redes Sociales",
        description: "Monthly content creation and scheduling using AI tools. Includes visual assets, captions, and strategic planning for Facebook, Instagram, and WhatsApp.",
        descriptionEs: "Creación y programación mensual de contenido utilizando herramientas de IA. Incluye activos visuales, subtítulos y planificación estratégica para Facebook, Instagram y WhatsApp.",
        price: 600,
        features: JSON.stringify(["Facebook marketing", "Instagram content", "WhatsApp campaigns"]),
        featuresEs: JSON.stringify(["Marketing en Facebook", "Contenido para Instagram", "Campañas en WhatsApp"]),
        icon: "share-alt",
        sortOrder: 4
      },
      {
        id: 5,
        name: "Accounting",
        nameEs: "Contabilidad",
        description: "Professional setup and automation of your business finances using intelligent tools, custom dashboards, and best practices.",
        descriptionEs: "Configuración profesional y automatización de las finanzas de su negocio utilizando herramientas inteligentes, paneles personalizados y mejores prácticas.",
        price: 700,
        features: JSON.stringify(["Financial reporting", "Tax preparation", "Expense tracking"]),
        featuresEs: JSON.stringify(["Informes financieros", "Preparación de impuestos", "Seguimiento de gastos"]),
        icon: "calculator",
        sortOrder: 5
      }
    ];
    
    for (const service of services) {
      await client.query(
        `UPDATE service_types 
         SET name = $1, name_es = $2, description = $3, description_es = $4, 
             price = $5, features = $6, features_es = $7, icon = $8, sort_order = $9
         WHERE id = $10`,
        [
          service.name, 
          service.nameEs, 
          service.description, 
          service.descriptionEs, 
          service.price, 
          service.features, 
          service.featuresEs, 
          service.icon, 
          service.sortOrder,
          service.id
        ]
      );
      console.log(`Servicio actualizado: ${service.name}`);
    }
    
    console.log("Servicios actualizados exitosamente!");
    
    // Verificar los servicios actualizados
    const result = await client.query('SELECT id, name, price, description FROM service_types ORDER BY sort_order');
    console.log("Servicios actualizados:");
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name}: $${row.price} - ${row.description.substring(0, 40)}...`);
    });
    
    client.release();
    await pool.end();
    
    console.log("Actualización completada.");
  } catch (error) {
    console.error("Error al actualizar los servicios:", error);
    process.exit(1);
  }
}

updateServices();