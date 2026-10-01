## ADDED Requirements

### Requirement: Configurar anticipaciones por canal
El sistema MUST permitir a staff configurar, de forma independiente, una lista de anticipaciones en minutos antes del inicio del turno para el canal de email y otra para el canal de WhatsApp. Una organización nueva MUST comenzar con 1440 minutos (24 horas) en email y 30 minutos en WhatsApp. El sistema MUST tratar cada lista como opcional e independiente de la otra: una organización MAY tener anticipaciones sólo en un canal.

#### Scenario: Guardar anticipaciones válidas
- **WHEN** staff guarda una lista de anticipaciones válidas para uno de los canales
- **THEN** el sistema persiste la configuración de ese canal para su organización, conserva la del otro canal sin alterarla y la devuelve al dashboard

#### Scenario: Guardar una lista vacía
- **WHEN** staff guarda una lista vacía para un canal
- **THEN** el sistema persiste la lista vacía y el sistema deja de generar recordatorios para ese canal, sin afectar al otro

#### Scenario: Rechazar anticipaciones inválidas
- **WHEN** staff intenta guardar anticipaciones no enteras, no positivas o fuera del límite permitido
- **THEN** el sistema rechaza el cambio y conserva la configuración anterior de ese canal

#### Scenario: Un mismo valor en los dos canales
- **WHEN** staff configura el mismo número de minutos en email y en WhatsApp
- **THEN** el sistema lo acepta y genera un recordatorio independiente por canal

### Requirement: Enrutar cada recordatorio al canal configurado
El sistema MUST resolver el canal de un recordatorio a partir de la anticipación vencida y de las listas de la organización, y MUST distinguir un recordatorio de email de uno de WhatsApp aunque compartan reserva y anticipación.

#### Scenario: Anticipación configurada en un solo canal
- **WHEN** una anticipación figura únicamente en la lista de email
- **THEN** el sistema genera un recordatorio de email y no genera uno de WhatsApp para esa anticipación

#### Scenario: Anticipación en la lista de WhatsApp
- **WHEN** una anticipación figura en la lista de WhatsApp
- **THEN** el sistema genera un recordatorio de WhatsApp en estado pendiente de despacho manual, sin invocar ningún proveedor

#### Scenario: Misma anticipación en ambos canales
- **WHEN** una anticipación figura en las dos listas
- **THEN** el sistema crea un registro de recordatorio por canal y ninguno cancela al otro
