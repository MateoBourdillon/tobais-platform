-- Migración para actualizar la estructura de la tabla de usuarios
-- Eliminar referencias a los usuarios en otras tablas primero

-- 1. Actualizar columnas en la tabla de usuarios
ALTER TABLE "users" 
  -- Primero asegurar que las columnas firstName y lastName existen y tienen valores
  ALTER COLUMN "first_name" SET NOT NULL,
  ALTER COLUMN "last_name" SET NOT NULL,
  -- Eliminar la columna full_name (ya que ahora usamos first_name y last_name)
  DROP COLUMN IF EXISTS "full_name",
  -- Establecer valores predeterminados para otras columnas opcionales
  ALTER COLUMN "permissions" SET DEFAULT '{}'::jsonb;

-- 2. Nota: No se eliminarán registros aquí ya que se manejará mediante el script de limpieza