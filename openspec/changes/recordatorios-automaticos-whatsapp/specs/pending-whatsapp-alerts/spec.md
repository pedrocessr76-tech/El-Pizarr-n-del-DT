## ADDED Requirements

### Requirement: Exponer los avisos de WhatsApp pendientes de despacho
El sistema MUST exponer al staff autorizado la lista de recordatorios de WhatsApp que vencieron y que aún no fueron despachados, limitado a reservas cuyo turno todavía no começou, e incluyendo el teléfono del cliente, el nombre de la cancha y el texto del mensaje ya armado. El sistema MUST exigir rol de staff para leer la lista y MUST NOT exponerla al portal del cliente.

#### Scenario: Listar avisos pendientes
- **WHEN** staff consulta los avisos pendientes y existen recordatorios de WhatsApp vencidos sin despachar
- **THEN** el sistema devuelve uno por cada combinación de reserva, canal y anticipación, con teléfono, cancha, hora del turno y mensaje

#### Scenario: El turno ya comenzó
- **WHEN** el turno de un aviso pendiente ya empezó
- **THEN** el sistema no lo incluye en la lista

#### Scenario: El aviso ya fue despachado
- **WHEN** un aviso ya fue marcado como enviado
- **THEN** el sistema no lo vuelve a listar

#### Scenario: Cliente sin teléfono o consentimiento
- **WHEN** una anticipación de WhatsApp venció y el cliente no tiene teléfono o no dio consentimiento
- **THEN** el sistema no lista ningún aviso para esa reserva, porque no hay a quién avisar

#### Scenario: El cliente consulta
- **WHEN** un usuario con rol de cliente intenta leer la lista de avisos pendientes
- **THEN** el sistema la rechaza por permisos

### Requirement: Despachar un aviso con un toque
El sistema MUST permitir que staff marque un aviso pendiente como despachado, de modo que deje de aparecer en el panel y el processor no lo genere de nuevo. El sistema MUST aceptar el cambio como una confirmación del staff y MUST NOT exigir prueba de entrega, ya que el envío ocurre en el dispositivo del usuario.

#### Scenario: Marcar un aviso como enviado
- **WHEN** staff marca un aviso pendiente como enviado
- **THEN** el registro pasa al estado enviado y desaparece del panel

#### Scenario: Marcar un aviso inexistente
- **WHEN** staff marca un aviso que no existe o no le corresponde
- **THEN** el sistema rechaza la operación sin alterar otros registros

### Requirement: Mostrar el panel de avisos pendientes en el dashboard
El dashboard operativo del staff MUST incluir un panel de avisos pendientes que muestre los turnos que requieren un aviso de WhatsApp, con la hora del turno y una acción de un solo toque que abra el chat del cliente con el mensaje pre-cargado. El panel MUST operar en un dispositivo móvil y MUST permitir copiar el teléfono y el texto cuando el enlace no pueda abrirse.

#### Scenario: Abrir el chat con el mensaje pre-cargado
- **WHEN** staff activa la acción de un toque sobre un aviso pendiente
- **THEN** el sistema abre el chat de WhatsApp del cliente con el texto del aviso ya cargado y registra el aviso como enviado

#### Scenario: No hay nada pendiente
- **WHEN** no existen avisos pendientes
- **THEN** el panel informa que no hay avisos por despachar en lugar de mostrar una lista vacía
