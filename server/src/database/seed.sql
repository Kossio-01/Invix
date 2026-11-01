-- Invix — Datos de prueba del MVP SaaS.
-- Ejecutar después de schema.sql. Se puede ejecutar varias veces.

BEGIN;

INSERT INTO planes (codigo, nombre, descripcion, max_usuarios, precio_mensual)
VALUES
    ('BASICO', 'Plan Básico', 'Acceso esencial para negocios pequeños.', 1, 29900),
    ('PROFESIONAL', 'Plan Profesional', 'Más usuarios y funciones para equipos en crecimiento.', 5, 79900),
    ('EMPRESARIAL', 'Plan Empresarial', 'Acceso ampliado para empresas grandes.', NULL, 159900)
ON CONFLICT (codigo) DO NOTHING;

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
     'ADMIN', (SELECT id FROM empresas WHERE nombre = 'Empresa Demo Invix' LIMIT 1)),
    ('Cliente de Prueba', 'cliente@invix.com',
     '$2b$10$ZboE3fPhTj3saqd/7MdJpe4Cfqn1fwfMv8mF4c2pwjaekbmLvKEdS',
     'CLIENTE', (SELECT id FROM empresas WHERE nombre = 'Empresa Demo Invix' LIMIT 1))
ON CONFLICT (lower(email)) DO NOTHING;

COMMIT;
