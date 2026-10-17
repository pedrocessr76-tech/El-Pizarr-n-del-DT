# Player Traits JSON Template

**Úsalo como referencia para agregar traits a tus JSONs de jugadores.**  
Cada jugador necesita los 22 campos numéricos (1-99) + `traitsJson` opcional.

---

## Estructura Completa

```json
{
  "id": "player-unique-id",
  "name": "Nombre Apellido",
  "nationality": "País",
  "position": "GK|DEF|MID|FWD",
  "rating": 75,
  "pace": 70,
  "shooting": 65,
  "passing": 72,
  "dribbling": 68,
  "defending": 75,
  "physical": 78,

  "aggression": 50,
  "discipline": 50,
  "composure": 50,
  "leadership": 50,
  "consistency": 50,
  "bigGamePlayer": 50,
  "injuryProneness": 50,
  "durability": 50,
  "flair": 50,
  "vision": 50,
  "penaltyTaking": 50,
  "freeKickAccuracy": 50,
  "aerialAbility": 50,
  "weakFoot": 50,
  "skillMoves": 50,
  "gkReflexes": 50,
  "gkHandling": 50,
  "gkAerialOut": 50,
  "gkCommunication": 50,
  "gkOneOnOnes": 50,

  "traitsJson": "{\"playingStyle\": [], \"preferredFoot\": \"right\"}"
}
```

---

## Qué Controla Cada Trait (Impacto en Simulación)

### Personalidad (Comportamiento)
| Trait | Qué Afecta | Valores Típicos |
|-------|------------|-----------------|
| **aggression** | Prob. tarjeta roja, faltas duras | 90+ = "matador" (Rojo, Ramos), 10-20 = limpio (Messi) |
| **discipline** | Evita rojas/amarillas, posición táctica | 90+ = disciplinado, 20-30 = pierde la cabeza |
| **composure** | Frío bajo presión, penaltis, momentos clave | 95+ = "ice man", <40 = se pone nervioso |
| **leadership** | Reduce momentum negativo, organiza defensa | 90+ = capitán nato, <30 = sigue la corriente |
| **consistency** | Variabilidad rendimiento partido a partido | 90+ = siempre rinde, <40 = "enchaquetado" |
| **bigGamePlayer** | Rinde MEJOR en semis/final (boost xG) | 90+ = aparece en finales, <40 = se esconde |
| **injuryProneness** | Frecuencia lesiones (más alto = más lesiones) | 70+ = "cristal", 20-30 = tanque |
| **durability** | Recuperación rápida, juega muchos minutos | 80+ = "hierro", <40 = necesita rotación |

### Técnicos (Especialidades)
| Trait | Qué Afecta | Valores Típicos |
|-------|------------|-----------------|
| **flair** | Regates, golazos, jugadas imposibles | 90+ = mago (Neymar, Ronaldinho), <30 = simple |
| **vision** | Pases clave, asistencias, lectura de juego | 90+ = arquitecto (Xavi, De Bruyne), <40 = directo |
| **penaltyTaking** | Especialista penaltis (>70 = lo tira) | 90+ = infalible, <50 = evita tirarlos |
| **freeKickAccuracy** | Faltas directas a gol | 85+ = especialista (Messi, Juninho), <40 = no tira |
| **aerialAbility** | Cabeceos, córners, juego aéreo | 90+ = bestia aérea (Ramos, Ronaldo), <40 = no salta |
| **weakFoot** | Pierna mala (afecta shooting/dribbling lado débil) | 90+ = ambidiestro, <40 = solo pie bueno |
| **skillMoves** | Regates complejos 1v1 (boost flair/dribbling) | 90+ = regateador élite, <40 = toque simple |

### Portero (Solo GK)
| Trait | Qué Afecta |
|-------|------------|
| **gkReflexes** | Paradas de reflejo, tiros cercanos |
| **gkHandling** | Blokeos, seguridad manos (evita howlers) |
| **gkAerialOut** | Salidas en centros/córners |
| **gkCommunication** | Organiza defensa, evita desmarques |
| **gkOneOnOnes** | Paradas en mano a mano |

---

## Plantillas por Arquetipo (Copiar/Pegar y Ajustar)

