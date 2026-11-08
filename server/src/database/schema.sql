-- Invix — Esquema PostgreSQL del MVP SaaS.
-- Invix ofrece planes de suscripción y acceso a la plataforma.

BEGIN;

CREATE TABLE empresas (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_empresas_nombre CHECK (length(btrim(nombre)) > 0)
);

CREATE TABLE planes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo VARCHAR(30) NOT NULL UNIQUE,
    nombre VARCHAR(80) NOT NULL,
    descripcion TEXT,
    max_usuarios INTEGER,
    precio_mensual NUMERIC(12,2) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT ck_planes_precio CHECK (precio_mensual >= 0),
    CONSTRAINT ck_planes_max_usuarios CHECK (max_usuarios IS NULL OR max_usuarios > 0)
);

CREATE TABLE suscripciones (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE CASCADE,
    plan_id BIGINT NOT NULL REFERENCES planes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    estado VARCHAR(20) NOT NULL DEFAULT 'ACTIVA',
    inicia_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    termina_en TIMESTAMPTZ,
    CONSTRAINT ck_suscripciones_estado CHECK (estado IN ('ACTIVA', 'PAUSADA', 'CANCELADA'))
);

CREATE INDEX idx_suscripciones_empresa ON suscripciones(empresa_id, estado);

CREATE TABLE usuarios (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(10) NOT NULL DEFAULT 'CLIENTE',
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('CLIENTE', 'ADMIN')),
    CONSTRAINT ck_usuarios_email CHECK (position('@' IN email) > 1),
    CONSTRAINT ck_usuarios_nombre CHECK (length(btrim(nombre)) > 0)
);

CREATE UNIQUE INDEX uq_usuarios_email_lower ON usuarios(lower(email));
CREATE INDEX idx_usuarios_empresa ON usuarios(empresa_id);

CREATE TABLE productos (
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
CREATE UNIQUE INDEX uq_productos_empresa_sku ON productos(empresa_id, sku) WHERE sku IS NOT NULL;
CREATE INDEX idx_productos_empresa ON productos(empresa_id, activo);

CREATE TABLE auditoria (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    empresa_id BIGINT NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    usuario_id BIGINT REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(40) NOT NULL,
    entidad VARCHAR(40) NOT NULL,
    entidad_id BIGINT,
    detalle JSONB NOT NULL DEFAULT '{}'::jsonb,
    creado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_empresa_fecha ON auditoria(empresa_id, creado_en DESC);

COMMIT;
