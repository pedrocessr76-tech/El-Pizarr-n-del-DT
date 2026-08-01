## REQUISITOS AGREGADOS

### Requisito: Registro de usuario
El sistema DEBE permitir a los usuarios crear una cuenta con nombre de usuario y contraseña.

#### Escenario: Registrar nueva cuenta
- **CUANDO** un usuario completa el formulario de registro con username y password
- **ENTONCES** el sistema DEBE crear el usuario en la base de datos, hashear la contraseña con bcrypt y devolver un token JWT

### Requisito: Inicio de sesión con JWT
El sistema DEBE autenticar a los usuarios mediante username + password y devolver un token JWT.

#### Escenario: Login exitoso
- **CUANDO** un usuario ingresa username y password correctos
- **ENTONCES** el sistema DEBE validar las credenciales contra la DB y devolver un accessToken JWT (expiración: 7 días)

#### Escenario: Login fallido
- **CUANDO** un usuario ingresa credenciales incorrectas
- **ENTONCES** el sistema DEBE devolver un error 401 Unauthorized con mensaje "Credenciales inválidas"

### Requisito: Persistencia del historial de partidos
El sistema DEBE vincular los resultados de los partidos jugados al perfil del usuario autenticado.

#### Escenario: Guardar resultado en el perfil
- **CUANDO** finaliza un partido simulado
- **ENTONCES** el sistema DEBE registrar el resultado (victoria, empate, derrota) en el historial del usuario

### Requisito: Continuidad de la sesión
El sistema DEBE recordar al usuario entre recargas de página para mantener la fluidez de la experiencia.

#### Escenario: Recuperar sesión al recargar
- **CUANDO** el usuario vuelve a abrir la aplicación
- **ENTONCES** el sistema DEBE detectar el token JWT en localStorage y cargar automáticamente el nombre y el historial del usuario

### Requisito: Pantalla de Login (Interfaz)
El sistema DEBE presentar una interfaz de usuario clara para que el jugador se identifique antes de acceder a la aplicación.

##### Escenario: Interfaz de ingreso
- **CUANDO** el usuario abre la aplicación por primera vez o no tiene una sesión activa
- **ENTONCES** el sistema DEBE mostrar una pantalla central con:
    - Un campo de texto para ingresar el "Nombre de Usuario"
    - Un campo de texto para ingresar la "Contraseña"
    - Un botón de acción con la etiqueta "Iniciar Sesión"
    - Un enlace para alternar a modo "Registro"
    - Validación que impida enviar si el nombre está vacío o tiene menos de 3 caracteres
    - Validación que impida enviar si la contraseña está vacía
    - Un mensaje de error claro en caso de validación fallida o credenciales inválidas
    - Indicador de carga (loading) mientras se procesa la solicitud

##### Escenario: Validación de entrada
- **CUANDO** el usuario intenta ingresar un nombre
- **ENTONCES** el sistema DEBE verificar que cumpla con el límite de caracteres (máximo 15)
