require('dotenv').config();
const { Pool } = require('pg');

// Crear pool de conexión a PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function updateSocialMediaService() {
  try {
    console.log("Conectando a la base de datos...");
    const client = await pool.connect();
    
    console.log("Actualizando servicio de Social Media Marketing...");
    
    const newDescription = "Monthly content creation and scheduling using AI tools. Includes visual assets, captions, and strategic planning for Facebook, Instagram, WhatsApp, LinkedIn, TikTok, and other relevant platforms based on the client's audience.";
    const newDescriptionEs = "Creación y programación mensual de contenido utilizando herramientas de IA. Incluye activos visuales, subtítulos y planificación estratégica para Facebook, Instagram, WhatsApp, LinkedIn, TikTok y otras plataformas relevantes según la audiencia del cliente.";
    
    const newFeatures = JSON.stringify([
      "Facebook & Instagram marketing", 
      "LinkedIn & TikTok content", 
      "WhatsApp business strategies"
    ]);
    
    const newFeaturesEs = JSON.stringify([
      "Marketing en Facebook e Instagram", 
      "Contenido para LinkedIn y TikTok", 
      "Estrategias de negocio en WhatsApp"
    ]);
    
    await client.query(
      `UPDATE service_types 
       SET description = $1, description_es = $2, features = $3, features_es = $4
       WHERE id = 4`,
      [
        newDescription, 
        newDescriptionEs, 
        newFeatures, 
        newFeaturesEs
      ]
    );
    
    console.log("Servicio de Social Media Marketing actualizado!");
    
    // Verificar el servicio actualizado
    const result = await client.query('SELECT id, name, price, description FROM service_types WHERE id = 4');
    console.log("Servicio actualizado:");
    result.rows.forEach(row => {
      console.log(`${row.id}. ${row.name}: $${row.price} - ${row.description}`);
    });
    
    client.release();
    await pool.end();
    
    console.log("Actualización completada.");
  } catch (error) {
    console.error("Error al actualizar el servicio de Social Media Marketing:", error);
    process.exit(1);
  }
}

updateSocialMediaService();