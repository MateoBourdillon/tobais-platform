import express, { Router } from "express";
import { registerAdminManagementRoutes } from "./admin-manager";
import { registerInvoiceManagementRoutes } from "./invoice-manager";
import { storage } from "../storage";

// Inicializar el router de Express
const router = express.Router();

// Ruta especial para creación inicial de superadmin (accesible sin autenticación)
router.post("/create-superadmin", async (req, res) => {
  try {
    const { username, email, password, firstName, lastName, phone } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Faltan datos requeridos" });
    }
    
    // Buscar si ya existe un usuario con este nombre o correo
    const existingUserByUsername = await storage.getUserByUsername(username);
    const existingUserByEmail = await storage.getUserByEmail(email);
    
    if (existingUserByUsername) {
      // Si existe pero no es superadmin, actualizarlo
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
        
        return res.status(200).json({
          message: 'Usuario actualizado a superadmin',
          user: updated
        });
      }
      
      return res.status(200).json({
        message: 'El usuario ya es superadmin',
        user: existingUserByUsername
      });
    }
    
    if (existingUserByEmail) {
      // Si existe pero no es superadmin, actualizarlo
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
        
        return res.status(200).json({
          message: 'Usuario actualizado a superadmin',
          user: updated
        });
      }
      
      return res.status(200).json({
        message: 'El usuario ya es superadmin',
        user: existingUserByEmail
      });
    }
    
    // No existe, crearlo
    const { hashPassword } = await import('../auth');
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
    
    return res.status(201).json({
      message: 'Superadmin creado correctamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error al crear superadmin:', error);
    return res.status(500).json({ 
      message: 'Error al crear superadmin', 
      error: error.message 
    });
  }
});

// Middleware general para verificar acceso a rutas administrativas (para todas las rutas excepto create-superadmin)
router.use((req, res, next) => {
  // Excluir la ruta de creación de superadmin que ya está definida arriba
  if (req.path === '/create-superadmin' && req.method === 'POST') {
    return next();
  }
  
  if (!req.isAuthenticated() || !req.user) {
    return res.status(401).json({ message: "Autenticación requerida" });
  }
  
  if (req.user.role !== "admin" && req.user.role !== "superadmin") {
    return res.status(403).json({ 
      message: "Acceso denegado. Se requieren permisos de administrador."
    });
  }
  
  // El usuario está autenticado y tiene rol de administrador
  next();
});

// Ruta para verificar permisos de administrador
router.get("/check-permissions", (req, res) => {
  const { user } = req;
  
  if (!user) {
    return res.status(401).json({ message: "No autenticado" });
  }
  
  // Preparar información de permisos
  const permissions = {
    role: user.role,
    adminLevel: user.adminLevel || 0,
    isSuperAdmin: user.role === "superadmin" || user.adminLevel === 6,
    permissions: user.permissions ? JSON.parse(user.permissions as string) : [],
    canManageAdmins: user.role === "superadmin" || user.adminLevel === 6,
    canManageInvoices: user.role === "superadmin" || user.adminLevel >= 3 // Nivel 3 o superior puede gestionar facturas
  };
  
  res.json({
    success: true,
    permissions
  });
});

// Registrar rutas de administración

// Registrar rutas de gestión de administradores
registerAdminManagementRoutes(router);

// Registrar rutas de gestión de facturas
registerInvoiceManagementRoutes(router);

export default router;