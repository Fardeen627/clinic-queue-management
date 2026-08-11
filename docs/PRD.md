# Clinic Queue MVP

## Scope

- **Reception**: Add/remove patients, hold/resume patients, manage queue order, and add internal notes (not displayed to patients)
- **Doctor's Room**: Call next/recall patients, mark as in service/completed, and optionally toggle room availability
- **Waiting Room DID**: Display queue number, masked name, registration time, elapsed waiting time, and highlight the currently called patient
- **Call Announcements**: Customizable voice announcements and on-screen call notifications
- **Video/Promotional Content**: Play videos/promotional content within the DID display area
- **Installation Environment**: Designed for a hospital/clinic Wi-Fi network with reception, doctor's room, and DID PCs/displays

## Key Rules

- Only masked patient names are displayed on the DID
- Full names may be used for voice announcements
- Reception notes are never displayed on the DID
- Call notifications and video content are displayed simultaneously

## Roles

- **Reception**
- **Doctor's Room**
- **Waiting Room DID**
- **Administrator** (Optional)