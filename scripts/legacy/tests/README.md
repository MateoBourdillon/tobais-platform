# Scripts de Prueba (Legacy)

Este directorio contiene scripts de prueba que fueron utilizados durante el desarrollo del proyecto pero que ahora están obsoletos o se han incorporado en un sistema de pruebas más estructurado.

## Archivos Incluidos

### `test-endpoints.js` y `test-endpoints.cjs`

Estos scripts fueron utilizados para probar los endpoints de API, específicamente:

- Autenticación (login)
- Generación de contenido para redes sociales (`/api/social-media/generate`)

> ⚠️ **ADVERTENCIA**: Estos scripts contienen credenciales hardcodeadas y no deben usarse en entornos de producción. Utilice variables de entorno o solicite credenciales al usuario.

## Uso

Estos scripts se conservan únicamente con fines de referencia y no deben usarse en el flujo de trabajo actual. Si necesita probar endpoints, considere:

1. Utilizar herramientas como Postman o Insomnia
2. Implementar pruebas automatizadas con Jest u otro framework de pruebas
3. Crear nuevos scripts que sigan las mejores prácticas de seguridad y configuración

## Migración

Para migrar estos scripts a una solución más segura y mantenible:

1. Elimine las credenciales hardcodeadas
2. Implemente manejo de errores adecuado
3. Use variables de entorno para la configuración
4. Considere integrarlos en un framework de pruebas automatizadas