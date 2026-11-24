-- Invix — Datos de prueba del MVP SaaS.
-- Ejecutar después de schema.sql. Se puede ejecutar varias veces.

BEGIN;

INSERT INTO planes (codigo, nombre, descripcion, max_usuarios, max_productos, permite_imagenes, precio_mensual)
VALUES
    ('BASICO', 'Plan Básico', 'Productos, stock y auditoría básica.', 1, 50, FALSE, 29900),
    ('PROFESIONAL', 'Plan Profesional', 'Fotos, catálogo ampliado y auditoría completa.', 1, 500, TRUE, 79900),
    ('EMPRESARIAL', 'Plan Empresarial', 'Catálogo ilimitado y todas las funciones.', 1, NULL, TRUE, 159900)
ON CONFLICT (codigo) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    max_usuarios = EXCLUDED.max_usuarios,
    max_productos = EXCLUDED.max_productos,
    permite_imagenes = EXCLUDED.permite_imagenes,
    precio_mensual = EXCLUDED.precio_mensual,
    activo = TRUE;

INSERT INTO empresas (nombre)
SELECT 'Empresa Demo Invix'
WHERE NOT EXISTS (SELECT 1 FROM empresas WHERE nombre = 'Empresa Demo Invix');

INSERT INTO suscripciones (empresa_id, plan_id)
SELECT e.id, p.id
FROM empresas e
JOIN planes p ON p.codigo = 'BASICO'
WHERE e.nombre = 'Empresa Demo Invix'
  AND NOT EXISTS (
      SELECT 1 FROM suscripciones s
      WHERE s.empresa_id = e.id AND s.estado = 'ACTIVA'
  );

INSERT INTO usuarios (nombre, email, password_hash, rol, empresa_id)
VALUES
    ('Administrador Invix', 'admin@invix.com',
     '$2b$10$UNyJGdA.yDmB9bfjE.Npl.EPA0Us3ntSVM9XbaEiGCjVukEeptYw6',
     'ADMIN', (SELECT id FROM empresas WHERE nombre = 'Empresa Demo Invix' LIMIT 1))
ON CONFLICT (lower(email)) DO NOTHING;

COMMIT;
