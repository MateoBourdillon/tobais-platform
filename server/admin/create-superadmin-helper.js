// Módulo CommonJS auxiliar para crear superadmin
const { storage } = require("../storage");
const crypto = require("crypto");
const util = require("util");

const scryptAsync = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString("hex")}.${salt}`;
}

/**
 * Crea un superadmin en la base de datos o actualiza uno existente si ya existe con el nombre o email proporcionado
 */
async function createSuperAdmin(
  username, 
  email, 
  password,
  firstName,
  lastName,
  phone
) {
  try {
    console.log(`Intentando crear superadmin para: ${username} (${email})`);
    
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
        
        console.log(`Usuario '${username}' actualizado a superadmin`);
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
        
        console.log(`Usuario con correo '${email}' actualizado a superadmin`);
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
      fullName: `${firstName} ${lastName}`,
      phone,
      role: 'superadmin',
      adminLevel: 6,
      permissions: JSON.stringify(['all']),
      isActive: true
    });
    
    console.log(`Superadmin '${username}' creado con éxito`);
    return newUser;
  } catch (error) {
    console.error('Error al crear superadmin:', error);
    throw error;
  }
}

module.exports = { createSuperAdmin };