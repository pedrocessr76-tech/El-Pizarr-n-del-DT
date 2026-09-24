## ADDED Requirements

### Requirement: Servicio de mensajería desacoplado del proveedor
El sistema MUST exponer un servicio de mensajería (`MessagingService`) con una interfaz única para enviar mensajes de WhatsApp, de modo que los consumidores (recordatorios, confirmaciones de seña, resumen diario) no dependan del proveedor concreto. El adaptador activo MUST seleccionarse por configuración. Mientras no haya un proveedor real configurado, el adaptador por defecto MUST ser un placeholder que registra/loguea el envío simulándolo (sin conexión externa) y reporta éxito.

#### Scenario: Envío con adaptador placeholder
- **WHEN** un consumidor solicita enviar un mensaje y no hay proveedor configurado
- **THEN** el sistema registra en el log los datos del envío (destinatario, mensaje, tipo) y responde como envío realizado sin contactar a ningún servicio externo

#### Scenario: Proveedor configurado
- **WHEN** se configura un proveedor real (p. ej. credenciales de WhatsApp Cloud API o sesión WhatsApp Web) y un consumidor solicita un envío
- **THEN** el sistema delega el envío al adaptador del proveedor y reporta el resultado real

### Requirement: Regla de no-envío sin consentimiento
El sistema MUST NO enviar mensajes de WhatsApp a un teléfono cuyo `whatsappOptIn` sea `false` o que no tenga `whatsappPhone` cargado. Si un consumidor solicita un envío a un destinatario sin consentimiento, el sistema MUST omitir el envío y registrarlo en el log. El envío de un mensaje de tipo recordatorio/transaccional MUST validar el consentimiento en el momento del envío (no solo al guardar el teléfono).

#### Scenario: Destinatario sin consentimiento
- **WHEN** un consumidor solicita enviar un recordatorio a un cliente con `whatsappOptIn=false`
- **THEN** el sistema no ejecuta el envío y lo anota en el log como omitido por falta de consentimiento

#### Scenario: Destinatario con consentimiento
- **WHEN** un consumidor solicita enviar un recordatorio a un cliente con `whatsappPhone` y `whatsappOptIn=true`
- **THEN** el sistema entrega el mensaje al adaptador activo (placeholder o proveedor real)

### Requirement: Configuración por entorno
El sistema MUST leer la configuración de mensajería desde variables de entorno (tiempo de arranque): tipo de adaptador activo (`MESSAGING_PROVIDER`), y las credenciales opcionales del proveedor si aplica. La ausencia de configuración MUST dejar el sistema funcionando con el adaptador placeholder sin errores de arranque.

#### Scenario: Sin config de proveedor
- **WHEN** el servidor arranca sin variables de proveedor de mensajería
- **THEN** el sistema usa el adaptador placeholder y arranca normalmente

#### Scenario: Con config de proveedor incompleta
- **WHEN** el servidor arranca con un `MESSAGING_PROVIDER` definido pero credenciales incompletas
- **THEN** el sistema arranca (no falla el boot) y el adaptador registra el error de envío por cada intento