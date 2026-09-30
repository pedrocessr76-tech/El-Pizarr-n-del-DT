## ADDED Requirements

### Requirement: Dashboard groups courts by facility
The staff dashboard SHALL let staff choose a facility and show only the courts belonging to that facility.

#### Scenario: Select a facility
- **WHEN** staff selects a facility on the dashboard
- **THEN** the dashboard shows that facility's courts and does not show courts from other facilities

#### Scenario: No facilities or courts exist
- **WHEN** the organization has no facilities or the selected facility has no courts
- **THEN** the dashboard shows a clear empty state and an action to manage facilities or courts

### Requirement: Show daily court occupancy and occupied times
The staff dashboard SHALL show each selected court's daily shift states and clearly identify occupied shifts and their local start/end times.

#### Scenario: Court has occupied and available shifts
- **WHEN** the selected facility has shifts for the selected day
- **THEN** each court card distinguishes pending or confirmed occupied shifts from available and blocked shifts and lists the occupied time ranges

#### Scenario: Selected date changes
- **WHEN** staff selects another date
- **THEN** the dashboard reloads and shows only shifts for that date in the organization's timezone

### Requirement: Open a booking from its occupied shift
The staff dashboard SHALL let staff open the existing booking detail for an occupied shift that is linked to a booking.

#### Scenario: Select a booked time range
- **WHEN** staff selects a pending or confirmed shift linked to a booking
- **THEN** the dashboard opens that booking's existing detail view
