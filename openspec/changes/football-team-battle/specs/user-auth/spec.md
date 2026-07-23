## REQUISITOS AGREGADOS

### Requisito: Identidad de usuario y perfil
El sistema DEBE permitir a los usuarios identificarse para mantener un perfil persistente que incluya su nombre y su historial de actividad.

#### Escenario: Inicio de sesión con nombre de usuario
- **CUANDO** un usuario ingresa su nombre en la pantalla de inicio
- **ENTONCES** el sistema DEBE crear o recuperar su perfil y mostrar un mensaje de bienvenida personalizado

### Requisito: Persistencia del historial de partidos
El sistema DEBE vincular los resultados de los partidos jugados al perfil del usuario autenticado.

#### Escenario: Guardar resultado en el perfil
- **CUANDO** finaliza un partido simluado
- **ENTONCES** el sistema DEBE registrar el resultado (victoria, empate, derrota) en el historial del usuario

### Requisito: Continuidad de la sesión
El sistema DEBE recordar al usuario entre recargas de página para mantener la fluidez de la experiencia.

#### Escenario: Recuperar sesión al recargar
- **CUANDO** el usuario vuelve a abrir la aplicación
- **ENTONCES** el sistema DEBE detectar la sesión previa y cargar automáticamente el nombre y el historial del usuario
