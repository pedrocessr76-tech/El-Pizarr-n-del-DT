## Why

El proyecto necesita ampliar su alcance desde el juego táctico hacia una solución B2B que resuelva la operación diaria de complejos deportivos. Una sección principal para administrar canchas, disponibilidad y reservas permite validar un modelo SaaS sin perder el acceso al producto original de El Pizarrón del DT.

## What Changes

- Incorporar una nueva experiencia principal de tipo SaaS para propietarios y operadores de complejos deportivos.
- Permitir registrar y administrar complejos, canchas, horarios, precios y reglas de disponibilidad.
- Permitir consultar disponibilidad y crear, confirmar, cancelar o reprogramar reservas.
- Añadir una navegación de producto que conecte claramente Sistema Canchas con El Pizarrón del DT.
- Separar completamente la aplicación B2B y su base de datos del dominio existente de draft, equipos y torneos.
- Implementar multi-tenancy con un espacio aislado por organización o dueño de cancha.
- Exigir cuenta autenticada para que un cliente pueda reservar.
- Aplicar `America/Argentina/Buenos_Aires`, ARS y turnos configurables de 1 o 2 horas como valores iniciales.
- Definir contratos de API, modelo de datos, permisos por organización y estados de reserva antes de implementar la UI final.
- Integrar las vistas generadas con Google Stitch de forma modular, responsive y reemplazable.

## Capabilities

### New Capabilities

- `facility-management`: Gestión de organizaciones, complejos, canchas, horarios, precios y configuración operativa.
- `booking-management`: Consulta de disponibilidad y ciclo de vida de reservas para clientes y operadores.
- `saas-access`: Entrada principal, sesión, contexto de organización y permisos del producto B2B.
- `product-navigation`: Navegación cruzada entre Sistema Canchas y El Pizarrón del DT.
- `data-model`: Entidades y relaciones persistentes para organizaciones, complejos, canchas, disponibilidad y reservas.
- `draft-mode`: Definición del alcance inicial de configuración y prototipado de la nueva experiencia antes de habilitar operaciones completas.

### Modified Capabilities

- `screen-flow`: La ruta de entrada del frontend y el flujo de navegación deberán incorporar Sistema Canchas como sección principal, manteniendo una ruta explícita hacia El Pizarrón del DT.

## Impact

- Backend NestJS: nuevos módulos, entidades TypeORM, DTOs, guards de organización, servicios y endpoints documentados en Swagger.
- Frontend React: nuevo shell de navegación, páginas B2B, componentes modulares y stores/servicios axios específicos del producto.
- Base de datos PostgreSQL independiente para B2B, con tablas propias de organizaciones, usuarios, roles, complejos, canchas, turnos, disponibilidad y reservas.
- Autenticación y autorización propias para B2B con roles propietario, administrador, operador y cliente.
- OpenSpec: nuevos documentos de capacidad y delta de `screen-flow`.
- Operación: variables de entorno, seed inicial, estrategia de migraciones y despliegue independiente del juego.