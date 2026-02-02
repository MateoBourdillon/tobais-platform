import express from 'express';
import Client from '@replit/database';
import { Express } from 'express';

// Configuración
const POST_EXPIRATION_DAYS = 30;
const USER_INACTIVITY_MONTHS = 6;

/**
 * Comprueba si una fecha ISO string es anterior a un número específico de días
 * @param dateStr La fecha en formato ISO string
 * @param days El número de días para comparar
 * @returns true si la fecha es anterior al número de días especificado
 */
function isOlderThan(dateStr: string, days: number): boolean {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false; // Fecha inválida
    }
    
    const now = new Date();
    const differenceInTime = now.getTime() - date.getTime();
    const differenceInDays = differenceInTime / (1000 * 3600 * 24);
    
    return differenceInDays > days;
  } catch (error) {
    console.error('Error al procesar la fecha:', error);
    return false;
  }
}

/**
 * Comprueba si una fecha ISO string es anterior a un número específico de meses
 * @param dateStr La fecha en formato ISO string
 * @param months El número de meses para comparar
 * @returns true si la fecha es anterior al número de meses especificado
 */
function isOlderThanMonths(dateStr: string, months: number): boolean {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false; // Fecha inválida
    }
    
    const now = new Date();
    // Calculamos la diferencia en meses
    const differenceInMonths = 
      (now.getFullYear() - date.getFullYear()) * 12 + 
      (now.getMonth() - date.getMonth());
    
    return differenceInMonths > months;
  } catch (error) {
    console.error('Error al procesar la fecha:', error);
    return false;
  }
}

/**
 * Función principal para limpiar la base de datos
 * @param includeUsers Si true, también elimina usuarios inactivos
 * @returns Un objeto con estadísticas de la limpieza
 */
async function cleanupDatabase(includeUsers = false): Promise<{
  postsDeleted: number;
  usersDeleted: number;
  errors: string[];
}> {
  const db = new Client();
  const stats = {
    postsDeleted: 0,
    usersDeleted: 0,
    errors: [] as string[]
  };
  
  try {
    // Obtener todas las claves de la base de datos
    const keys = await db.list();
    
    // 1. Procesar y eliminar posts antiguos
    const postKeys = keys.filter(key => key.startsWith('post_'));
    console.log(`Encontrados ${postKeys.length} posts para analizar`);
    
    for (const key of postKeys) {
      try {
        const post = await db.get(key);
        
        // Comprobamos si el post tiene fecha de creación y si es válida
        if (post && post.createdAt && typeof post.createdAt === 'string') {
          if (isOlderThan(post.createdAt, POST_EXPIRATION_DAYS)) {
            await db.delete(key);
            stats.postsDeleted++;
            console.log(`Post eliminado: ${key}`);
          }
        } else {
          stats.errors.push(`Post sin fecha válida: ${key}`);
        }
      } catch (error) {
        console.error(`Error al procesar el post ${key}:`, error);
        stats.errors.push(`Error al procesar el post ${key}: ${error.message}`);
      }
    }
    
    // 2. Procesar y eliminar usuarios inactivos (si se especifica)
    if (includeUsers) {
      const userKeys = keys.filter(key => key.startsWith('user_'));
      console.log(`Encontrados ${userKeys.length} usuarios para analizar`);
      
      for (const key of userKeys) {
        try {
          const user = await db.get(key);
          
          // Verificamos si el usuario tiene lastLogin o, si no, createdAt
          const dateToCheck = user.lastLogin || user.createdAt;
          
          if (dateToCheck && typeof dateToCheck === 'string') {
            if (isOlderThanMonths(dateToCheck, USER_INACTIVITY_MONTHS)) {
              await db.delete(key);
              stats.usersDeleted++;
              console.log(`Usuario eliminado por inactividad: ${key}`);
            }
          } else {
            stats.errors.push(`Usuario sin fecha válida: ${key}`);
          }
        } catch (error) {
          console.error(`Error al procesar el usuario ${key}:`, error);
          stats.errors.push(`Error al procesar el usuario ${key}: ${error.message}`);
        }
      }
    }
    
    return stats;
  } catch (error) {
    console.error('Error general durante la limpieza:', error);
    stats.errors.push(`Error general: ${error.message}`);
    return stats;
  }
}

