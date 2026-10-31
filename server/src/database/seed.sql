-- =====================================================================
-- Invix — Datos de prueba (solo desarrollo)
--
-- Ejecutar DESPUÉS de schema.sql. Se puede correr varias veces sin duplicar
-- datos (ON CONFLICT DO NOTHING).
--
-- Credenciales de prueba (los hashes son bcrypt, nunca la clave en claro):
--   ADMIN    admin@invix.com     /  Admin123!
--   CLIENTE  cliente@invix.com   /  Cliente123!
-- =====================================================================

BEGIN;

INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES
    ('Administrador Invix', 'admin@invix.com',
     '$2b$10$UNyJGdA.yDmB9bfjE.Npl.EPA0Us3ntSVM9XbaEiGCjVukEeptYw6', 'ADMIN'),
    ('Cliente de Prueba', 'cliente@invix.com',
     '$2b$10$ZboE3fPhTj3saqd/7MdJpe4Cfqn1fwfMv8mF4c2pwjaekbmLvKEdS', 'CLIENTE')
     
ON CONFLICT (lower(email)) DO NOTHING;

-- Los dos últimos productos están en/por debajo del stock mínimo,
-- para poder probar la alerta de stock bajo (US-04).
INSERT INTO productos (sku, nombre, descripcion, precio, stock, stock_minimo) VALUES
    ('TEC-001', 'Teclado mecánico',  'Teclado mecánico retroiluminado, switches rojos', 189000.00, 25, 5),
    ('MOU-001', 'Mouse inalámbrico', 'Mouse ergonómico 2.4 GHz, 1600 DPI',               59000.00, 40, 10),
    ('MON-001', 'Monitor 24"',       'Monitor Full HD IPS de 24 pulgadas',              649000.00, 12, 3),
    ('CAM-001', 'Cámara web HD',     'Cámara web 1080p con micrófono integrado',        129000.00,  4, 5),
    ('AUD-001', 'Audífonos gamer',   'Audífonos con micrófono y sonido envolvente',      99000.00,  2, 3)
ON CONFLICT (sku) DO NOTHING;

COMMIT;