### 🔴 **Defensa Duro / "El Guerrero"** (Marcos Rojo, Sergio Ramos, Chiellini)
```json
{
  "aggression": 90,
  "discipline": 30,
  "composure": 60,
  "leadership": 85,
  "consistency": 70,
  "bigGamePlayer": 80,
  "injuryProneness": 60,
  "durability": 65,
  "flair": 35,
  "vision": 60,
  "penaltyTaking": 40,
  "freeKickAccuracy": 45,
  "aerialAbility": 90,
  "weakFoot": 55,
  "skillMoves": 40,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### 🟢 **Defensa Elegante / Líder Tranquilo** (Piqué, Van Dijk, Puyol)
```json
{
  "aggression": 55,
  "discipline": 85,
  "composure": 88,
  "leadership": 90,
  "consistency": 85,
  "bigGamePlayer": 85,
  "injuryProneness": 40,
  "durability": 75,
  "flair": 45,
  "vision": 75,
  "penaltyTaking": 50,
  "freeKickAccuracy": 50,
  "aerialAbility": 88,
  "weakFoot": 65,
  "skillMoves": 50,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### 🎨 **Mediocentro Creativo / "El 10"** (Messi, De Bruyne, Modric, Xavi)
```json
{
  "aggression": 20,
  "discipline": 90,
  "composure": 95,
  "leadership": 80,
  "consistency": 90,
  "bigGamePlayer": 95,
  "injuryProneness": 45,
  "durability": 70,
  "flair": 95,
  "vision": 98,
  "penaltyTaking": 85,
  "freeKickAccuracy": 90,
  "aerialAbility": 45,
  "weakFoot": 85,
  "skillMoves": 95,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### ⚽ **Delantero Rematador / "El 9"** (Ronaldo, Lewandowski, Kane, Haaland)
```json
{
  "aggression": 45,
  "discipline": 70,
  "composure": 90,
  "leadership": 70,
  "consistency": 85,
  "bigGamePlayer": 90,
  "injuryProneness": 50,
  "durability": 75,
  "flair": 80,
  "vision": 75,
  "penaltyTaking": 90,
  "freeKickAccuracy": 70,
  "aerialAbility": 85,
  "weakFoot": 80,
  "skillMoves": 75,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### 🧤 **Portero de Elite** (Oblak, Courtois, Alisson, Neuer)
```json
{
  "aggression": 40,
  "discipline": 80,
  "composure": 95,
  "leadership": 85,
  "consistency": 90,
  "bigGamePlayer": 90,
  "injuryProneness": 35,
  "durability": 85,
  "flair": 30,
  "vision": 60,
  "penaltyTaking": 50,
  "freeKickAccuracy": 30,
  "aerialAbility": 70,
  "weakFoot": 50,
  "skillMoves": 20,
  "gkReflexes": 95,
  "gkHandling": 92,
  "gkAerialOut": 88,
  "gkCommunication": 90,
  "gkOneOnOnes": 93
}
```

### 🏃 **Extremo Veloz / Regateador** (Vinicius, Mbappé, Salah, Neymar)
```json
{
  "aggression": 35,
  "discipline": 60,
  "composure": 75,
  "leadership": 55,
  "consistency": 70,
  "bigGamePlayer": 80,
  "injuryProneness": 55,
  "durability": 65,
  "flair": 95,
  "vision": 80,
  "penaltyTaking": 70,
  "freeKickAccuracy": 65,
  "aerialAbility": 50,
  "weakFoot": 75,
  "skillMoves": 98,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### 🛡️ **Mediocentro Defensivo / "El 6"** (Casemiro, Rodri, Kante, Busquets)
```json
{
  "aggression": 75,
  "discipline": 80,
  "composure": 85,
  "leadership": 80,
  "consistency": 90,
  "bigGamePlayer": 85,
  "injuryProneness": 45,
  "durability": 80,
  "flair": 40,
  "vision": 70,
  "penaltyTaking": 45,
  "freeKickAccuracy": 40,
  "aerialAbility": 70,
  "weakFoot": 65,
  "skillMoves": 55,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

### 📦 **Jugador Promedio / Rotación** (Relleno de plantilla)
```json
{
  "aggression": 50,
  "discipline": 50,
  "composure": 50,
  "leadership": 50,
  "consistency": 50,
  "bigGamePlayer": 50,
  "injuryProneness": 50,
  "durability": 50,
  "flair": 50,
  "vision": 50,
  "penaltyTaking": 50,
  "freeKickAccuracy": 50,
  "aerialAbility": 50,
  "weakFoot": 50,
  "skillMoves": 50,
  "gkReflexes": 0,
  "gkHandling": 0,
  "gkAerialOut": 0,
  "gkCommunication": 0,
  "gkOneOnOnes": 0
}
```

---

## `traitsJson` - Metadatos Extensibles (Opcional)

```json
{
  "playingStyle": ["hard_tackler", "aerial_threat", "leader"],
  "preferredFoot": "left",
  "rivalries": ["river_plate"],
  "specialTraits": ["penalty_specialist", "clutch", "free_kick_taker"],
  "personality": "warrior",
  "notes": "Se pierde la cabeza en derbis"
}
```

**Campos sugeridos:**
- `playingStyle`: array de strings (ver catálogo abajo)
- `preferredFoot`: "left" | "right" | "both"
- `rivalries`: array de team IDs o nombres
- `specialTraits`: array de traits especiales
- `personality`: "warrior" | "artist" | "leader" | "professional" | "mercurial" | "clutch"
- `notes`: texto libre para scouting

### Catálogo `playingStyle`
```
Defensa: hard_tackler, aerial_threat, ball_playing_defender, sweeper, interceptor
Medio: playmaker, box_to_box, deep_lying_playmaker, wide_playmaker, engine, destroyer
Delantero: poacher, target_man, false_nine, inside_forward, speedster, complete_forward
Portero: shot_stopper, sweeper_keeper, penalty_saver, aerial_commander
```

---

## Guía Rápida de Valores (1-99)

| Perfil | Aggression | Discipline | Composure | Flair | Vision | Aerial | BigGame |
|--------|------------|------------|-----------|-------|--------|--------|---------|
| **Leyenda/Élite** | 85-95 | 80-95 | 90-99 | 90-99 | 90-99 | 85-99 | 90-99 |
| **Top Mundial** | 70-90 | 70-90 | 80-95 | 80-95 | 80-95 | 75-95 | 80-95 |
| **Internacional** | 55-75 | 55-75 | 65-85 | 60-85 | 60-85 | 60-80 | 60-80 |
| **Liga Fuerte** | 45-65 | 45-65 | 50-70 | 45-70 | 45-70 | 45-65 | 45-65 |
| **Promedio** | 40-55 | 40-55 | 40-55 | 40-55 | 40-55 | 40-55 | 40-55 |
| **Reserva/Joven** | 30-50 | 30-50 | 30-50 | 30-50 | 30-50 | 30-50 | 30-50 |

---

## Boost por Nacionalidad (Aplicar al Backfill)

| Nacionalidad | Aggression | Flair | BigGame | Discipline |
|--------------|------------|-------|---------|------------|
| Argentina, Brasil, Uruguay, Chile, Colombia | +10 | +15 | +10 | -5 |
| España, Italia, Alemania, Francia | +5 | +10 | +5 | +5 |
| Inglaterra, Portugal, Países Bajos | +5 | +5 | +5 | 0 |
| Resto | 0 | 0 | 0 | 0 |

> **Nota**: El backfill automático ya aplica esto. Si editas manualmente, tenlo en cuenta.

---

## Ejemplos Reales (Referencia)

### Marcos Rojo (Boca/Argentina) - DEF
```json
"aggression": 92, "discipline": 28, "composure": 55, "leadership": 88,
"consistency": 70, "bigGamePlayer": 75, "injuryProneness": 65, "durability": 60,
"flair": 35, "vision": 65, "penaltyTaking": 40, "freeKickAccuracy": 45,
"aerialAbility": 90, "weakFoot": 55, "skillMoves": 40
```

### Lionel Messi (Inter Miami/Argentina) - FWD
```json
"aggression": 15, "discipline": 95, "composure": 98, "leadership": 85,
"consistency": 95, "bigGamePlayer": 98, "injuryProneness": 40, "durability": 75,
"flair": 99, "vision": 98, "penaltyTaking": 85, "freeKickAccuracy": 93,
"aerialAbility": 45, "weakFoot": 90, "skillMoves": 99
```

### Sergio Ramos (Sevilla/España) - DEF
```json
"aggression": 88, "discipline": 35, "composure": 80, "leadership": 95,
"consistency": 80, "bigGamePlayer": 95, "injuryProneness": 55, "durability": 70,
"flair": 60, "vision": 75, "penaltyTaking": 90, "freeKickAccuracy": 70,
"aerialAbility": 95, "weakFoot": 70, "skillMoves": 65
```

### Jan Oblak (Atlético/Eslovenia) - GK
```json
"aggression": 40, "discipline": 80, "composure": 95, "leadership": 85,
"consistency": 90, "bigGamePlayer": 90, "injuryProneness": 35, "durability": 85,
"flair": 30, "vision": 60, "penaltyTaking": 50, "freeKickAccuracy": 30,
"aerialAbility": 70, "weakFoot": 50, "skillMoves": 20,
"gkReflexes": 95, "gkHandling": 92, "gkAerialOut": 88, "gkCommunication": 90, "gkOneOnOnes": 93
```

---

## Checklist al Agregar un Jugador

- [ ] Todos los 22 traits numéricos (1-99)
- [ ] `traitsJson` con `playingStyle` y `preferredFoot` mínimo
- [ ] Coherencia: position + traits tienen sentido (GK tiene GK traits > 0, otros 0)
- [ ] Nacionalidad: si es latino, aggression/flair/bigGamePlayer más altos
- [ ] Rating alto (>85): consistency/composure > 80
- [ ] Especialista: penaltyTaking > 80 o freeKickAccuracy > 80 si es conocido por eso

---

## Archivos Relacionados en el Proyecto

| Archivo | Qué Contiene |
|---------|--------------|
| `apps/server/src/player/player.entity.ts` | Columnas BD (source of truth) |
| `packages/shared/types/models.ts` | Interface `Player` compartida |
| `apps/server/src/match/match-simulation.ts` | Lógica de incidentes (lee traits) |
| `openspec/changes/match-simulation-player-traits/design.md` | Fórmulas exactas de probabilidad |
| `scripts/backfill-player-traits.ts` | Script de inferencia automática |

---

**¿Dudas?** Revisa `design.md` en el openspec para las fórmulas matemáticas exactas de cómo cada trait modifica la probabilidad de cada incidente.