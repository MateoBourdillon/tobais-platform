#!/usr/bin/env node

import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Verificar si la conexión a la base de datos es posible
if (!process.env.DATABASE_URL) {
  console.error("Error: DATABASE_URL no está definida en las variables de entorno.");
  process.exit(1);
}

async function resetServices() {
  // Crear una conexión a la base de datos
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // 1. Eliminar todos los servicios existentes
    console.log("Eliminando servicios existentes...");
    await pool.query('DELETE FROM service_types');
    console.log("Servicios eliminados correctamente.");

    // 2. Insertar los nuevos servicios con los precios actualizados
    console.log("Insertando nuevos servicios con precios actualizados...");
    
    const services = [
      {
        name: "Web Design",
        nameEs: "Diseño Web",
        description: "Custom responsive websites that attract and convert visitors with modern designs.",
        descriptionEs: "Sitios web responsivos personalizados que atraen y convierten visitantes con diseños modernos.",
        price: 500,
        features: JSON.stringify(["Responsive design", "SEO optimization", "Modern UI/UX"]),
        featuresEs: JSON.stringify(["Diseño responsivo", "Optimización SEO", "UI/UX moderno"]),
        icon: "laptop-code",
        sortOrder: 1
      },
      {
        name: "Automation",
        nameEs: "Automatización",
        description: "Streamline your business processes with AI-powered automation solutions.",
        descriptionEs: "Optimice sus procesos de negocio con soluciones de automatización impulsadas por IA.",
        price: 899,
        features: JSON.stringify(["Workflow automation", "AI integrations", "Business analytics"]),
        featuresEs: JSON.stringify(["Automatización de flujos", "Integraciones con IA", "Análisis de negocio"]),
        icon: "robot",
        sortOrder: 2
      },
      {
        name: "Branding",
        nameEs: "Branding",
        description: "Create a memorable brand identity that resonates with your target audience.",
        descriptionEs: "Cree una identidad de marca memorable que resuene con su público objetivo.",
        price: 800,
        features: JSON.stringify(["Logo design", "Brand strategy", "Marketing materials"]),
        featuresEs: JSON.stringify(["Diseño de logo", "Estrategia de marca", "Materiales de marketing"]),
        icon: "paint-brush",
        sortOrder: 3
      },
      {
        name: "Social Media Marketing",
        nameEs: "Marketing en Redes Sociales",
        description: "Engage with your audience through strategic social media marketing campaigns on Facebook, Instagram, WhatsApp, and LinkedIn.",
        descriptionEs: "Conecte con su audiencia a través de campañas estratégicas de marketing en redes sociales en Facebook, Instagram, WhatsApp y LinkedIn.",
        price: 499,
        features: JSON.stringify(["Facebook marketing", "Instagram content", "WhatsApp campaigns", "LinkedIn strategy"]),
        featuresEs: JSON.stringify(["Marketing en Facebook", "Contenido para Instagram", "Campañas en WhatsApp", "Estrategia para LinkedIn"]),
        icon: "share-alt",
        sortOrder: 4
      },
      {
        name: "Accounting",
        nameEs: "Contabilidad",
        description: "Professional accounting services to help manage your business finances effectively.",
        descriptionEs: "Servicios de contabilidad profesionales para ayudar a gestionar las finanzas de su negocio de manera efectiva.",
        price: 700,
        features: JSON.stringify(["Bookkeeping", "Tax preparation", "Financial reporting", "Business consulting"]),
        featuresEs: JSON.stringify(["Teneduría de libros", "Preparación de impuestos", "Informes financieros", "Consultoría empresarial"]),
        icon: "calculator",
        sortOrder: 5
      }
    ];

    for (const service of services) {
      await pool.query(
        `INSERT INTO service_types 
        (name, "nameEs", description, "descriptionEs", price, features, "featuresEs", icon, "sortOrder") 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          service.name, 
          service.nameEs, 
          service.description, 
          service.descriptionEs, 
          service.price,
          service.features,
          service.featuresEs,
          service.icon,
          service.sortOrder
        ]
      );
    }

    console.log("Servicios reiniciados correctamente con los siguientes precios:");
    console.log("- Web Design: $500");
    console.log("- Branding: $800");
    console.log("- Social Media Marketing: $499");
    console.log("- Accounting: $700");
    console.log("(Automation se mantiene en $899)");

  } catch (error) {
    console.error("Error al reiniciar los servicios:", error);
  } finally {
    // Cerrar la conexión a la base de datos
    await pool.end();
  }
}

// Ejecutar la función principal
resetServices().catch(err => {
  console.error("Error inesperado:", err);
  process.exit(1);
});