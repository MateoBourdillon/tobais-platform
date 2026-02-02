import { Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";

// Define una constante para representar los niveles de administrador
export const ADMIN_LEVELS = {
  REGULAR_USER: 0,
  STAFF: 1,            // Empleados - pueden gestionar AI briefs y enviar emails
  CONTENT_ADMIN: 2,    // Puede gestionar blog y contenido social
  CLIENT_ADMIN: 3,     // Puede gestionar clientes y proyectos
  FINANCE_ADMIN: 4,    // Puede gestionar facturas y pagos
  SERVICE_ADMIN: 5,    // Puede gestionar servicios y precios
  SUPERADMIN: 6        // Acceso completo, puede gestionar otros administradores
};

// Schema para validar datos de creación/actualización de administradores
const adminUpdateSchema = z.object({
  username: z.string().min(7).optional(),
  email: z.string().email().optional(),
  fullName: z.string().optional(),
  role: z.enum(["user", "admin", "superadmin"]).optional(),
  adminLevel: z.number().min(0).max(6).optional(),
  permissions: z.array(z.string()).optional(),
  isActive: z.boolean().optional()
});

// Schema para validar datos al crear un nuevo administrador
const newAdminSchema = z.object({
  username: z.string().min(7),
  email: z.string().email(),
  password: z.string().min(10),
  fullName: z.string().optional(),
  adminLevel: z.number().min(1).max(6),
  permissions: z.array(z.string()).optional()
});

/**
 * Verifica si el usuario actual tiene los permisos necesarios para realizar
 * operaciones de administración en un usuario específico
 */
export function canManageUser(currentUser: any, targetUser: any): boolean {
  // Si el usuario actual no es admin o no tiene nivel de admin, no puede gestionar
  if (currentUser.role !== 'admin' && currentUser.role !== 'superadmin') {
    return false;
  }
  
  // Un superadmin (nivel 6) puede gestionar a cualquier usuario
  if (currentUser.role === 'superadmin' || currentUser.adminLevel === ADMIN_LEVELS.SUPERADMIN) {
    return true;
  }
  
  // Un administrador solo puede gestionar usuarios con nivel inferior al suyo
  const currentLevel = currentUser.adminLevel || 0;
  const targetLevel = targetUser.adminLevel || 0;
  
  return currentLevel > targetLevel;
}

/**
 * Obtiene todos los usuarios administrativos
 */
export async function getAllAdmins(req: Request, res: Response) {
  try {
    // Verificar si el usuario actual es superadmin
    if (!req.user || req.user.adminLevel !== ADMIN_LEVELS.SUPERADMIN) {
      return res.status(403).json({ 
        message: 'Acceso denegado. Se requieren permisos de superadministrador.'
      });
    }
    
    // Obtener todos los administradores
    const admins = await storage.getAllAdminUsers();
    
    // Devolver los administradores, pero ocultar las contraseñas
    const safeAdmins = admins.map(admin => {
      const { password, ...safeAdmin } = admin;
      return safeAdmin;
    });
    
    return res.json(safeAdmins);
  } catch (error: any) {
    console.error('Error al obtener administradores:', error);
    return res.status(500).json({ message: 'Error al obtener administradores' });
  }
}

/**
 * Crea un nuevo administrador
 */
export async function createAdmin(req: Request, res: Response) {
  try {
    // Verificar si el usuario actual es superadmin
    if (!req.user || req.user.adminLevel !== ADMIN_LEVELS.SUPERADMIN) {
      return res.status(403).json({ 
        message: 'Acceso denegado. Se requieren permisos de superadministrador para crear administradores.'
      });
    }
    
    // Validar los datos recibidos
    const validatedData = newAdminSchema.parse(req.body);
    
    // Verificar si ya existe un usuario con ese nombre o email
    const existingUserByUsername = await storage.getUserByUsername(validatedData.username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
    }
    
    const existingUserByEmail = await storage.getUserByEmail(validatedData.email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
    }
    
    // Preparar datos para creación
    const adminData = {
      ...validatedData,
      role: 'admin',
      isActive: true,
      language: 'en'
    };
    
    // Crear el nuevo administrador
    const newAdmin = await storage.createAdminUser(adminData);
    
    // Ocultar la contraseña en la respuesta
    const { password, ...safeAdmin } = newAdmin;
    
    return res.status(201).json(safeAdmin);
  } catch (error: any) {
    console.error('Error al crear administrador:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Datos de administrador no válidos', 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: 'Error al crear administrador' });
  }
}

/**
 * Actualiza los datos de un administrador existente
 */
