## ADDED Requirements

### Requirement: Configurar anticipaciones de recordatorios por complejo
El sistema MUST permitir a staff configurar una lista de anticipaciones, en minutos antes del inicio del turno, para los recordatorios automáticos. Una organización nueva MUST comenzar con recordatorios a 24 horas y 1 hora antes.

#### Scenario: Guardar anticipaciones válidas
- **WHEN** staff guarda una lista de anticipaciones válidas
- **THEN** el sistema persiste la configuración para su organización y la devuelve al dashboard

#### Scenario: Rechazar anticipaciones inválidas
- **WHEN** staff intenta guardar una lista vacía, negativa o fuera del límite permitido
- **THEN** el sistema rechaza el cambio y conserva la configuración anterior

### Requirement: Enviar recordatorios automáticamente
El sistema MUST procesar desde el servidor los recordatorios vencidos de reservas PENDING o CONFIRMED cuyo turno aún no comenzó, aunque ningún usuario tenga el dashboard abierto. MUST validar el teléfono y opt-in del cliente justo antes del envío, omitir otros estados y deduplicar cada combinación de reserva y anticipación.

#### Scenario: Recordatorio debido para cliente con consentimiento
- **WHEN** llega una anticipación configurada para una reserva activa y el cliente tiene teléfono y opt-in
- **THEN** el sistema llama una sola vez al MessagingService para esa reserva y anticipación

#### Scenario: Cliente sin consentimiento
- **WHEN** llega una anticipación y el cliente no tiene teléfono o no dio opt-in
- **THEN** el sistema omite el mensaje y registra el motivo sin llamar al proveedor

#### Scenario: Reserva cerrada o turno iniciado
- **WHEN** el procesador revisa una reserva cancelada, completada, no presentada o con el turno ya iniciado
- **THEN** no envía el recordatorio

#### Scenario: Proveedor en modo log
- **WHEN** el proveedor configurado es `log`
- **THEN** el servicio registra el mensaje como simulado y la interfaz indica que no fue entregado por WhatsApp

### Requirement: Recuperarse de ejecuciones repetidas
El sistema MUST persistir el estado de las entregas y MUST evitar que varios ciclos o instancias de backend envíen simultáneamente la misma combinación de reserva y anticipación. Las entregas pendientes o fallidas MUST poder reintentarse.

#### Scenario: El ciclo vuelve a revisar un recordatorio enviado
- **WHEN** otro ciclo procesa una combinación marcada como enviada
- **THEN** el sistema no vuelve a llamar al proveedor

#### Scenario: Reintentar una entrega fallida
- **WHEN** una llamada al proveedor falla
- **THEN** el sistema registra el error y deja la entrega elegible para un reintento