/**
 * Registra las rutas para la limpieza de la base de datos
 * @param app La aplicación Express
 */
export function registerCleanupRoutes(app: Express) {
  // Ruta para ejecutar la limpieza manualmente (solo posts)
  app.get('/admin/clean', async (req, res) => {
    // Verificar autenticación y rol de administrador
    if (!req.isAuthenticated || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    console.log('Iniciando limpieza de la base de datos (solo posts)...');
    const stats = await cleanupDatabase(false);
    console.log('Limpieza completada:', stats);
    
    res.json({
      success: true,
      message: `Limpieza completada. Se eliminaron ${stats.postsDeleted} posts antiguos.`,
      stats
    });
  });
  
  // Ruta para ejecutar la limpieza completa (posts y usuarios)
  app.get('/admin/clean/all', async (req, res) => {
    // Verificar autenticación y rol de administrador
    if (!req.isAuthenticated || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    console.log('Iniciando limpieza completa de la base de datos (posts y usuarios)...');
    const stats = await cleanupDatabase(true);
    console.log('Limpieza completada:', stats);
    
    res.json({
      success: true,
      message: `Limpieza completada. Se eliminaron ${stats.postsDeleted} posts antiguos y ${stats.usersDeleted} usuarios inactivos.`,
      stats
    });
  });
  
  // Ruta para verificar registros sin eliminar nada (modo simulación)
  app.get('/admin/clean/simulate', async (req, res) => {
    // Verificar autenticación y rol de administrador
    if (!req.isAuthenticated || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Acceso denegado. Se requieren permisos de administrador.' });
    }
    
    const db = new Client();
    const stats = {
      postsToDelete: 0,
      usersToDelete: 0,
      errors: [] as string[]
    };
    
    try {
      const keys = await db.list();
      
      // Contar posts antiguos
      const postKeys = keys.filter(key => key.startsWith('post_'));
      console.log(`Simulación: Encontrados ${postKeys.length} posts para analizar`);
      
      for (const key of postKeys) {
        try {
          const post = await db.get(key);
          if (post && post.createdAt && typeof post.createdAt === 'string') {
            if (isOlderThan(post.createdAt, POST_EXPIRATION_DAYS)) {
              stats.postsToDelete++;
            }
          }
        } catch (error) {
          stats.errors.push(`Error al analizar post ${key}: ${error.message}`);
        }
      }
      
      // Contar usuarios inactivos
      const userKeys = keys.filter(key => key.startsWith('user_'));
      console.log(`Simulación: Encontrados ${userKeys.length} usuarios para analizar`);
      
      for (const key of userKeys) {
        try {
          const user = await db.get(key);
          const dateToCheck = user.lastLogin || user.createdAt;
          
          if (dateToCheck && typeof dateToCheck === 'string') {
            if (isOlderThanMonths(dateToCheck, USER_INACTIVITY_MONTHS)) {
              stats.usersToDelete++;
            }
          }
        } catch (error) {
          stats.errors.push(`Error al analizar usuario ${key}: ${error.message}`);
        }
      }
      
      res.json({
        success: true,
        message: 'Simulación completada.',
        stats,
        configuration: {
          postExpirationDays: POST_EXPIRATION_DAYS,
          userInactivityMonths: USER_INACTIVITY_MONTHS
        }
      });
    } catch (error) {
      console.error('Error durante la simulación:', error);
      res.status(500).json({
        success: false,
        message: `Error: ${error.message}`,
        stats
      });
    }
  });
  
  console.log('Rutas de limpieza de la base de datos registradas.');
}