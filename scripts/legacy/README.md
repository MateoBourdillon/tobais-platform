# Scripts Legados (Archivados)

Este directorio contiene scripts que fueron utilizados en etapas anteriores del desarrollo del proyecto pero que ya no son parte del flujo principal de la aplicación. Se mantienen como referencia histórica y están organizados en categorías para facilitar su comprensión.

## Estructura de directorios

- `admin/` - Scripts relacionados con la administración de usuarios y permisos.
- `database/` - Scripts para modificaciones de la estructura de la base de datos.
- `utils/` - Scripts de utilidades generales y configuración.

## Descripción de los scripts

### Facturas
- `check-maryuri-invoices.cjs` - Script para verificar las facturas existentes de Maryuri Alba.
- `create-maryuri-invoice.cjs` - Versión CJS para crear facturas para Maryuri Alba.
- `create-maryuri-invoice.js` - Versión JS para crear facturas para Maryuri Alba.
- `create-maryuri-invoice.mjs` - Versión MJS para crear facturas para Maryuri Alba.
- `create-maryuri-invoices.js` - Script para crear múltiples facturas para Maryuri Alba.
- `create-matoro-final-invoice.cjs` - Script para crear la factura final del proyecto Matoro Bridge Platform.
- `create-matoro-invoices.cjs` - Versión CJS para crear facturas del proyecto Matoro.
- `create-matoro-invoices.js` - Versión JS para crear facturas del proyecto Matoro.
- `create-matoro-project.cjs` - Script para crear el proyecto Matoro Bridge Platform.
- `fix-invoices-query.cjs` - Script para corregir las consultas de facturas en la base de datos.
- `link-maryuri-to-matoro.cjs` - Script para vincular el usuario Maryuri Alba con el proyecto Matoro Bridge Platform.

### Administración (/admin)
- `create-diana-admin.js` - Script para crear la cuenta de administrador para Diana Castro.
- `create-superadmin.cjs` - Versión CJS para crear superadministradores.
- `create-superadmin.js` - Versión JS para crear superadministradores.
- `diana-admin.js` - Script específico para configurar la cuenta de Diana Castro.
- `setup-admin-diana.js` - Script para configurar la cuenta de administrador de Diana Castro.
- `update-admin-level-column.cjs` - Script para actualizar la columna de nivel de administración.
- `update-credentials.cjs` - Script para actualizar credenciales de usuarios.

### Base de Datos (/database)
- `add-permissions-column.cjs` - Script para añadir columna de permisos a usuarios.
- `add-phone-column.cjs` - Script para añadir columna de teléfono a usuarios.
- `check-database.cjs` - Script para verificar la integridad de la base de datos.
- `fix-project-user-relationship.cjs` - Script para corregir la relación entre proyectos y usuarios.
- `update-projects-schema.cjs` - Script para actualizar el esquema de proyectos.
- `migrate-user-columns.cjs` - Script para migrar columnas en la tabla de usuarios.

### Utilidades (/utils)
- `reset-services.js` - Script para reiniciar los servicios de la aplicación.
- `update-services.cjs` - Script para actualizar los servicios ofrecidos.
- `update-social-media.cjs` - Script para actualizar los enlaces de redes sociales.
- `update-maryuri-password.cjs` - Script para actualizar la contraseña de Maryuri Alba.

## Advertencia

Estos scripts contienen operaciones directas en la base de datos y deberían usarse con extrema precaución. Es recomendable no ejecutarlos directamente a menos que sea absolutamente necesario y se comprenda completamente su funcionamiento y posibles efectos secundarios.

La mayoría de esta funcionalidad se ha migrado a la estructura principal de la aplicación con mejores controles y validaciones.