-- Módulos operativos multiempresa. Ejecutar una sola vez sobre una base SaaS existente.
BEGIN;

CREATE TABLE IF NOT EXISTS productos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nombre VARCHAR(150) NOT NULL,
    sku VARCHAR(80),
    stock INTEGER NOT NULL DEFAULT 0,
    precio NUMERIC(12,2) NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_productos_nombre CHECK (length(btrim(nombre)) > 0),
    CONSTRAINT ck_productos_stock CHECK (stock >= 0),
    CONSTRAINT ck_productos_precio CHECK (precio >= 0)
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_productos_empresa_sku
    ON productos(empresa_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id, activo);

CREATE TABLE IF NOT EXISTS auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(40) NOT NULL,
    entidad VARCHAR(40) NOT NULL,
    entidad_id BIGINT,
    detalle JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auditoria_empresa_fecha ON auditoria(empresa_id, creado_en DESC);

ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS ck_usuarios_rol;
ALTER TABLE usuarios ALTER COLUMN rol TYPE VARCHAR(20);
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_rol
    CHECK (rol IN ('CLIENTE', 'ADMIN', 'JEFE_GESTION', 'AYUDANTE'));

CREATE TABLE IF NOT EXISTS invitaciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    rol VARCHAR(20) NOT NULL,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expira_en TIMESTAMPTZ NOT NULL,
    aceptada_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_invitaciones_rol CHECK (rol IN ('JEFE_GESTION', 'AYUDANTE')),
    CONSTRAINT ck_invitaciones_email CHECK (position('@' IN email) > 1)
);
CREATE INDEX IF NOT EXISTS idx_invitaciones_empresa ON invitaciones(empresa_id, creado_en DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uq_invitaciones_empresa_email_pendiente
    ON invitaciones(empresa_id, lower(email)) WHERE aceptada_en IS NULL;

DROP TABLE IF EXISTS sensores CASCADE;

COMMIT;
