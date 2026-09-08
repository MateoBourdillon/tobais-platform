-- ============================================================
--  Portfolio de TOBAIS — estado real de la base de producción
--  Verificado el 2026-09-08 directamente en Replit.
--
--  RESULTADO: no hay nada que cargar. Los datos ya existen.
--
--    projects      2 filas
--                    id 5  Matoro Bridge Platform   featured = FALSE
--                    id 7  UruDomótica              featured = TRUE
--    testimonials  1 fila
--                    id 1  Maryuri Alba (Matoro Consulting)  approved = TRUE
--
--  Los IDs 5 y 7 coinciden con las galerías codificadas en
--  client/src/pages/project-detail-page.tsx, así que las fichas de
--  detalle mostrarán sus capturas sin tocar nada.
--
--  Que la web muestre "No projects found" NO es un problema de datos:
--  es que public_html/config.js está vacío y no hay backend en Render.
-- ============================================================


-- ------------------------------------------------------------
-- ÚNICO CAMBIO OPCIONAL
--
-- Matoro Bridge tiene featured = FALSE, así que no saldrá en el
-- carrusel de la portada (sí en /projects, que no filtra por ese
-- flag). Si querés que aparezca también en la home, ejecutá esto.
--
-- Puede estar en FALSE a propósito: revisá si tenés permiso del
-- cliente para destacarlo antes de activarlo.
--
-- Requiere desactivar el modo solo lectura en Replit
-- (interruptor "Enable Editing" arriba a la derecha).
-- ------------------------------------------------------------
-- UPDATE projects SET featured = true WHERE id = 5;


-- ------------------------------------------------------------
-- COMPROBACIÓN
-- ------------------------------------------------------------
SELECT id, title, featured, status, image FROM projects ORDER BY id;
SELECT id, name, company, approved FROM testimonials ORDER BY id;
