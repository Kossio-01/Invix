# Invix — Plataforma SaaS de suscripciones y acceso empresarial

Invix es una plataforma SaaS para negocios. Una empresa se registra, obtiene una suscripción y sus usuarios acceden al programa según el plan contratado. El alcance actual se centra en empresas, planes, suscripciones, autenticación y control de acceso.

## Alcance actual

- Registro de una empresa junto con su usuario inicial.
- Planes Básico, Profesional y Empresarial.
- Suscripción activa asociada a cada empresa.
- Login con JWT y contraseñas protegidas con bcrypt.
- Roles `ADMIN` y `CLIENTE`.
- Consulta de perfil, empresa y plan mediante `/api/auth/me`.
- Validación de sesión y protección de rutas.
- Landing page y formularios responsive.

Los pagos reales, la renovación automática y los módulos internos del programa quedan para fases posteriores.

## Planes del MVP

| Plan | Usuarios | Precio mensual de referencia |
| :-- | --: | --: |
| Básico | 1 | $29.900 |
| Profesional | 5 | $79.900 |
| Empresarial | Ilimitados | $159.900 |

En esta fase la suscripción se crea activa sin integrar una pasarela de pago.

## Roles

| Rol | Acceso |
| :-- | :-- |
| Visitante | Landing, registro y login |
| CLIENTE | Acceso al programa contratado |
| ADMIN | Administración de la empresa y sus usuarios |

El primer usuario registrado por una empresa queda como `ADMIN`, porque es quien administra la cuenta y su suscripción. Los usuarios `CLIENTE` quedan disponibles para una futura gestión de miembros.

## Arquitectura

```text
client/       Frontend Next.js, React y App Router
server/       API REST Node.js y Express
PostgreSQL    Empresas, planes, suscripciones y usuarios
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
| GET | `/api/dashboard/resumen` | Autenticado | Resume productos y colaboradores de la empresa |
| GET | `/api/colaboradores` | ADMIN | Lista miembros e invitaciones pendientes |
| POST | `/api/colaboradores/invitaciones` | ADMIN | Crea una invitación con rol |
| PATCH | `/api/colaboradores/:id/rol` | ADMIN | Cambia el rol de un colaborador |
| DELETE | `/api/colaboradores/:id` | ADMIN | Desactiva un colaborador |
| DELETE | `/api/colaboradores/invitaciones/:id` | ADMIN | Cancela una invitación pendiente |
| POST | `/api/invitaciones/:token/aceptar` | Público con token | Acepta una invitación y crea el acceso |

## Base de datos

El esquema principal está en `server/src/database/schema.sql` y contiene únicamente las entidades del MVP:

- `empresas`
- `planes`
- `suscripciones`
- `usuarios`
- `invitaciones`
- `productos`
- `auditoria`

Los datos de prueba están en `server/src/database/seed.sql`.
Para una base SaaS ya existente, ejecuta una sola vez
`server/src/database/modules-migration.sql` antes de usar estos módulos. Este archivo elimina la tabla
`sensores` si quedó creada por una versión anterior.

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
ADMIN:   admin@invix.com / Admin123!
CLIENTE: cliente@invix.com / Cliente123!
```

## Flujo Git

- `main`: rama estable.
- `feature/<descripcion>`: nuevas funcionalidades.
- Commits atómicos y Pull Requests revisados.

## Trabajo futuro

- Selección de plan desde la interfaz.
- Integración de pagos.
- Renovación y cancelación de suscripciones.
- Aplicación de límites por plan.
- Panel administrativo de empresas y usuarios.
- Desarrollo del programa de gestión al que da acceso cada suscripción.
