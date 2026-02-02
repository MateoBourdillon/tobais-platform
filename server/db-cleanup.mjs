import Database from '@replit/database';
const db = new Database();

/**
 * Script de limpieza automática para datos almacenados en Replit DB
 * 
 * Este script realiza las siguientes operaciones:
 * 1. Elimina posts con más de 30 días de antigüedad
 * 2. Opcionalmente, elimina usuarios inactivos por más de 6 meses
 * 3. Genera estadísticas y registros detallados del proceso
 */

// Configuración
const CONFIG = {
  POST_RETENTION_DAYS: 30,       // Días de retención para posts
  USER_INACTIVITY_MONTHS: 6,     // Meses de inactividad para considerar eliminar usuarios
  DRY_RUN: false,                // Si es true, solo simula las operaciones sin eliminar
  INCLUDE_USER_CLEANUP: false,   // Si es true, incluye la limpieza de usuarios inactivos
  LOG_DETAILS: true,             // Habilitar logging detallado
  BULK_SIZE: 50                  // Número de operaciones a procesar en cada lote
};

// Estadísticas para trackear operaciones
const stats = {
  postsScanned: 0,
  postsDeleted: 0,
  postsError: 0,
  postsRetained: 0,
  userScanned: 0,
  usersDeleted: 0,
  usersError: 0,
  usersRetained: 0,
  startTime: null,
  endTime: null,
  totalTimeMs: 0
};

// Registros de errores
const errors = [];

/**
 * Verifica si una fecha ISO es anterior a X días desde ahora
 * @param {string} dateStr - Fecha en formato ISO
 * @param {number} days - Número de días
 * @returns {boolean} true si la fecha es más antigua que el número de días
 */
function isOlderThanDays(dateStr, days) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false; // Fecha inválida
    }
    
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    return diffDays > days;
  } catch (error) {
    console.error(`Error al verificar antigüedad de la fecha: ${error.message}`);
    return false;
  }
}

/**
 * Verifica si una fecha ISO es anterior a X meses desde ahora
 * @param {string} dateStr - Fecha en formato ISO
 * @param {number} months - Número de meses
 * @returns {boolean} true si la fecha es más antigua que el número de meses
 */
function isOlderThanMonths(dateStr, months) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return false; // Fecha inválida
    }
    
    const now = new Date();
    // Calculamos diferencia en meses
    const diffMonths = (now.getFullYear() - date.getFullYear()) * 12 + 
                       now.getMonth() - date.getMonth();
    
    return diffMonths > months;
  } catch (error) {
    console.error(`Error al verificar antigüedad en meses: ${error.message}`);
    return false;
  }
}

/**
 * Procesa un lote de claves para limpiar
 * @param {Array<string>} keys - Lista de claves a procesar
 * @param {string} type - Tipo de elementos ('post' o 'user')
 * @returns {Promise<void>}
 */
