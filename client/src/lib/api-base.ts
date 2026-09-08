/**
 * Reescritura de las llamadas a la API cuando el frontend y el backend viven en
 * dominios distintos (frontend estático en Hostinger, backend Node en Render).
 *
 * Todo el código de la app llama a rutas relativas ("/api/..."), que en Replit
 * resolvían contra el mismo origen. Al separar los despliegues hay que apuntar
 * esas llamadas al backend y mandar la cookie de sesión en cada petición.
 *
 * Se parchea `fetch` en un único punto en lugar de tocar los ~28 sitios de
 * llamada y las queryKeys de react-query, que también son rutas "/api/...".
 *
 * Si VITE_API_URL está vacío (desarrollo local o despliegue en un solo
 * dominio) no se hace nada y todo sigue funcionando como antes.
 */

declare global {
  interface Window {
    TOBAIS_API_URL?: string;
  }
}

// Prioridad: config.js del servidor (editable en hPanel sin recompilar) y,
// si no está, la variable de compilación. Vacío = mismo origen, como en local.
const RAW_BASE = window.TOBAIS_API_URL || import.meta.env.VITE_API_URL || "";

// Sin barra final, para no generar "//api/..." al concatenar.
export const API_BASE = RAW_BASE.replace(/\/+$/, "");

/** Convierte "/api/login" en "https://backend.onrender.com/api/login". */
export function apiUrl(path: string): string {
  if (!API_BASE) return path;
  return path.startsWith("/api/") || path === "/api" ? API_BASE + path : path;
}

if (API_BASE) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    // Solo interceptamos strings relativos que empiezan por /api.
    // Las URLs absolutas (Stripe, PayPal, Retell, etc.) pasan intactas.
    if (typeof input === "string" && input.startsWith("/api")) {
      return originalFetch(apiUrl(input), {
        ...init,
        // La sesión viaja en cookie: sin esto el login no persiste entre dominios.
        credentials: init?.credentials ?? "include",
      });
    }

    if (input instanceof Request && input.url.startsWith(window.location.origin + "/api")) {
      const rewritten = apiUrl(input.url.slice(window.location.origin.length));
      return originalFetch(new Request(rewritten, input), {
        ...init,
        credentials: init?.credentials ?? "include",
      });
    }

    return originalFetch(input as RequestInfo, init);
  }) as typeof window.fetch;
}
