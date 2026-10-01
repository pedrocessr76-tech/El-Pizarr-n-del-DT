## ADDED Requirements

### Requirement: Enviar recordatorios de email automáticamente
El sistema MUST procesar desde el servidor los recordatorios de email vencidos de reservas PENDING o CONFIRMED cuyo turno aún no comenzó, aunque ningún usuario tenga el dashboard abierto. MUST deduplicar cada combinación de reserva, canal y anticipación, y MUST omitir reservas canceladas, completadas, no presentadas o cuyo turno ya empezó.

#### Scenario: Recordatorio de email debido
- **WHEN** llega una anticipación de email configurada para una reserva activa con turno futuro
- **THEN** el sistema envía el recordatorio una sola vez para esa reserva, canal y anticipación

#### Scenario: Reserva cerrada o turno iniciado
- **WHEN** el procesador revisa una reserva cancelada, completada, no presentada o con el turno ya iniciado
- **THEN** no envía el recordatorio

#### Scenario: El turno ya pasó
- **WHEN** una anticipación de email vence después de que el turno ya comenzó
- **THEN** el sistema omite el envío y lo deja registrado como omitido, sin intentar entregar un aviso inútil

#### Scenario: La anticipación venció antes de existir la reserva
- **WHEN** una reserva se crea cuando el momento de una anticipación ya configurada pasó hace tiempo, por ejemplo un turno reservado con menos de 24 horas de anticipación
- **THEN** el sistema entrega el recordatorio en el primer ciclo en que lo ve, en lugar de descartarlo por vencido

### Requirement: Enviar por email sin exigir consentimiento adicional
El sistema MUST enviar el recordatorio de email usando la dirección con la que el cliente se registró, sin requerir una marca de consentimiento adicional, por tratarse de una comunicación transaccional sobre una reserva que el propio cliente realizó. El sistema MUST NOT exigir esta marca para el canal de email y MUST NOT aplicarla al resto de los consentimientos ya existentes.

#### Scenario: Cliente sin opt-in de WhatsApp pero con email
- **WHEN** el cliente no dio opt-in de WhatsApp y su anticipación de email vence
- **THEN** el sistema envía el recordatorio por email igualmente y no genera un aviso de WhatsApp para él

### Requirement: Recuperarse de ejecuciones repetidas
El sistema MUST persistir el estado de las entregas de email y MUST evitar que varios ciclos o instancias envíen simultáneamente la misma combinación de reserva, canal y anticipación. Las entregas fallidas MUST poder reintentarse.

#### Scenario: El ciclo vuelve a revisar un recordatorio enviado
- **WHEN** otro ciclo procesa una combinación ya marcada como enviada
- **THEN** el sistema no vuelve a enviar el mensaje

#### Scenario: Reintentar una entrega fallida
- **WHEN** el envío por email falla
- **THEN** el sistema registra el error y deja la entrega elegible para un reintento

### Requirement: Degradar a modo simulado sin configuración de correo
El sistema MUST enviar los recordatorios de email a través de un proveedor seleccionable por entorno y MUST caer a un proveedor de registro cuando no exista configuración de correo, de modo que un despliegue sin SMTP siga arrancando y dejando los envíos marcados como simulados. La interfaz MUST indicar que el envío no fue entregado.

#### Scenario: Canal configurado con SMTP
- **WHEN** el canal de email está configurado con un servidor SMTP y credenciales válidas
- **THEN** el sistema entrega el mensaje por SMTP y lo registra como enviado

#### Scenario: Canal sin configuración
- **WHEN** no hay configuración SMTP y el proveedor de email no fue declarado explícitamente
- **THEN** el sistema registra el envío como simulado, no contacta ningún servidor externo y la interfaz lo advierte
