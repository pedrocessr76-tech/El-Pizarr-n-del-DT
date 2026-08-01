## 1. Project scaffolding

- [x] 1.1 Create the base HTML, CSS, and JavaScript structure for the app
- [x] 1.2 Add a sample dataset of football players and initial team state

## 2. Backend: SQLite + TypeORM + Entidades

- [x] 2.1 Configurar SQLite y TypeORM en el servidor NestJS
- [x] 2.2 Crear entidades para Player, Team, TeamPlayer, Match, User
- [x] 2.3 Crear script de Seeding con jugadores de la Premier League y La Liga
- [x] 2.4 Refactorizar DraftService y MatchService para usar la base de datos

## 3. Frontend: Catálogo y equipo

- [x] 3.1 Render the player catalog and allow adding players to the team (Frontend)
- [x] 3.2 Display the current roster and support removing players (Frontend)

## 4. Match simulation

- [x] 4.1 Generate a random opponent team for each challenge (Backend)
- [x] 4.2 Calculate the match, persist result, and show winner (Backend)
- [ ] 4.3 Crear MatchCenterScreen.tsx (Frontend)
- [ ] 4.4 Crear BracketScreen.tsx (Frontend)

## 5. User Authentication and Profile

- [x] 5.1 Auth module con JWT (register, login, profile) — Backend
- [x] 5.2 LoginScreen conectado a API con register/login — Frontend
- [x] 5.3 Sesión persistente con JWT en localStorage

## 6. Conexión Frontend-Backend

- [ ] 6.1 Conectar DraftRoomScreen con la API de draft
- [ ] 6.2 Conectar MatchCenterScreen/BracketScreen con la API de match
- [ ] 6.3 Conectar DashboardScreen con datos del usuario desde la API

## 7. Verification

- [ ] 7.1 Add automated tests for the core match logic
- [ ] 7.2 Add automated tests for the draft and auth flows
- [ ] 7.3 Run tests and preview the app locally
