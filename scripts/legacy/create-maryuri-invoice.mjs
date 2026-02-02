/**
 * Script for creating Maryuri's invoice for the Matoro Bridge Platform
 * Using ES modules format
 */
import { storage } from './server/storage.js';

async function main() {
  try {
    console.log("Starting Maryuri invoice creation process...");
    
    // Find Maryuri user or create one if not found
    console.log("Looking for Maryuri's account...");
    const users = await storage.getUsers();
    console.log(`Found ${users.length} total users`);
    
    // Display users for debugging
    users.forEach(user => {
      console.log(`ID: ${user.id}, Username: ${user.username}, Email: ${user.email || 'N/A'}, Name: ${user.firstName || ''} ${user.lastName || ''}`);
    });
    
    // Find by any field containing "maryuri"
    let maryuri = users.find(u => 
      Object.values(u).some(
        val => typeof val === 'string' && val.toLowerCase().includes('maryuri')
      )
    );
    
    if (!maryuri) {
      console.log("Maryuri not found, creating account...");
      maryuri = await storage.createUser({
        username: "maryuri",
        password: "password123", // Placeholder 
        email: "maryuri@matoro.com",
        firstName: "Maryuri",
        lastName: "Alba",
        role: "user"
      });
      console.log("Created user:", maryuri);
    } else {
      console.log("Found existing user:", maryuri);
    }
    
    // Find or create Matoro project
    console.log("Looking for Matoro Bridge project...");
    const projects = await storage.getProjects();
    let project = projects.find(p => 
      p.name && p.name.includes("Matoro Bridge")
    );
    
    if (!project) {
      console.log("Project not found, creating...");
      project = await storage.createProject({
        name: "Matoro Bridge Platform by Matoro Consulting LLC",
        description: "Web application development for Matoro Bridge Platform",
        clientId: maryuri.id,
        status: "active",
        startDate: new Date(),
        budget: 2500
      });
      console.log("Created project:", project);
    } else {
      console.log("Found existing project:", project);
      
      // Make sure project is assigned to Maryuri
      if (project.clientId !== maryuri.id) {
        console.log("Updating project to assign to Maryuri...");
        await storage.updateProject(project.id, {
          clientId: maryuri.id
        });
        console.log("Project updated and assigned to Maryuri");
      }
    }
    
    // Create invoice
    console.log("Creating invoice...");
    const invoice = await storage.createInvoice({
      number: `INV-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-001`,
      userId: maryuri.id,
      projectId: project.id,
      description: "Initial Payment - Matoro Bridge Platform by Matoro Consulting LLC",
      total: 1250.00,
      status: "pending",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      issueDate: new Date(),
      items: JSON.stringify([
        {description: "Initial development payment (50%)", amount: 1250.00}
      ])
    });
    
    console.log("Created invoice successfully:", invoice);
    console.log("DONE!");
    
    return { maryuri, project, invoice };
  } catch (err) {
    console.error("Error:", err);
    throw err;
  }
}

// Execute the function
main()
  .then(result => {
    console.log("Final result:", result);
    process.exit(0);
  })
  .catch(err => {
    console.error("Script failed:", err);
    process.exit(1);
  });