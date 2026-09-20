-- =====================================================================
-- Invix — Esquema de base de datos (PostgreSQL 12+)
-- Módulos: usuarios, inventario (productos), pedidos y archivos.
--
-- Persistencia dual:
--   * Base de datos  -> metadatos del archivo (tabla `archivos`).
--   * Almacenamiento -> el binario vive fuera de la BD (disco / S3 / etc.)
--                       y se referencia por `ruta_almacenamiento`.
--
-- Decisión de diseño: NO hay triggers. Todo cambio (actualizado_en,
-- stock, total del pedido) lo hace la aplicación de forma explícita,
-- dentro de una transacción.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. USUARIOS
-- ---------------------------------------------------------------------
CREATE TABLE usuarios (
                          id              BIGINT GENERATED ALWAYS AS IDENTITY,
                          nombre          VARCHAR(100)  NOT NULL,
                          email           VARCHAR(255)  NOT NULL,
                          password_hash   VARCHAR(255)  NOT NULL,           -- nunca la contraseña en claro
                          rol             VARCHAR(10)   NOT NULL DEFAULT 'CLIENTE',
                          activo          BOOLEAN       NOT NULL DEFAULT TRUE,
                          creado_en       TIMESTAMPTZ   NOT NULL DEFAULT now(),
                          actualizado_en  TIMESTAMPTZ   NOT NULL DEFAULT now(),

                          CONSTRAINT pk_usuarios        PRIMARY KEY (id),
                          CONSTRAINT ck_usuarios_rol    CHECK (rol IN ('CLIENTE', 'ADMIN')),
                          CONSTRAINT ck_usuarios_email  CHECK (position('@' IN email) > 1),
                          CONSTRAINT ck_usuarios_nombre CHECK (length(btrim(nombre)) > 0)
);

-- Email único sin distinguir mayúsculas/minúsculas
CREATE UNIQUE INDEX uq_usuarios_email_lower ON usuarios (lower(email));
CREATE INDEX idx_usuarios_rol ON usuarios (rol);

-- ---------------------------------------------------------------------
-- 2. PRODUCTOS
-- ---------------------------------------------------------------------
CREATE TABLE productos (
                           id              BIGINT GENERATED ALWAYS AS IDENTITY,
                           sku             VARCHAR(50)    NOT NULL,
                           nombre          VARCHAR(150)   NOT NULL,
                           descripcion     TEXT,
                           precio          NUMERIC(12,2)  NOT NULL,
                           stock           INTEGER        NOT NULL DEFAULT 0,
                           stock_minimo    INTEGER        NOT NULL DEFAULT 0,  -- umbral de alerta de inventario
                           activo          BOOLEAN        NOT NULL DEFAULT TRUE, -- baja lógica (no se borra si tiene pedidos)
                           creado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),
                           actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT now(),

                           CONSTRAINT pk_productos        PRIMARY KEY (id),
                           CONSTRAINT uq_productos_sku    UNIQUE (sku),
                           CONSTRAINT ck_productos_precio CHECK (precio >= 0),
                           CONSTRAINT ck_productos_stock  CHECK (stock >= 0),
                           CONSTRAINT ck_productos_stock_minimo CHECK (stock_minimo >= 0)
);

CREATE INDEX idx_productos_nombre ON productos (nombre);
CREATE INDEX idx_productos_activo ON productos (activo);
-- Consulta típica de inventario: productos activos con stock bajo
CREATE INDEX idx_productos_stock_bajo ON productos (stock)
    WHERE activo AND stock <= 10;

-- ---------------------------------------------------------------------
-- 3. PEDIDOS
-- ---------------------------------------------------------------------
CREATE TABLE pedidos (
                         id              BIGINT GENERATED ALWAYS AS IDENTITY,
                         usuario_id      BIGINT         NOT NULL,
                         estado          VARCHAR(15)    NOT NULL DEFAULT 'PENDIENTE',
                         total           NUMERIC(14,2)  NOT NULL DEFAULT 0,
                         direccion_envio VARCHAR(255),
                         notas           TEXT,
                         creado_en       TIMESTAMPTZ    NOT NULL DEFAULT now(),
                         actualizado_en  TIMESTAMPTZ    NOT NULL DEFAULT now(),

                         CONSTRAINT pk_pedidos         PRIMARY KEY (id),
                         CONSTRAINT fk_pedidos_usuario FOREIGN KEY (usuario_id)
                             REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
                         CONSTRAINT ck_pedidos_estado  CHECK (estado IN
                                                              ('PENDIENTE', 'CONFIRMADO', 'ENVIADO', 'ENTREGADO', 'CANCELADO')),
                         CONSTRAINT ck_pedidos_total   CHECK (total >= 0)
);

