## ADDED Requirements

### Requirement: Login y perfil mobile
En `< md`, la pantalla de acceso de Canchas MUST presentarse a pantalla completa (sin sidebar) con la marca, un selector de perfil táctil (que respeta las identidades reales del sistema) y formularios con inputs de al menos 44px de alto. MUST conservar la autenticación y el registro existentes de `b2bService` sin cambios de contrato.

#### Scenario: Iniciar sesión en mobile
- **WHEN** el usuario ingresa credenciales válidas en mobile
- **THEN** se autentica y accede a la vista correspondiente a su rol.

#### Scenario: Cambiar de perfil en mobile
- **WHEN** el usuario cambia el perfil seleccionado antes de enviar
- **THEN** el formulario y el flujo de registro se ajustan al perfil elegido.

### Requirement: Portal de reservas del cliente mobile
En `< md`, el portal de reservas MUST ofrecer un selector de fecha horizontal (chips), filtros en pills desplazables, un control segmentado de duración y tarjetas de cancha con franja horaria deslizable, con una **hoja resumen flotante** sobre el bottom nav que muestra la selección real (cancha, horario, total y seña) y avanza al pago. Los turnos ocupados MUST mostrarse deshabilitados.

#### Scenario: Seleccionar un turno
- **WHEN** el usuario toca una franja horaria disponible
- **THEN** la hoja resumen se actualiza con la cancha, el horario y los importes reales de esa selección.

#### Scenario: Turno ocupado
- **WHEN** una franja horaria está ocupada
- **THEN** se muestra deshabilitada y no puede seleccionarse.

#### Scenario: Continuar al pago
- **WHEN** el usuario presiona "Continuar a Pago"
- **THEN** avanza a la pantalla de pago con la reserva seleccionada.

### Requirement: Pago y seña mobile
En `< md`, la pantalla de pago MUST mostrar un indicador de pasos, un resumen de la reserva con contador, radios de modalidad (seña/total) y de medio de pago, los datos del titular y una **barra de checkout fija** sobre el bottom nav cuyo importe y etiqueta reflejan la modalidad elegida. La acción de pago MUST reusar los servicios existentes y MUST dar feedback en la interfaz sin `alert()`.

#### Scenario: Cambiar de modalidad
- **WHEN** el usuario alterna entre pago de seña y pago total
- **THEN** el importe y la etiqueta de la barra de checkout se actualizan y la reserva refleja la modalidad elegida.

#### Scenario: Confirmar el pago
- **WHEN** el usuario confirma el pago
- **THEN** se ejecuta la acción con los servicios existentes y se muestra un estado de confirmación en la interfaz.

### Requirement: Dashboard operativo mobile
En `< md`, el dashboard del staff MUST adaptar la operación diaria al teléfono: grilla de KPIs, barra de acciones, "Próximos a iniciar", "Solicitudes online" y "Cierre de caja", reusando los datos y acciones existentes (`StaffView`/`b2bService`). Las acciones de aprobar/rechazar/cobrar MUST dar feedback en la interfaz y MUST NOT usar `alert()`.

#### Scenario: Ver KPIs en mobile
- **WHEN** el staff abre el dashboard en mobile
- **THEN** ve las métricas del día en una grilla legible sin desbordes.

#### Scenario: Gestionar una solicitud
- **WHEN** el staff aprueba o rechaza una solicitud online en mobile
- **THEN** la lista se actualiza y el resultado se comunica en la interfaz, sin `alert()`.

#### Scenario: Acciones de operación
- **WHEN** el staff presiona "Dar entrada", "Cobrar saldo" o "Cerrar caja" en mobile
- **THEN** la acción se ejecuta con el feedback correspondiente en la interfaz.
