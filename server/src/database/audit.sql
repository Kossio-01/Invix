-- Read-only audit. Run against the existing database; do not rerun schema.sql.
BEGIN TRANSACTION READ ONLY;
SELECT current_database() AS base, current_user AS usuario;
WITH expected(nombre) AS (
  VALUES ('empresas'), ('planes'), ('suscripciones'), ('usuarios')
), actual AS (
  SELECT n.nspname AS esquema, c.relname AS nombre
  FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind IN ('r', 'p', 'f')
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')
    AND n.nspname NOT LIKE 'pg_toast%'
    AND n.nspname NOT LIKE 'pg_temp%'
)
SELECT COALESCE(a.esquema, 'public') AS esquema,
       COALESCE(a.nombre, e.nombre) AS tabla,
       CASE WHEN a.nombre IS NULL THEN 'FALTA'
            WHEN e.nombre IS NULL THEN 'REVISAR'
            ELSE 'OK' END AS resultado
FROM actual a FULL JOIN expected e ON a.esquema = 'public' AND a.nombre = e.nombre
ORDER BY esquema, tabla;
COMMIT;
