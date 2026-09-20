# Invix — Plataforma Web de Gestión de Inventario y Pedidos
<p align="center">
  <img src="docs/Invix-Logo.svg" alt="Invix Logo" width="280">
</p>

> Proyecto Final · Aplicación Web Full-Stack con Persistencia Dual · Universidad Autónoma de Occidente
> **Estado:** Avance 1 — definición, arquitectura y modelo de datos.
>
> Los campos marcados como **[POR DEFINIR]** dependen de decisiones técnicas del equipo y deben completarse antes de la entrega.

## Tabla de contenido

1. [Definición del problema](#1-definición-del-problema)
2. [Objetivos](#2-objetivos)
3. [Alcance](#3-alcance)
4. [Historias de usuario y reglas de negocio](#4-historias-de-usuario-y-reglas-de-negocio)
5. [Arquitectura](#5-arquitectura)
6. [Modelo de datos](#6-modelo-de-datos)
7. [Persistencia dual](#7-persistencia-dual)
8. [API REST (diseño preliminar)](#8-api-rest-diseño-preliminar)
9. [Requisitos no funcionales](#9-requisitos-no-funcionales)
10. [Estructura del repositorio](#10-estructura-del-repositorio)
11. [Configuración y ejecución](#11-configuración-y-ejecución)
12. [Flujo de trabajo con Git](#12-flujo-de-trabajo-con-git)
13. [Cronograma y estado](#13-cronograma-y-estado)
14. [Equipo](#14-equipo)

---

## 1. Definición del problema

Las pequeñas y medianas empresas que venden productos y controlan su inventario con herramientas desconectadas (hojas de cálculo, mensajería instantánea, correo) no pueden garantizar que el catálogo que ven sus clientes refleje las existencias reales. Esto produce tres problemas concretos:

1. **Ventas sin respaldo de stock:** se aceptan pedidos de productos que ya se agotaron, lo que obliga a cancelar o renegociar con el cliente.
2. **Falta de visibilidad del inventario:** no existe una alerta cuando un producto baja de su nivel mínimo, así que el quiebre se descubre cuando ya ocurrió.
3. **Comprobantes de pago dispersos:** los soportes de pago llegan por canales distintos y no quedan asociados a un pedido específico, lo que impide verificar y auditar cada transacción.

**Invix** centraliza en una sola plataforma web el catálogo, el control de stock, la recepción de pedidos y el archivo de comprobantes, de modo que cada pedido conserve su trazabilidad de principio a fin.

## 2. Objetivos

### Objetivo general

Diseñar, implementar y desplegar una aplicación web full-stack desacoplada (cliente y servidor independientes, comunicados por API REST) que permita a una pyme gestionar su inventario y sus pedidos, con persistencia dual: registros en base de datos y ficheros en almacenamiento, vinculados mediante metadatos.

### Objetivos específicos

| Numero de marcador | Objetivo | Cómo se verifica |
|:-------------------| :-- | :-- |
| OE-1               | **Arquitectura:** separar cliente y servidor mediante una API REST con intercambio JSON. | El frontend solo accede a datos a través de la API; el backend responde con códigos HTTP estándar. |
| OE-2               | **Control de acceso:** implementar registro, login y logout con validación contra la base de datos y rutas públicas/privadas diferenciadas por rol (`ADMIN`, `CLIENTE`). | Una ruta privada redirige al login sin sesión; un `CLIENTE` no puede ejecutar acciones de `ADMIN`. |
| OE-3               | **Consistencia de inventario:** garantizar que el stock nunca sea negativo y que cada pedido lo descuente (o restituya) dentro de una transacción. | Dos pedidos simultáneos por la última unidad: uno se acepta y el otro se rechaza con error controlado. |
| OE-4               | **Persistencia dual:** almacenar cada archivo subido (comprobantes de pago e imágenes de producto) en el sistema de ficheros y sus metadatos (nombre, peso, ruta/URL, fecha, autor) en la base de datos. | Cada archivo tiene un registro en `archivos` y un fichero físico con nombre único; ambos son consultables y descargables. |
| OE-5               | **Experiencia de usuario:** ofrecer una interfaz responsive con estados de carga y mensajes claros ante errores de validación, de red o de servidor. | La interfaz es utilizable en móvil y escritorio, y ningún error de la API queda sin feedback visible. |
| OE-6               | **Buenas prácticas:** trabajar con Git (ramas, commits atómicos, Pull Requests) y documentar el despliegue de forma reproducible. | Historial con aportes de todo el equipo vía PR; README con pasos de arranque local y `.env.example`. |

## 3. Alcance

### Incluye

- **Módulo de autenticación y usuarios:** registro, login, logout, sesión y control de acceso por rol.
- **Módulo de inventario:** creación, edición y baja lógica de productos (precio, stock, stock mínimo), imagen del producto y listado de productos con stock bajo.
- **Módulo de pedidos:** catálogo con carrito, creación de pedidos, historial, seguimiento de estados y carga de comprobante de pago.
- **Gestión de archivos:** subida, consulta y descarga de archivos con persistencia dual.
- **Landing page** pública con presentación del producto y llamados a la acción.

### Roles

| Rol | Permisos |
| :-- | :-- |
| **Visitante** | Ver la landing, registrarse e iniciar sesión. |
| **CLIENTE** | Consultar el catálogo, armar un carrito, crear pedidos, subir comprobantes y ver su propio historial. |
| **ADMIN** | Gestionar productos, ver todos los pedidos y cambiar su estado, consultar alertas de stock. |

> El registro público siempre crea usuarios `CLIENTE`. Las cuentas `ADMIN` se crean con un *seed* de base de datos, nunca desde el formulario público.

### No incluye (fuera de alcance)

Pasarelas de pago en línea, facturación electrónica, gestión de envíos y transportadoras, multi-bodega o multi-sucursal, categorías de productos, historial detallado de movimientos de inventario (kardex) y notificaciones por correo. Estos puntos quedan como **trabajo futuro**.

## 4. Historias de usuario y reglas de negocio

### Historias de usuario

| ID | Como… | Quiero… | Para… | Criterios de aceptación |
| :-- | :-- | :-- | :-- | :-- |
| **US-01** | Visitante | registrarme e iniciar sesión con correo y contraseña | acceder a mi panel y realizar pedidos | El correo tiene formato válido y no está registrado. La contraseña se guarda con *hash* (bcrypt/Argon2), nunca en claro. Un login correcto abre sesión y redirige al panel; uno incorrecto muestra un error sin revelar cuál dato falló. |
| **US-02** | Usuario autenticado | cerrar sesión y que las vistas privadas estén protegidas | proteger mi cuenta | Tras el logout no se puede acceder a rutas privadas, ni escribiendo la URL directa ni recargando la página. Sin sesión, el sistema redirige al login. |
| **US-03** | Administrador | crear, editar y dar de baja productos con SKU, precio, stock y stock mínimo | mantener actualizado el catálogo | Se rechazan precio o stock negativos y SKU repetido (`400`/`409`). La baja es lógica (`activo = false`) y conserva el historial de pedidos. Puede adjuntar una imagen del producto. |
| **US-04** | Administrador | ver los productos cuyo stock está en o por debajo de su mínimo | reponer inventario antes del quiebre | El listado incluye solo productos activos con `stock <= stock_minimo`, ordenados del más crítico al menos crítico. |
| **US-05** | Cliente | consultar el catálogo y agregar productos a un carrito | preparar una compra consolidada | Solo se listan productos activos con stock mayor a cero. No se puede agregar más cantidad que el stock disponible. |
| **US-06** | Cliente | confirmar mi carrito como un pedido | comprar varios productos en una sola operación | El pedido se crea en estado `PENDIENTE` y descuenta el stock en una sola transacción. Si algún producto no alcanza, no se crea nada y se informa cuál falló (`409`). El precio se toma de la base de datos, no del cliente. |
| **US-07** | Cliente | subir un comprobante de pago (PDF o imagen) a un pedido mío | que el administrador pueda verificar mi pago | Solo se aceptan PDF, JPG, PNG o WEBP de hasta 5 MB. El fichero se guarda con nombre único y sus metadatos en `archivos`, asociados al pedido y al autor. Un cliente no puede subir archivos a pedidos ajenos. |
| **US-08** | Administrador | cambiar el estado de un pedido y revisar su comprobante | procesar el despacho | Solo se permiten las transiciones válidas (ver diagrama). Cancelar un pedido restituye el stock. Una transición inválida devuelve `409`. |
| **US-09** | Cliente | ver el historial y el estado de mis pedidos | hacer seguimiento de mis compras | El listado muestra solo los pedidos del usuario autenticado, con su detalle, total y comprobantes. |

### Reglas de negocio

- **RN-01 — Stock no negativo:** el stock nunca puede ser menor a cero; se refuerza con una restricción `CHECK` en la base de datos y con una validación atómica en el backend.
- **RN-02 — Momento del descuento:** el stock se descuenta al **crear** el pedido (reserva) para evitar sobreventa, y se restituye al pasar a `CANCELADO`.
- **RN-03 — Precio congelado:** cada línea del pedido guarda el `precio_unitario` vigente al comprar; cambiar el precio de un producto no altera pedidos anteriores.
- **RN-04 — Baja lógica:** los productos con historial no se eliminan; se desactivan.
- **RN-05 — Lógica explícita:** no se usan *triggers* ni efectos automáticos en la base de datos. El descuento y la restitución de stock, el cálculo del total y la actualización de `actualizado_en` se ejecutan de forma explícita en la capa de servicios del backend, dentro de una transacción.

### Ciclo de vida de un pedido

```mermaid
stateDiagram-v2
    [*] --> PENDIENTE: Cliente crea el pedido (descuenta stock)
    PENDIENTE --> CONFIRMADO: ADMIN verifica el comprobante
    CONFIRMADO --> ENVIADO: ADMIN despacha
    ENVIADO --> ENTREGADO: ADMIN registra la entrega
    PENDIENTE --> CANCELADO: restituye stock
    CONFIRMADO --> CANCELADO: restituye stock
    ENTREGADO --> [*]
    CANCELADO --> [*]
```

## 5. Arquitectura

Arquitectura cliente-servidor desacoplada: el frontend (páginas HTML con JavaScript Vanilla) y el backend son aplicaciones independientes que se comunican únicamente por HTTP con JSON.

```mermaid
flowchart LR
    U([Usuario]) --> FE

    subgraph Cliente
        FE["Frontend web (HTML · CSS · JS Vanilla)<br/>Landing · Login/Registro · Dashboard"]
    end

    subgraph Servidor
        API["API REST<br/>Rutas → Controladores → Servicios → Repositorios"]
        MW["Middlewares<br/>Autenticación · Roles · Validación · CORS · Manejo de errores"]
    end

    subgraph Persistencia dual
        DB[("Base de datos relacional<br/>usuarios · productos · pedidos<br/>detalles_pedido · archivos (metadatos)")]
        FS[/"Almacenamiento de ficheros<br/>comprobantes · imágenes"/]
    end

    FE -- "HTTP / JSON" --> MW --> API
    API -- "SQL" --> DB
    API -- "lectura / escritura de ficheros" --> FS
```

### Stack tecnológico

| Capa | Tecnología |
| :-- | :-- |
| Frontend | HTML5, CSS3 y JavaScript Vanilla (sin framework); el módulo `api.js` centraliza las peticiones al backend |
| Backend | Node.js (Express) con arquitectura en capas |
| Base de datos | PostgreSQL (esquema en [`server/src/database/schema.sql`](server/src/database/schema.sql)) |
| Almacenamiento de ficheros | **[POR DEFINIR]** (disco local del servidor, AWS S3, Supabase o Cloudinary) |
| Autenticación | **[POR DEFINIR]** (JWT o sesión de servidor) con contraseñas hasheadas |
| Despliegue | **[POR DEFINIR]** |

### Decisiones de diseño

- **Capas en el backend:** las rutas solo enrutan; los controladores manejan HTTP; los servicios contienen la lógica de negocio y las transacciones; los repositorios ejecutan las consultas. Esto permite probar la lógica sin depender de HTTP.
- **Base de datos relacional:** el dominio (usuarios, pedidos, líneas de pedido, productos) tiene relaciones fuertes y requiere transacciones ACID para mantener el stock consistente, lo que un modelo relacional resuelve de forma natural.
- **Ficheros fuera de la base de datos:** guardar binarios (o Base64) en la base de datos la infla y degrada el rendimiento; por eso la base solo guarda metadatos y la ruta.
- **Carrito en el cliente:** el carrito vive en el cliente (almacenamiento del navegador) y se envía completo al crear el pedido, en una sola petición transaccional. Evita una tabla adicional y reservas de stock que nunca se confirman.
- **Backend como fuente de verdad:** el servidor recalcula precios y totales; nunca confía en los valores enviados por el cliente.

## 6. Modelo de datos

Modelo relacional normalizado (3FN) con cinco entidades. El script de creación está en [`server/src/database/schema.sql`](server/src/database/schema.sql) (PostgreSQL 12+; existe una variante para MySQL 8).

```mermaid
erDiagram
    USUARIOS ||--o{ PEDIDOS : realiza
    PEDIDOS ||--|{ DETALLES_PEDIDO : contiene
    PRODUCTOS ||--o{ DETALLES_PEDIDO : "se incluye en"
    USUARIOS ||--o{ ARCHIVOS : sube
    PRODUCTOS |o--o{ ARCHIVOS : "tiene imágenes"
    PEDIDOS |o--o{ ARCHIVOS : "tiene comprobantes"

    USUARIOS {
        bigint id PK
        varchar nombre
        varchar email UK
        varchar password_hash
        varchar rol "CLIENTE | ADMIN"
        boolean activo
        timestamptz creado_en
        timestamptz actualizado_en
    }
    PRODUCTOS {
        bigint id PK
        varchar sku UK
        varchar nombre
        text descripcion
        numeric precio
        int stock
        int stock_minimo
        boolean activo
        timestamptz creado_en
        timestamptz actualizado_en
    }
    PEDIDOS {
        bigint id PK
        bigint usuario_id FK
        varchar estado
        numeric total
        varchar direccion_envio
        text notas
        timestamptz creado_en
        timestamptz actualizado_en
    }
    DETALLES_PEDIDO {
        bigint id PK
        bigint pedido_id FK
        bigint producto_id FK
        int cantidad
        numeric precio_unitario
        numeric subtotal "columna generada"
    }
    ARCHIVOS {
        bigint id PK
        bigint usuario_id FK "autor"
        bigint producto_id FK "opcional"
        bigint pedido_id FK "opcional"
        varchar nombre_original
        varchar nombre_almacenado
        varchar ruta_almacenamiento UK
        varchar tipo_mime
        bigint tamano_bytes
        char checksum_sha256
        timestamptz subido_en
        timestamptz eliminado_en
    }
```

### Restricciones principales

| Regla | Mecanismo |
| :-- | :-- |
| Rol válido | `CHECK (rol IN ('CLIENTE','ADMIN'))` |
| Email único sin distinguir mayúsculas | Índice único sobre `lower(email)` |
| Precio, stock y total no negativos; cantidad > 0 | `CHECK` |
| Estados de pedido válidos | `CHECK` sobre `estado` |
| Un producto aparece una sola vez por pedido | `UNIQUE (pedido_id, producto_id)` |
| Un archivo pertenece a un producto **o** a un pedido, no a ambos | `CHECK (producto_id IS NULL OR pedido_id IS NULL)` |
| Historial protegido | `ON DELETE RESTRICT` en usuarios y productos con pedidos; `CASCADE` de pedido a sus detalles |

## 7. Persistencia dual

Todo lo que el usuario sube se guarda en **dos lugares coordinados**:

| Qué | Dónde | Contenido |
| :-- | :-- | :-- |
| **Fichero físico** | Almacenamiento de ficheros | El binario, con un nombre único (UUID + extensión) para evitar colisiones. |
| **Metadatos** | Tabla `archivos` en la base de datos | Nombre original, nombre almacenado, ruta/URL, tipo MIME, peso, checksum SHA-256, fecha, autor y asociación (producto o pedido). |

**Flujo de subida** (`multipart/form-data`):

1. El cliente envía el archivo junto con el `pedido_id` o `producto_id`.
2. El backend valida autenticación, permisos sobre el recurso, tipo (por contenido, no solo por extensión) y peso máximo.
3. Genera un nombre único, guarda el fichero y calcula su checksum.
4. Inserta el registro en `archivos`. Si la inserción falla, elimina el fichero recién guardado para no dejar huérfanos.
5. Responde `201` con los metadatos y la URL de descarga.

**Descarga:** `GET /api/archivos/:id/descargar` valida que el usuario sea el autor o un `ADMIN` antes de entregar el fichero. La eliminación es lógica (`eliminado_en`); un proceso aparte purga los binarios.

## 8. API REST (diseño preliminar)

Base: `/api`. Respuestas en JSON con códigos estándar: `200`, `201`, `204`, `400` (validación), `401` (sin sesión), `403` (sin permiso), `404`, `409` (conflicto, por ejemplo stock insuficiente) y `500`.

| Método | Ruta | Acceso | Descripción |
| :-- | :-- | :-- | :-- |
| `GET` | `/health` | Público | Estado del servidor y de la conexión a la base de datos. |
| `POST` | `/api/auth/register` | Público | Registro de cliente. |
| `POST` | `/api/auth/login` | Público | Inicio de sesión. |
| `POST` | `/api/auth/logout` | Autenticado | Cierre de sesión. |
| `GET` | `/api/auth/me` | Autenticado | Usuario de la sesión actual. |
| `GET` | `/api/productos` | Autenticado | Catálogo (el cliente solo ve activos con stock > 0). |
| `GET` | `/api/productos/:id` | Autenticado | Detalle de un producto. |
| `GET` | `/api/productos/stock-bajo` | ADMIN | Productos con `stock <= stock_minimo`. |
| `POST` | `/api/productos` | ADMIN | Crear producto. |
| `PUT` | `/api/productos/:id` | ADMIN | Editar producto. |
| `DELETE` | `/api/productos/:id` | ADMIN | Baja lógica. |
| `POST` | `/api/pedidos` | CLIENTE | Crear pedido desde el carrito. |
| `GET` | `/api/pedidos` | Autenticado | Historial (propio para CLIENTE; todos para ADMIN). |
| `GET` | `/api/pedidos/:id` | Autor o ADMIN | Detalle del pedido y sus archivos. |
| `PUT` | `/api/pedidos/:id/estado` | ADMIN | Cambiar estado (valida transiciones). |
| `POST` | `/api/archivos` | Autenticado | Subir archivo (`multipart/form-data`). |
| `GET` | `/api/archivos/:id` | Autor o ADMIN | Metadatos del archivo. |
| `GET` | `/api/archivos/:id/descargar` | Autor o ADMIN | Descarga o visualización. |
| `DELETE` | `/api/archivos/:id` | Autor o ADMIN | Baja lógica del archivo. |

## 9. Requisitos no funcionales

- **Seguridad:** contraseñas con hash y sal; consultas parametrizadas (sin concatenar SQL); validación de payloads en el servidor; autorización por rol y por propietario del recurso; CORS restringido al origen del frontend; secretos solo en variables de entorno. La protección de vistas en el cliente es solo de experiencia de usuario; la seguridad real se aplica en la API (`401`/`403`).
- **Integridad:** operaciones que afectan stock y pedidos dentro de transacciones; restricciones en la base de datos como segunda línea de defensa.
- **Usabilidad:** diseño responsive, estados de carga y mensajes de error comprensibles.
- **Mantenibilidad:** separación en capas, manejo centralizado de errores y configuración por variables de entorno.
- **Reproducibilidad:** cualquier integrante debe poder levantar el proyecto con los pasos de este README y datos de prueba (*seeds*).

## 10. Estructura del repositorio

```
Invix/
├── Client/                     # Frontend (HTML, CSS y JavaScript Vanilla)
│   ├── css/
│   │   └── styles.css
│   ├── js/
│   │   ├── api.js              # Cliente HTTP: peticiones, estados de carga y errores
│   │   └── main.js             # Lógica de interfaz y guardas de rutas
│   └── public/
│       ├── index.html          # Landing (pública)
│       ├── login.html          # Login (pública)
│       └── register.html       # Registro (pública)
├── Docs/                       # Diagramas y documentación adicional
├── server/                     # Backend (API REST en Node.js)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js           # Conexión a la base de datos
│   │   ├── controllers/
│   │   │   └── healthController.js
│   │   ├── database/
│   │   │   └── schema.sql      # Creación de tablas
│   │   ├── routes/
│   │   │   └── healthRoutes.js
│   │   └── app.js              # Configuración y arranque del servidor
│   ├── .env.example
│   └── package.json
├── .gitignore
├── LICENSE
└── README.md
```

A medida que avance el proyecto se incorporarán: `server/src/services/` (lógica de negocio y transacciones), `server/src/repositories/` (consultas SQL), `server/src/middlewares/` (autenticación, roles, validación y manejo de errores), `server/src/database/seed.sql` (usuario `ADMIN` y productos de ejemplo), `server/uploads/` (ficheros subidos, excluida de Git) y las vistas privadas (dashboard, catálogo, pedidos) en `client/public/`.

## 11. Configuración y ejecución

### Variables de entorno

Copie `server/.env.example` como `server/.env` y ajuste los valores. **Nunca** suba `.env` ni `server/uploads/` al repositorio (ambos deben estar en `.gitignore`). El frontend no usa archivo `.env`: la URL base de la API se define en una constante al inicio de `client/js/api.js`.

```env
# server/.env.example
PORT=4000
DATABASE_URL=postgresql://usuario:contraseña@localhost:5432/invix
AUTH_SECRET=cambiar_por_un_valor_largo_y_aleatorio
CORS_ORIGIN=http://127.0.0.1:5500
UPLOAD_DIR=./uploads
MAX_UPLOAD_MB=5
ALLOWED_MIME_TYPES=application/pdf,image/jpeg,image/png,image/webp
```

### Puesta en marcha local

1. Clonar el repositorio y crear la base de datos `invix` en PostgreSQL.
2. Ejecutar `server/src/database/schema.sql` (y `seed.sql` cuando esté disponible).
3. En `server/`, copiar `.env.example` como `.env` y completar los valores.
4. Instalar dependencias y arrancar el backend desde `server/`: `npm install` y luego `npm start` (o el script de desarrollo definido en `package.json`).
5. Servir la carpeta `client/` con un servidor estático (por ejemplo, la extensión Live Server o `npx serve Client`) y abrir la landing. El origen usado debe coincidir con `CORS_ORIGIN`.
6. Verificar la conexión a la base de datos:

```bash
curl http://localhost:4000/health
```

```json
{ "status": "ok", "database": "connected", "timestamp": "2026-01-01T00:00:00Z" }
```

Si la base de datos no responde, el endpoint devuelve `503` con `"database": "unreachable"`.

## 12. Flujo de trabajo con Git

- **Ramas:** `main` (estable, protegida) y ramas de trabajo `feature/<módulo>-<descripción>`, `fix/…` o `docs/…`. Nadie hace commits directos a `main`.
- **Pull Requests:** todo cambio entra por PR con descripción y revisión de al menos otro integrante.
- **Commits atómicos** con mensajes descriptivos siguiendo [Conventional Commits](https://www.conventionalcommits.org/es/): `feat: agrega endpoint de login`, `fix: valida stock negativo`, `docs: actualiza diagrama E/R`.
- **Reparto:** cada integrante es responsable de al menos un módulo funcional y participa en revisiones.

## 13. Cronograma y estado

| Hito | Semana | Peso | Alcance | Estado |
| :-- | :--: | :--: | :-- | :--: |
| **Avance 1** | 9 | 15 % | Definición del problema, alcance y arquitectura; diagrama E/R; repositorio base con `/health` probado en la base de datos; landing y vistas de Login/Registro responsive. | 🔄 En curso |
| **Avance 2** | 13 | 15 % | Login y registro funcionales; rutas públicas/privadas; CRUD consumido desde el cliente; subida de ficheros con persistencia básica. | ⏳ Pendiente |
| **Entrega final** | 15–16 | 55 % | Integración de punta a punta; persistencia dual completa; calidad de código; despliegue o README reproducible. | ⏳ Pendiente |
| **Sustentación** | 15–16 | 15 % | Exposición de 10 minutos: arquitectura, demo en vivo y preguntas. | ⏳ Pendiente |

### Checklist del Avance 1

- [x] Definición del problema, objetivos, alcance e historias de usuario
- [ ] Diagrama E/R y script de creación de tablas - (Se ha realizado la primera propuesta)
- [x] Repositorio base con separación `client/` y `server/`
- [ ] Endpoint `/health` con verificación de conexión a la base de datos
- [x] `.env.example` y `.gitignore` configurados
- [ ] Landing page responsive con llamados a la acción
- [ ] Vistas de Login y Registro maquetadas, con validación de campos

## 14. Equipo

| Integrante                                 | Rol | Usuario GitHub                                                  | Módulo |
|:-------------------------------------------| :--- |:----------------------------------------------------------------| :--- |
| **Juan Sebastian Vasquez**                 | Diseño visual y CSS | [Kossio-01](https://github.com/Kossio-01)                       | Estilos globales (`styles.css`), paleta de colores y adaptabilidad responsive. |
| **Laura Henao**                            | Maquetación web | [Alice14062](https://github.com/Alice14062)                     | Vistas HTML (`index.html`, `login.html`, `register.html`) y llamadas con JS (`api.js`). |
| **Juan Camilo Cassierra**                  | Servidor y API | [casierra11](https://github.com/casierra11)                     | Configuración de Express, rutas, controladores y endpoint `/health`. |
| **Sebastian Giraldo**                      | Base de datos | [SGiraldo017](https://github.com/SGiraldo017)                              | Script SQL (`schema.sql`), diagrama E/R y configuración de PostgreSQL. |