async function processBatch(keys, type) {
  for (const key of keys) {
    try {
      const item = await db.get(key);
      
      // Ignorar elementos null o undefined
      if (!item) {
        if (CONFIG.LOG_DETAILS) {
          console.log(`${type === 'post' ? 'Post' : 'Usuario'} ${key} no encontrado o valor nulo`);
        }
        continue;
      }
      
      // Aumentar contador de escaneo
      if (type === 'post') {
        stats.postsScanned++;
      } else {
        stats.userScanned++;
      }
      
      // Para posts, verificar createdAt
      if (type === 'post') {
        if (!item.createdAt) {
          if (CONFIG.LOG_DETAILS) {
            console.log(`Post ${key} no tiene campo createdAt, se omite`);
          }
          continue;
        }
        
        if (isOlderThanDays(item.createdAt, CONFIG.POST_RETENTION_DAYS)) {
          if (!CONFIG.DRY_RUN) {
            await db.delete(key);
            stats.postsDeleted++;
            if (CONFIG.LOG_DETAILS) {
              console.log(`Post eliminado: ${key} (creado el ${item.createdAt})`);
            }
          } else {
            stats.postsDeleted++;
            if (CONFIG.LOG_DETAILS) {
              console.log(`[SIMULACIÓN] Post que sería eliminado: ${key} (creado el ${item.createdAt})`);
            }
          }
        } else {
          stats.postsRetained++;
          if (CONFIG.LOG_DETAILS) {
            console.log(`Post retenido: ${key} (creado el ${item.createdAt})`);
          }
        }
      }
      
      // Para usuarios, verificar lastLogin o createdAt
      if (type === 'user' && CONFIG.INCLUDE_USER_CLEANUP) {
        const lastActivity = item.lastLogin || item.createdAt;
        
        if (!lastActivity) {
          if (CONFIG.LOG_DETAILS) {
            console.log(`Usuario ${key} no tiene campos lastLogin ni createdAt, se omite`);
          }
          continue;
        }
        
        if (isOlderThanMonths(lastActivity, CONFIG.USER_INACTIVITY_MONTHS)) {
          if (!CONFIG.DRY_RUN) {
            await db.delete(key);
            stats.usersDeleted++;
            if (CONFIG.LOG_DETAILS) {
              console.log(`Usuario eliminado: ${key} (última actividad: ${lastActivity})`);
            }
          } else {
            stats.usersDeleted++;
            if (CONFIG.LOG_DETAILS) {
              console.log(`[SIMULACIÓN] Usuario que sería eliminado: ${key} (última actividad: ${lastActivity})`);
            }
          }
        } else {
          stats.usersRetained++;
          if (CONFIG.LOG_DETAILS) {
            console.log(`Usuario retenido: ${key} (última actividad: ${lastActivity})`);
          }
        }
      }
    } catch (error) {
      const errorMessage = `Error al procesar ${type === 'post' ? 'post' : 'usuario'} ${key}: ${error.message}`;
      console.error(errorMessage);
      errors.push(errorMessage);
      
      if (type === 'post') {
        stats.postsError++;
      } else {
        stats.usersError++;
      }
    }
  }
}

/**
 * Divide un array en lotes de tamaño específico
 * @param {Array} array - Array a dividir
 * @param {number} batchSize - Tamaño de cada lote
 * @returns {Array<Array>} Array de lotes
 */
function chunkArray(array, batchSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += batchSize) {
    chunks.push(array.slice(i, i + batchSize));
  }
  return chunks;
}

/**
 * Registra intentos de acceso no autorizados a funciones administrativas
 * @param {Object} info - Información sobre el intento 
 */
function logUnauthorizedAccess(info) {
  console.warn('⚠️ ALERTA DE SEGURIDAD: Intento de acceso no autorizado a función administrativa', {
    ...info,
    timestamp: new Date().toISOString()
  });
  
  // Aquí se podría implementar lógica adicional como:
  // - Enviar alertas por email a administradores
  // - Incrementar contadores para bloqueo temporal de IPs
  // - Registrar en tabla especial de la base de datos
}

/**
 * Función principal para ejecutar la limpieza
 * @param {Object} options - Opciones para sobreescribir la configuración
 * @returns {Promise<Object>} - Estadísticas de la limpieza
 */