export async function updateAdmin(req: Request, res: Response) {
  try {
    const adminId = parseInt(req.params.id);
    
    if (isNaN(adminId)) {
      return res.status(400).json({ message: 'ID de administrador no válido' });
    }
    
    // Obtener el administrador a actualizar
    const adminToUpdate = await storage.getUser(adminId);
    
    if (!adminToUpdate) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }
    
    // Verificar si el usuario actual puede gestionar al administrador objetivo
    if (!canManageUser(req.user, adminToUpdate)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para modificar este administrador' 
      });
    }
    
    // Validar los datos recibidos
    const validatedData = adminUpdateSchema.parse(req.body);
    
    // Si se está intentando cambiar el username, verificar que no exista otro usuario con ese nombre
    if (validatedData.username && validatedData.username !== adminToUpdate.username) {
      const existingUser = await storage.getUserByUsername(validatedData.username);
      if (existingUser && existingUser.id !== adminId) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese nombre de usuario' });
      }
    }
    
    // Si se está intentando cambiar el email, verificar que no exista otro usuario con ese email
    if (validatedData.email && validatedData.email !== adminToUpdate.email) {
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser && existingUser.id !== adminId) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese email' });
      }
    }
    
    // Si el usuario actual no es superadmin, no puede actualizar a un admin a nivel superior al suyo
    if (req.user.adminLevel !== ADMIN_LEVELS.SUPERADMIN && 
        validatedData.adminLevel && 
        validatedData.adminLevel >= req.user.adminLevel) {
      return res.status(403).json({ 
        message: 'No puedes asignar un nivel de administrador igual o superior al tuyo' 
      });
    }
    
    // Actualizar el administrador
    const updatedAdmin = await storage.updateUser(adminId, validatedData);
    
    if (!updatedAdmin) {
      return res.status(500).json({ message: 'Error al actualizar administrador' });
    }
    
    // Ocultar la contraseña en la respuesta
    const { password, ...safeAdmin } = updatedAdmin;
    
    return res.json(safeAdmin);
  } catch (error: any) {
    console.error('Error al actualizar administrador:', error);
    if (error.name === 'ZodError') {
      return res.status(400).json({ 
        message: 'Datos de administrador no válidos', 
        errors: error.errors 
      });
    }
    return res.status(500).json({ message: 'Error al actualizar administrador' });
  }
}

/**
 * Desactiva un administrador (no lo elimina)
 */
export async function deactivateAdmin(req: Request, res: Response) {
  try {
    const adminId = parseInt(req.params.id);
    
    if (isNaN(adminId)) {
      return res.status(400).json({ message: 'ID de administrador no válido' });
    }
    
    // Obtener el administrador a desactivar
    const adminToDeactivate = await storage.getUser(adminId);
    
    if (!adminToDeactivate) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }
    
    // Verificar si el usuario actual puede gestionar al administrador objetivo
    if (!canManageUser(req.user, adminToDeactivate)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para desactivar este administrador' 
      });
    }
    
    // Impedir que un administrador se desactive a sí mismo
    if (req.user.id === adminId) {
      return res.status(400).json({ 
        message: 'No puedes desactivar tu propia cuenta' 
      });
    }
    
    // Desactivar el administrador
    const updatedAdmin = await storage.updateUser(adminId, { isActive: false });
    
    if (!updatedAdmin) {
      return res.status(500).json({ message: 'Error al desactivar administrador' });
    }
    
    // Ocultar la contraseña en la respuesta
    const { password, ...safeAdmin } = updatedAdmin;
    
    return res.json({
      ...safeAdmin,
      message: 'Administrador desactivado correctamente'
    });
  } catch (error: any) {
    console.error('Error al desactivar administrador:', error);
    return res.status(500).json({ message: 'Error al desactivar administrador' });
  }
}

/**
 * Reactiva un administrador previamente desactivado
 */
export async function reactivateAdmin(req: Request, res: Response) {
  try {
    const adminId = parseInt(req.params.id);
    
    if (isNaN(adminId)) {
      return res.status(400).json({ message: 'ID de administrador no válido' });
    }
    
    // Obtener el administrador a reactivar
    const adminToReactivate = await storage.getUser(adminId);
    
    if (!adminToReactivate) {
      return res.status(404).json({ message: 'Administrador no encontrado' });
    }
    
    // Verificar si el usuario actual puede gestionar al administrador objetivo
    if (!canManageUser(req.user, adminToReactivate)) {
      return res.status(403).json({ 
        message: 'No tienes permisos para reactivar este administrador' 
      });
    }
    
    // Reactivar el administrador
    const updatedAdmin = await storage.updateUser(adminId, { isActive: true });
    
    if (!updatedAdmin) {
      return res.status(500).json({ message: 'Error al reactivar administrador' });
    }
    
    // Ocultar la contraseña en la respuesta
    const { password, ...safeAdmin } = updatedAdmin;
    
    return res.json({
      ...safeAdmin,
      message: 'Administrador reactivado correctamente'
    });
  } catch (error: any) {
    console.error('Error al reactivar administrador:', error);
    return res.status(500).json({ message: 'Error al reactivar administrador' });
  }
}

/**
 * Registra las rutas relacionadas con la gestión de administradores
 */
export function registerAdminManagementRoutes(router: any) {
  // Middleware para verificar que el usuario es administrador
  router.use('/admins', (req: Request, res: Response, next: any) => {
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'superadmin')) {
      return res.status(403).json({ 
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    next();
  });
  
  // Rutas de gestión de administradores
  router.get('/admins', getAllAdmins);
  router.post('/admins', createAdmin);
  router.put('/admins/:id', updateAdmin);
  router.put('/admins/:id/deactivate', deactivateAdmin);
  router.put('/admins/:id/reactivate', reactivateAdmin);
}