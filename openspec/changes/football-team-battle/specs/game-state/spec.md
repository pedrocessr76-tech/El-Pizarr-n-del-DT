## ADDED Requirements

### Requirement: Match summary view
The system SHALL present a clear summary of the last played match.

#### Scenario: Display match outcome
- **WHEN** a match challenge is completed
- **THEN** the system SHALL show the result summary, the ratings of both teams, and the winner

### Requirement: Team status feedback
The system SHALL inform the user whether the current team is ready for a match.

#### Scenario: Team readiness feedback
- **WHEN** the user roster is incomplete or complete
- **THEN** the system SHALL show an appropriate readiness message