CREATE INDEX idx_pedidos_usuario       ON pedidos (usuario_id, creado_en DESC);
CREATE INDEX idx_pedidos_estado_fecha  ON pedidos (estado, creado_en DESC);

-- ---------------------------------------------------------------------
-- 4. DETALLES_PEDIDO
-- ---------------------------------------------------------------------
CREATE TABLE detalles_pedido (
                                 id              BIGINT GENERATED ALWAYS AS IDENTITY,
                                 pedido_id       BIGINT         NOT NULL,
                                 producto_id     BIGINT         NOT NULL,
                                 cantidad        INTEGER        NOT NULL,
                                 precio_unitario NUMERIC(12,2)  NOT NULL,   -- precio congelado al momento de la compra
                                 subtotal        NUMERIC(14,2)  GENERATED ALWAYS AS (cantidad * precio_unitario) STORED,

                                 CONSTRAINT pk_detalles_pedido  PRIMARY KEY (id),
                                 CONSTRAINT fk_detalles_pedido  FOREIGN KEY (pedido_id)
                                     REFERENCES pedidos (id) ON UPDATE CASCADE ON DELETE CASCADE,
                                 CONSTRAINT fk_detalles_producto FOREIGN KEY (producto_id)
                                     REFERENCES productos (id) ON UPDATE CASCADE ON DELETE RESTRICT,
                                 CONSTRAINT uq_detalles_pedido_producto UNIQUE (pedido_id, producto_id),
                                 CONSTRAINT ck_detalles_cantidad CHECK (cantidad > 0),
                                 CONSTRAINT ck_detalles_precio   CHECK (precio_unitario >= 0)
);

CREATE INDEX idx_detalles_producto ON detalles_pedido (producto_id);

-- ---------------------------------------------------------------------
-- 5. ARCHIVOS  (metadatos de archivos subidos — persistencia dual)
-- ---------------------------------------------------------------------
CREATE TABLE archivos (
                          id                  BIGINT GENERATED ALWAYS AS IDENTITY,
                          usuario_id          BIGINT        NOT NULL,   -- quién lo subió
                          producto_id         BIGINT,                   -- opcional: imagen/ficha de un producto
                          pedido_id           BIGINT,                   -- opcional: comprobante/adjunto de un pedido
                          nombre_original     VARCHAR(255)  NOT NULL,   -- nombre que tenía en el equipo del usuario
                          nombre_almacenado   VARCHAR(255)  NOT NULL,   -- nombre en disco (p. ej. UUID + extensión)
                          ruta_almacenamiento VARCHAR(500)  NOT NULL,   -- ruta relativa o clave del objeto
                          tipo_mime           VARCHAR(100)  NOT NULL,
                          tamano_bytes        BIGINT        NOT NULL,
                          checksum_sha256     CHAR(64),                 -- verificación de integridad
                          subido_en           TIMESTAMPTZ   NOT NULL DEFAULT now(),
                          eliminado_en        TIMESTAMPTZ,              -- baja lógica; el binario se purga aparte

                          CONSTRAINT pk_archivos          PRIMARY KEY (id),
                          CONSTRAINT fk_archivos_usuario  FOREIGN KEY (usuario_id)
                              REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    -- SET NULL: si se elimina el producto/pedido, la metadata sigue existiendo
    -- y permite localizar y limpiar el binario huérfano.
                          CONSTRAINT fk_archivos_producto FOREIGN KEY (producto_id)
                              REFERENCES productos (id) ON UPDATE CASCADE ON DELETE SET NULL,
                          CONSTRAINT fk_archivos_pedido   FOREIGN KEY (pedido_id)
                              REFERENCES pedidos (id) ON UPDATE CASCADE ON DELETE SET NULL,
                          CONSTRAINT uq_archivos_ruta     UNIQUE (ruta_almacenamiento),
                          CONSTRAINT ck_archivos_tamano   CHECK (tamano_bytes > 0),
                          CONSTRAINT ck_archivos_destino  CHECK (producto_id IS NULL OR pedido_id IS NULL),
                          CONSTRAINT ck_archivos_checksum CHECK (checksum_sha256 IS NULL OR checksum_sha256 ~ '^[0-9a-f]{64}$')
    );

CREATE INDEX idx_archivos_usuario  ON archivos (usuario_id);
CREATE INDEX idx_archivos_producto ON archivos (producto_id) WHERE producto_id IS NOT NULL;
CREATE INDEX idx_archivos_pedido   ON archivos (pedido_id)   WHERE pedido_id   IS NOT NULL;
CREATE INDEX idx_archivos_activos  ON archivos (subido_en DESC) WHERE eliminado_en IS NULL;

COMMIT;
