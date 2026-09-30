## ADDED Requirements

### Requirement: Persistir configuración y estado de recordatorios
El esquema B2B MUST almacenar las anticipaciones de email y de WhatsApp por organización como listas independientes, y MUST mantener un registro persistente por reserva, canal y anticipación con una clave única que permita deduplicar el procesamiento de cada canal.

#### Scenario: Crear esquema actualizado
- **WHEN** se aplica la migración B2B
- **THEN** las organizaciones existentes reciben `[1440]` en email y `[30]` en WhatsApp, la tabla de entregas gana la columna de canal y su restricción única pasa a ser por reserva, canal y anticipación

#### Scenario: Los registros heredados no se pierden
- **WHEN** la migración se aplica sobre una base que ya tiene entregas registradas
- **THEN** los registros existentes quedan asociados al canal de WhatsApp, que es el único que el sistema procesaba antes de este cambio, y ninguno queda huérfano

#### Scenario: Revertir esquema actualizado
- **WHEN** se revierte la migración B2B
- **THEN** se restaura la restricción única anterior, se elimina la columna de canal y se elimina la columna de anticipaciones de email

### Requirement: Conservar el estado de los avisos despachados a mano
El esquema MUST distinguir un aviso de WhatsApp que espera ser despachado por el staff de uno enviado por el servidor, de modo que el processor no lo regenere en cada ciclo y el panel pueda ofrecerlo sólo una vez.

#### Scenario: El aviso queda esperando al staff
- **WHEN** el processor vence una anticipación de WhatsApp
- **THEN** el registro queda en un estado de espera y no se reintenta en los ciclos siguientes

#### Scenario: El staff lo despacha
- **WHEN** staff confirma el despacho
- **THEN** el registro pasa a enviado y el panel deja de ofrecerlo
