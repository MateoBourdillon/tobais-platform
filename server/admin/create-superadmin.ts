import { storage } from "../storage";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";
import { fileURLToPath } from "url";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function createSuperAdmin(
  username: string, 
  email: string, 
  password: string,
  firstName: string,
  lastName: string,
  phone: string
) {
  try {
    // Comprobar si ya existe un usuario con este nombre o correo
    const existingUserByUsername = await storage.getUserByUsername(username);
    const existingUserByEmail = await storage.getUserByEmail(email);
    
    if (existingUserByUsername) {
      console.log(`Ya existe un usuario con el nombre '${username}'`);
      
      // Si el usuario existe pero no es superadmin, actualizarlo
      if (existingUserByUsername.role !== 'superadmin') {
        const updated = await storage.updateUser(existingUserByUsername.id, {
          role: 'superadmin',
          adminLevel: 6,
          firstName,
          lastName,
          phone,
          permissions: JSON.stringify(['all']),
          isActive: true
        });
        
        console.log(`Usuario '${username}' actualizado a superadmin:`, updated);
        return updated;
      }
      
      return existingUserByUsername;
    }
    
    if (existingUserByEmail) {
      console.log(`Ya existe un usuario con el correo '${email}'`);
      
      // Si el usuario existe pero no es superadmin, actualizarlo
      if (existingUserByEmail.role !== 'superadmin') {
        const updated = await storage.updateUser(existingUserByEmail.id, {
          role: 'superadmin',
          adminLevel: 6,
          firstName,
          lastName,
          phone,
          permissions: JSON.stringify(['all']),
          isActive: true
        });
        
        console.log(`Usuario con correo '${email}' actualizado a superadmin:`, updated);
        return updated;
      }
      
      return existingUserByEmail;
    }
    
    // Crear un nuevo superadmin
    const hashedPassword = await hashPassword(password);
    
    const newUser = await storage.createUser({
      username,
      password: hashedPassword,
      email,
      firstName,
      lastName,
      phone,
      role: 'superadmin',
      adminLevel: 6,
      permissions: JSON.stringify(['all']),
      isActive: true
    } as any);
    
    console.log(`Superadmin '${username}' creado con éxito:`, newUser);
    return newUser;
  } catch (error) {
    console.error('Error al crear superadmin:', error);
    throw error;
  }
}

// Security: Fail-fast validation for required environment variables
function validateEnvVars() {
  if (!process.env.SUPERADMIN_LOGIN) {
    throw new Error("SUPERADMIN_LOGIN env var is required to run create-superadmin script");
  }
  if (!process.env.SUPERADMIN_PASSWORD) {
    throw new Error("SUPERADMIN_PASSWORD env var is required to run create-superadmin script");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to run create-superadmin in production. Run this script only in a secure admin environment.");
  }
}

// Este código se ejecuta solo si se invoca directamente el archivo (ES module compatible)
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);
if (isMainModule) {
  validateEnvVars();
  
  const adminLogin = process.env.SUPERADMIN_LOGIN!;
  const adminPassword = process.env.SUPERADMIN_PASSWORD!;
  
  const adminFirstName = process.env.SUPERADMIN_FIRST_NAME || 'Admin';
  const adminLastName = process.env.SUPERADMIN_LAST_NAME || 'User';
  const adminPhone = process.env.SUPERADMIN_PHONE || '';
  
  const isEmail = adminLogin.includes('@');
  const adminUsername = isEmail ? adminLogin.split('@')[0] : adminLogin;
  const adminEmail = isEmail ? adminLogin : `${adminLogin}@tobais.com`;
  
  createSuperAdmin(
    adminUsername,
    adminEmail,
    adminPassword,
    adminFirstName,
    adminLastName,
    adminPhone
  )
    .then(() => {
      console.log('Superadmin created/updated successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error creating superadmin:', error.message);
      process.exit(1);
    });
}