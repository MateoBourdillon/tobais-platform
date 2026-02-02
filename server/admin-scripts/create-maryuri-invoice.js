/**
 * Script to create an invoice for Maryuri Alba
 * Compatible with the CommonJS format used in the server
 */

const { storage } = require('../storage');

async function createMaryuriInvoice() {
  try {
    console.log("Starting to create invoice for Maryuri Alba...");
    
    // 1. Find Maryuri's user account
    console.log("Finding Maryuri's account...");
    const users = await storage.getUsers();
    console.log(`Found ${users.length} total users`);
    
    // Display all users to help identify Maryuri
    users.forEach(user => {
      console.log(`User ID: ${user.id}, Username: ${user.username}, Email: ${user.email || 'N/A'}, Name: ${user.firstName || ''} ${user.lastName || ''}`);
    });
    
    let maryuri = users.find(user => 
      (user.email && user.email.toLowerCase().includes('maryuri')) || 
      (user.username && user.username.toLowerCase().includes('maryuri')) ||
      (user.firstName && user.firstName.toLowerCase().includes('maryuri'))
    );
    
    if (!maryuri) {
      console.log("Maryuri not found. Creating a test user for Maryuri...");
      const newUser = await storage.createUser({
        username: "maryuri",
        password: "password123", // This is just a placeholder
        email: "maryuri@example.com",
        firstName: "Maryuri",
        lastName: "Alba",
        role: "user"
      });
      console.log(`Created test user for Maryuri with ID: ${newUser.id}`);
      maryuri = newUser;
    } else {
      console.log(`Found Maryuri's account with ID: ${maryuri.id}`);
    }
    
    // 2. Check if Matoro Bridge project exists or create it
    console.log("Finding or creating Matoro Bridge project...");
    const projects = await storage.getProjects();
    let matoroProject = projects.find(project => 
      project.name && project.name.includes('Matoro Bridge')
    );
    
    if (!matoroProject) {
      console.log("Project not found. Creating Matoro Bridge Platform project...");
      matoroProject = await storage.createProject({
        name: "Matoro Bridge Platform by Matoro Consulting LLC",
        description: "Development of the Matoro Bridge Platform web application with complete user management, payment processing, and reporting functionality",
        status: "active",
        startDate: new Date(),
        endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days in the future
        budget: 2500.00,
        clientId: maryuri.id
      });
      console.log(`Created project with ID: ${matoroProject.id}`);
    } else {
      console.log(`Found existing project with ID: ${matoroProject.id}`);
      
      // Ensure project is assigned to Maryuri
      if (matoroProject.clientId !== maryuri.id) {
        console.log("Updating project to assign to Maryuri...");
        matoroProject = await storage.updateProject(matoroProject.id, {
          clientId: maryuri.id
        });
      }
    }
    
    // 3. Create invoice for Maryuri
    console.log("Creating invoice for initial payment...");
    
    // Generate invoice number
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const invoices = await storage.getInvoices();
    const invoiceNumber = `INV-${year}-${month}-${String(invoices.length + 1).padStart(4, '0')}`;
    
    const invoice = await storage.createInvoice({
      number: invoiceNumber,
      userId: maryuri.id,
      projectId: matoroProject.id,
      description: "Initial Payment - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Due in 7 days
      issueDate: new Date(),
      notes: "Initial payment of 50% for the Matoro Bridge Platform development project",
      metadata: JSON.stringify({
        type: "initial_payment",
        percentage: 50,
        projectPhase: "Development Start"
      }),
      items: JSON.stringify([
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
      ])
    });
    
    console.log("Successfully created invoice:", {
      id: invoice.id,
      number: invoice.number,
      total: invoice.total,
      dueDate: invoice.dueDate
    });
    
    console.log("Script completed successfully!");
    return {
      user: {
        id: maryuri.id,
        username: maryuri.username,
        email: maryuri.email
      },
      project: {
        id: matoroProject.id,
        name: matoroProject.name
      },
      invoice: {
        id: invoice.id,
        number: invoice.number,
        total: invoice.total,
        dueDate: invoice.dueDate
      }
    };
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

// Export the function for use in other scripts
module.exports = {
  createMaryuriInvoice
};

// Run the function if this script is called directly
if (require.main === module) {
  createMaryuriInvoice()
    .then(result => {
      console.log("Final result:", result);
      process.exit(0);
    })
    .catch(error => {
      console.error("Script failed:", error);
      process.exit(1);
    });
}