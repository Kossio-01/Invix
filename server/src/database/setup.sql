-- =====================================================================
-- Invix — Configuración de PostgreSQL: usuario de la aplicación
--
-- La API NO debe conectarse como superusuario `postgres`. Este script crea
-- el rol `invix_user`, con permisos solo para operar datos (no para crear
-- ni borrar tablas).
--
-- Ejecutar DESPUÉS de schema.sql, conectado a la base `invix` como `postgres`
-- (en pgAdmin: clic derecho en la base `invix` > Query Tool).
--
-- ATENCIÓN: la contraseña de abajo es SOLO para desarrollo local.
-- En un despliegue real se debe usar una contraseña propia y secreta.
-- =====================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'invix_user') THEN
        CREATE ROLE invix_user LOGIN PASSWORD 'invix_dev_local';
    END IF;
END
$$;

GRANT CONNECT ON DATABASE invix TO invix_user;
GRANT USAGE ON SCHEMA public TO invix_user;

-- Permisos sobre las tablas existentes (CRUD, sin DDL)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO invix_user;
-- Las columnas IDENTITY usan secuencias internas
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO invix_user;

-- Permisos automáticos para tablas que se creen más adelante
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO invix_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT USAGE, SELECT ON SEQUENCES TO invix_user;
