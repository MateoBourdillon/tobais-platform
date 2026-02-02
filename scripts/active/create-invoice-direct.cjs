/**
 * Script for directly creating an invoice for Maryuri Alba's Matoro Bridge Platform project
 * This simpler approach avoids admin authentication issues
 */

// Direct database manipulation for invoice creation
const { Client } = require('pg');

async function main() {
  console.log("Starting direct invoice creation process...");
  
  // Connect to PostgreSQL database
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  
  try {
    console.log("Connecting to database...");
    await client.connect();
    console.log("Connected to database successfully");
    
    // 1. Find Maryuri's user account or create it
    console.log("Looking for Maryuri's account...");
    let maryuriQuery = await client.query(`
      SELECT * FROM users 
      WHERE (email LIKE '%maryuri%' OR full_name LIKE '%maryuri%') 
      LIMIT 1
    `);
    
    let maryuriId;
    
    if (maryuriQuery.rows.length === 0) {
      console.log("Creating Maryuri's user account...");
      const insertResult = await client.query(`
        INSERT INTO users (username, password, email, full_name, role)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, ["maryuri", "password123", "maryuri@matoro.com", "Maryuri Alba", "user"]);
      
      maryuriId = insertResult.rows[0].id;
      console.log(`Created user account with ID: ${maryuriId}`);
    } else {
      maryuriId = maryuriQuery.rows[0].id;
      console.log(`Found Maryuri's account with ID: ${maryuriId}`);
    }
    
    // 2. Find or create the Matoro Bridge Platform project
    console.log("Looking for Matoro Bridge Platform project...");
    let projectQuery = await client.query(`
      SELECT * FROM projects 
      WHERE title LIKE '%Matoro Bridge%'
      LIMIT 1
    `);
    
    let projectId;
    
    if (projectQuery.rows.length === 0) {
      console.log("Creating Matoro Bridge Platform project...");
      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 90); // 90 days from now
      
      const insertResult = await client.query(`
        INSERT INTO projects (title, description, status, start_date, end_date, client_id)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [
        "Matoro Bridge Platform by Matoro Consulting LLC",
        "Development of the Matoro Bridge Platform web application with complete user management, payment processing, and reporting functionality",
        "active",
        startDate,
        endDate,
        maryuriId
      ]);
      
      projectId = insertResult.rows[0].id;
      console.log(`Created project with ID: ${projectId}`);
    } else {
      projectId = projectQuery.rows[0].id;
      console.log(`Found project with ID: ${projectId}`);
      
      // Make sure project is assigned to Maryuri
      if (projectQuery.rows[0].client_id !== maryuriId) {
        console.log("Updating project to assign to Maryuri...");
        await client.query(`
          UPDATE projects 
          SET client_id = $1
          WHERE id = $2
        `, [maryuriId, projectId]);
        console.log("Project updated and assigned to Maryuri");
      }
    }
    
    // 3. Create the invoice
    console.log("Creating invoice for initial payment...");
    
    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const invoiceNumber = `INV-${year}-${month}-001`;
    
    // Due date (7 days from now)
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    
    // Invoice items as JSON
    const items = JSON.stringify([
      { 
        description: "Requirements analysis and project setup - Matoro Bridge Platform", 
        amount: 450.00 
      },
      { 
        description: "Frontend design and implementation - Matoro Bridge Platform", 
        amount: 450.00 
      },
      { 
        description: "Initial database schema design - Matoro Bridge Platform", 
        amount: 350.00 
      }
    ]);
    
    // Invoice metadata
    const metadata = JSON.stringify({
      type: "initial_payment",
      percentage: 50,
      projectPhase: "Development Start"
    });
    
    // Insert the invoice
    const invoiceResult = await client.query(`
      INSERT INTO invoices (
        number, user_id, project_id, description, total, status, 
        due_date, issue_date, notes, metadata, items
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, number, total, due_date
    `, [
      invoiceNumber,
      maryuriId,
      projectId,
      "Initial Payment - Matoro Bridge Platform by Matoro Consulting LLC",
      1250.00,
      "pending",
      dueDate,
      date,
      "Initial payment of 50% for the Matoro Bridge Platform development project",
      metadata,
      items
    ]);
    
    console.log("Invoice created successfully:", invoiceResult.rows[0]);
    
    return {
      success: true,
      message: "Invoice created successfully",
      invoice: invoiceResult.rows[0]
    };
  } catch (error) {
    console.error("❌ Error creating invoice:", error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    // Close database connection
    console.log("Closing database connection...");
    await client.end();
    console.log("Database connection closed");
  }
}

// Run the script
main()
  .then(result => {
    console.log("Final result:", result);
    
    if (result.success) {
      console.log("✅ Invoice creation successful");
      process.exit(0);
    } else {
      console.log("❌ Invoice creation failed");
      process.exit(1);
    }
  })
  .catch(err => {
    console.error("Fatal error:", err);
    process.exit(1);
  });