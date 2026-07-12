## ADDED Requirements

### Requirement: Random opponent generation
The system SHALL generate an opponent team with players selected from the available catalog.

#### Scenario: Create opponent team
- **WHEN** a user starts a match challenge
- **THEN** the system SHALL build a random opponent roster using the available players

### Requirement: Match score comparison
The system SHALL compare the overall rating of the user team and the opponent team.

#### Scenario: Compare teams
- **WHEN** a match is resolved
- **THEN** the system SHALL calculate the relative rating and declare a winner or a draw
