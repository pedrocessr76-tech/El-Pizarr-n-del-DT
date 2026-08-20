# El Pizarrón del DT: referencia de despliegue

La raíz es un monorepo npm con workspaces `apps/server` y `apps/client`.

- La API es NestJS en `apps/server`. Construir con `npm run build --workspace=server` y arrancar con `npm run start --workspace=server`. Escucha `PORT` (el valor de Render debe prevalecer).
- La API usa TypeORM/PostgreSQL y las variables `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`. No consume una URL única de base de datos actualmente.
- La web es React/Vite en `apps/client`; construir con `npm run build --workspace=client`. Revisar `apps/client/src/services/api.ts` antes del deploy para confirmar cómo se inyecta la URL de la API. Preferir un static site cuando la build sea autocontenida.
- Para la base de datos, crear Render Postgres en la misma región que la API. Mapear sus propiedades internas a las cinco variables `DB_*` mediante `fromDatabase`.
- La configuración Docker actual sirve para desarrollo y el Dockerfile de cliente ejecuta Vite en modo dev; no reutilizarlo automáticamente para producción. Evaluar runtime nativo Node para API y sitio estático para web.
- Verificar CORS contra la URL final de la web antes de declarar el deploy correcto.
- `synchronize: true` está activo en TypeORM. Tratar los cambios de esquema de producción con precaución y recomendar migraciones explícitas antes de ampliar el uso productivo.
