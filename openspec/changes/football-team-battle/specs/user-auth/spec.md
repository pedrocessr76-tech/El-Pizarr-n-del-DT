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

#### Requisito: Pantalla de Login (Interfaz)
El sistema DEBE presentar una interfaz de usuario clara para que el jugador se identifique antes de acceder a la aplicación.

##### Escenario: Interfaz de ingreso
- **CUANDO** el usuario abre la aplicación por primera vez o no tiene una sesión activa
- **ENTONCES** el sistema DEBE mostrar una pantalla central con:
    - Un campo de texto para ingresar el "Nombre de Usuario"
    - Un botón de acción con la etiqueta "Comenzar" o "Ingresar"
    - Una validación que impida enviar el formulario si el nombre está vacío o tiene menos de 3 caracteres
    - Un mensaje de error claro en caso de validación fallida

##### Escenario: Validación de entrada
- **CUANDO** el usuario intenta ingresar un nombre
- **ENTONCES** el sistema DEBE verificar que no contenga caracteres especiales no permitidos y que cumpla con el límite de caracteres (máximo 15)
