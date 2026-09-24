## ADDED Requirements

### Requirement: Teléfono y consentimiento de WhatsApp en el perfil
El sistema MUST almacenar en la cuenta B2B del usuario un número de WhatsApp opcional (`whatsappPhone`) y un flag de consentimiento explícito (`whatsappOptIn`, booleano, default `false`) para el envío de mensajes. El teléfono MUST guardarse normalizado como E.164 (código de país + número, sin espacios ni guiones) y MUST validarse su formato antes de persistir. Un teléfono vacío MUST considerarse "sin WhatsApp configurado". Una organización MUST almacenar también su propio `whatsappPhone` y `whatsappOptIn` para recibir notificaciones operativas (p. ej. resumen diario).

#### Scenario: Cliente configura su WhatsApp con consentimiento
- **WHEN** un cliente autenticado guarda su número de teléfono y acepta el consentimiento
- **THEN** el sistema persiste el teléfono normalizado (E.164) con `whatsappOptIn=true` y lo devuelve en su perfil

#### Scenario: Cliente guarda WhatsApp sin consentimiento
- **WHEN** un cliente autenticado guarda un teléfono sin aceptar el consentimiento
- **THEN** el sistema persiste el teléfono con `whatsappOptIn=false` y no autoriza ningún envío a ese teléfono

#### Scenario: Formato inválido
- **WHEN** un cliente intenta guardar un teléfono que no cumple el formato de WhatsApp (p. ej. sin código de país o con letras)
- **THEN** el sistema rechaza la operación con un error de validación y no modifica el perfil

#### Scenario: Cliente revoca el consentimiento
- **WHEN** un cliente autenticado revoca el consentimiento o vacía su WhatsApp
- **THEN** el sistema deja `whatsappOptIn=false` y no envía más mensajes a ese teléfono

#### Scenario: Organización configura su WhatsApp
- **WHEN** un staff (OWNER/ADMIN) guarda el WhatsApp de la organización
- **THEN** el sistema persiste el teléfono de la organización y queda disponible como destino de avisos operativos

### Requirement: Gestión del perfil por API
El sistema MUST exponer `PATCH /api/v1/auth/profile` (autenticado con JWT B2B) para actualizar el teléfono de WhatsApp y el consentimiento del usuario actual. El sistema MUST incluir `whatsappPhone` y `whatsappOptIn` en `GET /api/v1/auth/me`. Un staff con acceso de administración a su organización MUST poder actualizar el WhatsApp de la organización a través de la misma gestión de perfil.

#### Scenario: Usuario actualiza su teléfono
- **WHEN** un usuario B2B autenticado envía `PATCH /api/v1/auth/profile` con su WhatsApp y opt-in
- **THEN** el sistema actualiza su perfil y devuelve el perfil resultante

#### Scenario: GET me incluye el contacto
- **WHEN** un usuario B2B autenticado consulta `GET /api/v1/auth/me`
- **THEN** la respuesta incluye `whatsappPhone`, `whatsappOptIn` y los roles del usuario

#### Scenario: No autenticado
- **WHEN** una solicitud sin JWT válido intenta `PATCH /api/v1/auth/profile`
- **THEN** el sistema rechaza la operación (401)

### Requirement: Interfaz de perfil en el frontend B2B
El frontend de Sistema Canchas MUST ofrecer una sección de perfil (cliente y staff) para ver y editar el número de WhatsApp y el consentimiento. El opt-in MUST requerir una acción explícita del usuario (checkbox con texto de consentimiento). El frontend MUST reflejar el estado guardado (teléfono + opt-in) al cargar y tras guardar.

#### Scenario: Cliente edita su contacto desde la app
- **WHEN** un cliente abre su perfil, ingresa su WhatsApp y marca el consentimiento
- **THEN** el frontend guarda vía `PATCH /api/v1/auth/profile` y muestra confirmación

#### Scenario: El opt-in es explícito
- **WHEN** un cliente tiene un teléfono cargado pero no marcó el consentimiento
- **THEN** el frontend muestra el campo de consentimiento sin marcar y deja claro que no recibirá mensajes hasta aceptarlo

#### Scenario: Staff gestiona el WhatsApp de su organización
- **WHEN** un staff abre la configuración y guarda el WhatsApp de la organización con consentimiento
- **THEN** el frontend persiste el contacto de la organización y muestra el estado guardado