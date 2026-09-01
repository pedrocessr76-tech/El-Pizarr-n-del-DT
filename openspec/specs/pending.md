# Pendiente — Próximos Pasos

## Backend

### Calidad / Infraestructura
- Tests automatizados para el núcleo de simulación, los flujos de draft y de auth
- Migraciones versionadas en lugar de `synchronize: true` (riesgo en producción)

## Frontend

### Overlay de partido en vivo — Cancha con jugadores en movimiento ✅ implementado
- En el **overlay del partido en vivo** se renderiza la **cancha con 22 puntos** (11 por equipo, 1 por jugador de la alineación) que se mueven minuto a minuto.
  - Posición base por **zona FIFA** del jugador (GK/DEF/MID/FWD) con distribución escalonada por filas (arquero, defensa, medios y ataque), orientada según la cancha vertical del overlay (su equipo defiende un arco, el rival el otro).
  - **Movimiento continuo** (deriva suave sinusoidal) sincronizado con el reloj de la simulación (avanza según x30/x60/x90) y con transición CSS.
  - **Empuje por posesión**: el juego completo (ambos equipos) se desplaza hacia el arco rival cuando un equipo domina la posesión.
  - **Resaltado (pulse)** del equipo que marca en el minuto en curso, y refleja las sustituciones del botón "Cambios" (los puntos usan la alineación mutable).
  - Renderizado con el estilo visual de la página (dots con iniciales, colores tertiary/neutral) dentro del pitch existente.

### Overlay de partido en vivo — Botón "Cambios" (sustituciones en tiempo real) ✅ implementado
- Botón **"Cambios"** en el header del overlay que abre un panel con los **11 titulares** y los **7 suplentes** del equipo del usuario para **intercambiarlos** durante el partido.
- Restricciones implementadas: máximo **5 cambios** por partido (regla de producto), solo habilitado mientras el partido está en juego (no al terminar), y el reemplazado pasa a suplente mientras el ingresado pasa a titular.
- El cambio se registra en el feed de eventos y **afecta la simulación posterior**: el rating del nuevo once recalcula posesión/tiros del resto del partido.
- Pendiente (opcional): persistir el cambio en el modelo de datos del backend y que influya en la simulación del servidor.

## Producto (fuera de alcance actual)

- Modo de juego más avanzado con puntuaciones y estadísticas por jugador (más allá del bracket)
- Sistema de ranking/leaderboard global entre usuarios
- Persistencia y configuración por entorno para el catálogo sincronizado desde disco