async function runCleanup(options = {}) {
  // Aplicar opciones personalizadas
  Object.assign(CONFIG, options);
  
  console.log('Iniciando limpieza con la siguiente configuración:');
  console.log(JSON.stringify(CONFIG, null, 2));
  
  stats.startTime = new Date();
  
  try {
    // Obtener todas las claves
    const allKeys = await db.list();
    console.log(`Total de claves en la base de datos: ${allKeys.length}`);
    
    // Filtrar por tipos
    const postKeys = allKeys.filter(key => key.startsWith('post_'));
    const userKeys = allKeys.filter(key => key.startsWith('user_'));
    
    console.log(`Encontrados ${postKeys.length} posts y ${userKeys.length} usuarios`);
    
    // Procesar posts en lotes
    const postBatches = chunkArray(postKeys, CONFIG.BULK_SIZE);
    console.log(`Procesando ${postBatches.length} lotes de posts...`);
    
    for (let i = 0; i < postBatches.length; i++) {
      console.log(`Procesando lote de posts ${i+1}/${postBatches.length}...`);
      await processBatch(postBatches[i], 'post');
    }
    
    // Procesar usuarios en lotes (si está habilitado)
    if (CONFIG.INCLUDE_USER_CLEANUP) {
      const userBatches = chunkArray(userKeys, CONFIG.BULK_SIZE);
      console.log(`Procesando ${userBatches.length} lotes de usuarios...`);
      
      for (let i = 0; i < userBatches.length; i++) {
        console.log(`Procesando lote de usuarios ${i+1}/${userBatches.length}...`);
        await processBatch(userBatches[i], 'user');
      }
    }
  } catch (error) {
    console.error(`Error general durante la limpieza: ${error.message}`);
    errors.push(`Error general: ${error.message}`);
  }
  
  stats.endTime = new Date();
  stats.totalTimeMs = stats.endTime - stats.startTime;
  
  const result = {
    stats,
    errors,
    configuration: CONFIG,
    summary: `Limpieza ${CONFIG.DRY_RUN ? 'simulada' : 'ejecutada'} en ${stats.totalTimeMs / 1000} segundos. ` +
            `Posts: ${stats.postsDeleted} eliminados, ${stats.postsRetained} retenidos, ${stats.postsError} errores. ` +
            (CONFIG.INCLUDE_USER_CLEANUP ? `Usuarios: ${stats.usersDeleted} eliminados, ${stats.usersRetained} retenidos, ${stats.usersError} errores.` : '')
  };
  
  console.log('\nRESUMEN DE LIMPIEZA:');
  console.log(result.summary);
  console.log(`Total errores: ${errors.length}`);
  
  return result;
}

/**
 * Implementación de endpoint HTTP para ejecutar la limpieza
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} res - Objeto de respuesta Express
 */
async function cleanupEndpoint(req, res) {
  try {
    // Verificar autorización (asumiendo que req.user tiene información de autenticación)
    if (!req.isAuthenticated || !req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador.'
      });
    }
    
    // Obtener opciones de los parámetros de la consulta
    const options = {
      DRY_RUN: req.query.dryRun === 'true',
      INCLUDE_USER_CLEANUP: req.query.includeUsers === 'true',
      LOG_DETAILS: req.query.logDetails !== 'false'
    };
    
    if (req.query.days && !isNaN(parseInt(req.query.days))) {
      options.POST_RETENTION_DAYS = parseInt(req.query.days);
    }
    
    if (req.query.months && !isNaN(parseInt(req.query.months))) {
      options.USER_INACTIVITY_MONTHS = parseInt(req.query.months);
    }
    
    console.log('Ejecutando limpieza desde endpoint con opciones:', options);
    
    const result = await runCleanup(options);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error al ejecutar endpoint de limpieza:', error);
    res.status(500).json({
      success: false,
      message: `Error: ${error.message}`
    });
  }
}

// Exportar funciones para su uso en la aplicación
export {
  runCleanup,
  cleanupEndpoint,
  logUnauthorizedAccess
};

// Si se ejecuta directamente, realizar limpieza con configuración predeterminada
// En ESM no podemos usar require.main, usamos import.meta.url
if (process.argv[1] === import.meta.url) {
  console.log('Ejecutando script de limpieza directamente...');
  runCleanup().then(() => {
    console.log('Limpieza completada.');
    process.exit(0);
  }).catch(error => {
    console.error('Error fatal durante la limpieza:', error);
    process.exit(1);
  });
}