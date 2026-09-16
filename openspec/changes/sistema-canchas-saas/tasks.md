## 1. Decisiones y base del dominio

- [x] 1.1 Provisionar la base PostgreSQL B2B independiente y sus variables de conexión por ambiente.
- [x] 1.2 Definir contratos de organización, usuarios, roles, complejo, cancha, turno, disponibilidad y reserva.
- [x] 1.3 Crear migraciones y entidades TypeORM B2B con aislamiento por `organizationId`.
- [x] 1.4 Añadir roles `OWNER`, `ADMIN`, `OPERATOR` y `CLIENT`, índices, auditoría y protección contra reservas duplicadas.

## 2. Acceso y backend B2B

- [x] 2.1 Crear módulos NestJS de organización, facility, court, availability y booking.
- [x] 2.2 Implementar autenticación JWT propia del B2B y guards para organización activa y roles.
- [x] 2.3 Implementar CRUD de organizaciones, complejos y canchas con aislamiento por tenant.
- [x] 2.4 Implementar reglas semanales, turnos de 1/2 horas, bloqueos y disponibilidad en `America/Argentina/Buenos_Aires`.
- [x] 2.5 Implementar creación autenticada, confirmación, cancelación, reprogramación y cierre de reservas en ARS.
- [x] 2.6 Documentar endpoints `/api/v1` y DTOs en Swagger.
- [x] 2.7 Añadir pruebas unitarias de reglas B2B y smoke tests de autorización, disponibilidad y transacciones de reservas.

## 3. Frontend Sistema Canchas

- [x] 3.1 Definir la aplicación/rutas B2B diferenciadas y el enlace visible hacia El Pizarrón del DT.
- [x] 3.2 Convertir las pantallas aprobadas en Stitch en componentes React modulares y responsive.
- [x] 3.3 Crear shell, dashboard, selector de organización y estados de carga/error/vacío.
- [x] 3.4 Crear páginas de complejos, canchas, horarios, bloqueos y reservas.
- [x] 3.5 Añadir servicios axios y stores B2B separados de `useDraftStore` y del historial del juego.
- [x] 3.6 Implementar navegación bidireccional entre Sistema Canchas y El Pizarrón del DT.
- [x] 3.7 Validar navegación, permisos visibles y creación/cancelación de reserva mediante recorrido de navegador y smoke test Docker.

## 4. Datos de prueba y operación

- [x] 4.1 Crear seed de organización, complejo, canchas, horarios y reservas de demostración.
- [x] 4.2 Añadir bandera de funcionalidad y fallback configurable para la nueva entrada principal.
- [x] 4.3 Verificar migraciones, variables de entorno, backups y despliegue independiente local/producción.
- [x] 4.4 Ejecutar typecheck, build, pruebas backend y smoke test del recorrido B2B completo.

## 5. Activación incremental

- [x] 5.1 Publicar primero el recorrido de prototipo con datos de ejemplo.
- [x] 5.2 Activar API real para operadores internos y validar conflictos de disponibilidad.
- [x] 5.3 Habilitar reservas de clientes tras validar permisos, auditoría y cancelaciones.
- [ ] 5.4 Revisar métricas y feedback del primer complejo antes de incorporar pagos o marketplace.