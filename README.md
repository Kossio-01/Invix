# Invix — Plataforma SaaS de suscripciones y acceso empresarial

Invix es una plataforma SaaS para negocios. Una empresa registra una única cuenta administrativa, contrata una suscripción y organiza su inventario según el plan seleccionado. El alcance actual se centra en empresas, planes, suscripciones, autenticación, productos e auditoría.

## Alcance actual

- Registro de una empresa junto con su única cuenta administrativa.
- Planes Básico, Profesional y Empresarial.
- Suscripción activa asociada a cada empresa.
- Login con JWT y contraseñas protegidas con bcrypt.
- Rol administrativo `ADMIN`.
- Consulta de perfil, empresa y plan mediante `/api/auth/me`.
- Validación de sesión y protección de rutas.
- Landing page y formularios responsive.

Los pagos reales, la renovación automática y los módulos internos del programa quedan para fases posteriores.

## Planes del MVP

| Plan | Productos activos | Fotos | Precio mensual de referencia |
| :-- | --: | :--: | --: |
| Básico | Hasta 50 | No disponibles | $29.900 |
| Profesional | Hasta 500 | Disponibles | $79.900 |
| Empresarial | Ilimitados | Disponibles | $159.900 |

En esta fase la suscripción se crea activa sin integrar una pasarela de pago.

## Roles

| Rol | Acceso |
| :-- | :-- |
| Visitante | Landing, registro y login |
| ADMIN | Administración de la empresa, sus productos y su suscripción |

Cada negocio tiene una sola cuenta administrativa. El usuario registrado al crear la empresa queda como `ADMIN` y es el único responsable de administrar el inventario y la suscripción.

## Arquitectura

```text
client/       Frontend Next.js, React y App Router
server/       API REST Node.js y Express
PostgreSQL    Empresas, planes, suscripciones y productos
```

La autenticación usa JWT. La API consulta PostgreSQL mediante consultas parametrizadas y el contexto autenticado incluye la empresa y el plan del usuario.

## API disponible

| Método | Ruta | Acceso | Descripción |
| :-- | :-- | :-- | :-- |
| GET | `/health` | Público | Estado de API y base de datos |
| POST | `/api/auth/register` | Público | Registra empresa y usuario inicial |
| POST | `/api/auth/login` | Público | Inicia sesión y entrega JWT |
| GET | `/api/auth/me` | Autenticado | Devuelve usuario, empresa y plan |
| GET | `/api/planes` | Público | Lista los planes activos |
| GET | `/api/suscripcion` | Autenticado | Consulta la suscripción de la empresa |
| PUT | `/api/suscripcion` | ADMIN | Cambia el plan de la empresa |
| POST | `/api/suscripcion/cancelar` | ADMIN | Cancela la suscripción activa |
| GET | `/api/productos` | Autenticado | Lista productos de la empresa |
| POST | `/api/productos` | ADMIN | Crea un producto |
| PUT | `/api/productos/:id` | ADMIN | Actualiza un producto |
| DELETE | `/api/productos/:id` | ADMIN | Desactiva un producto |
| GET | `/api/auditoria` | Autenticado | Lista cambios de la empresa |
| GET | `/api/dashboard/resumen` | Autenticado | Resume productos y la cuenta empresarial |

## Base de datos

El esquema principal está en `server/src/database/schema.sql` y contiene únicamente las entidades del MVP:

- `empresas`
- `planes`
- `suscripciones`
- `usuarios`
- `productos`
- `auditoria`

Los datos de prueba están en `server/src/database/seed.sql`.
Para una base SaaS ya existente, ejecuta una sola vez
`server/src/database/modules-migration.sql` antes de usar estos módulos. Este archivo elimina la tabla
`sensores` si quedó creada por una versión anterior.

Los productos pueden guardar una foto mediante `imagen_url`. Para cargas desde el navegador,
configura Cloudinary y agrega estas variables públicas en Vercel:

- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
- `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

## Configuración local

1. Instala PostgreSQL y crea una base llamada `invix`.
2. Ejecuta `server/src/database/schema.sql`.
3. Ejecuta `server/src/database/setup.sql`.
4. Ejecuta `server/src/database/seed.sql`.
5. Copia `server/.env.example` como `server/.env` y configura `DATABASE_URL`.
6. Inicia el backend:

```powershell
cd server
npm install
npm start
```

7. En otra terminal inicia el frontend:

```powershell
cd client
npm install
npm run dev
```

8. Abre `http://localhost:3000`.

Ejemplo de conexión:

```env
PORT=4000
DATABASE_URL=postgresql://postgres:TU_CONTRASEÑA@localhost:5432/invix
AUTH_SECRET=una-clave-local-larga
AUTH_TOKEN_EXPIRES_IN=2h
AUTH_JWT_ISSUER=invix-api
CORS_ORIGIN=http://localhost:3000
```

Verificación:

```powershell
curl.exe http://localhost:4000/health
```

Respuesta esperada:

```json
{"status":"ok","database":"connected"}
```

## Credenciales de prueba

Después de ejecutar `seed.sql`:

```text
ADMIN: admin@invix.com / Admin123!
```

## Flujo Git

- `main`: rama estable.
- `feature/<descripcion>`: nuevas funcionalidades.
- Commits atómicos y Pull Requests revisados.

## Trabajo futuro

- Integración de pagos.
- Renovación y cancelación de suscripciones.
- Gestión avanzada de facturas.
