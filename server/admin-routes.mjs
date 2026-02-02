/**
 * Rutas de administración para la aplicación TOBAIS
 * Incluye endpoints para tareas de mantenimiento y administración del sistema
 */

import express from 'express';
import { cleanupEndpoint, logUnauthorizedAccess } from './db-cleanup.mjs';

// Router para rutas administrativas
const router = express.Router();

/**
 * Middleware para verificar permisos de administrador
 */
function requireAdmin(req, res, next) {
  if (!req.isAuthenticated || !req.user || req.user.role !== 'admin') {
    // Registrar el intento no autorizado
    logUnauthorizedAccess({
      path: req.originalUrl,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
      userId: req.user ? req.user.id : null,
      username: req.user ? req.user.username : null
    });
    
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador.'
    });
  }
  next();
}

// Ruta de verificación de estado del sistema administrativo
router.get('/status', requireAdmin, (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    adminUser: req.user.username,
    message: 'Panel de administración funcionando correctamente'
  });
});

// Ruta de limpieza de base de datos
router.get('/clean', requireAdmin, cleanupEndpoint);

// Ruta de simulación de limpieza (solo para ver qué se eliminaría)
router.get('/clean/simulate', requireAdmin, (req, res, next) => {
  // Forzar el modo simulación
  req.query.dryRun = 'true';
  // Pasar al endpoint normal
  cleanupEndpoint(req, res, next);
});

// Ruta para limpieza completa (incluye usuarios)
router.get('/clean/all', requireAdmin, (req, res, next) => {
  // Configurar para incluir usuarios en la limpieza
  req.query.includeUsers = 'true';
  // Pasar al endpoint normal
  cleanupEndpoint(req, res, next);
});

// Ruta para ver estadísticas de la base de datos
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const { default: Database } = await import('@replit/database');
    const db = new Database();
    
    // Obtener todas las claves
    const allKeys = await db.list();
    
    // Clasificar claves por prefijo
    const stats = {
      total: allKeys.length,
      byPrefix: {}
    };
    
    // Contar claves por su prefijo
    allKeys.forEach(key => {
      const prefix = key.split('_')[0];
      stats.byPrefix[prefix] = (stats.byPrefix[prefix] || 0) + 1;
    });
    
    // Obtener algunos ejemplos de cada tipo
    const examples = {};
    for (const prefix in stats.byPrefix) {
      // Encontrar hasta 3 ejemplos de cada tipo
      const keysOfType = allKeys.filter(k => k.startsWith(`${prefix}_`)).slice(0, 3);
      examples[prefix] = [];
      
      // Para cada ejemplo, obtener la data actual
      for (const key of keysOfType) {
        try {
          const data = await db.get(key);
          // Solo mostrar información básica para seguridad
          const safeData = {
            key,
            hasData: !!data,
            hasCreatedAt: data && !!data.createdAt,
            createdAt: data && data.createdAt ? new Date(data.createdAt).toISOString() : null,
            hasLastLogin: data && !!data.lastLogin,
            lastLogin: data && data.lastLogin ? new Date(data.lastLogin).toISOString() : null,
          };
          examples[prefix].push(safeData);
        } catch (error) {
          examples[prefix].push({
            key,
            error: `Error al obtener datos: ${error.message}`
          });
        }
      }
    }
    
    res.json({
      success: true,
      stats,
      examples,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Error al obtener estadísticas: ${error.message}`
    });
  }
});

export default router;