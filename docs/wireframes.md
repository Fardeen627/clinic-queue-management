# Wireframes (MVP)

## 1) Reception `/desk`

```text
┌────────────────────────── Reception ──────────────────────────────┐
│ [Doctor's Room ▼] [Patient Name] [Internal Note] [Priority □] [Add]│
│-------------------------------------------------------------------│
│ Waiting Queue (WAITING)                     Status Filter: [All ▼]│
│-------------------------------------------------------------------│
│ 001  F*Akhtar   10:12  Elapsed 08:31  (note icon) [Hold] [Delete]│
│ 002  A*Sharma   10:15  Elapsed 05:12                  [Hold] [Delete]│
│ 003  R*Patel    10:18  Elapsed 02:40                  [Hold] [Delete]│
│-------------------------------------------------------------------│
│ On Hold (HOLD)                                                     │
│ 014  M*Das      09:40  Elapsed 40:01                         [Resume]│
└───────────────────────────────────────────────────────────────────┘

* Internal notes are visible only to reception and doctor staff and are never displayed on the DID.

## 2) Doctor's Room (Call Controller) `/doctor`

```text
┌────────────────────────── Doctor's Room ──────────────────────────┐
│ [Doctor's Room ▼] Status: [In Service] Availability: [OFF/Lunch/Break ▼]│
│-------------------------------------------------------------------│
│ Current Call                                                       │
│ 001  F*Akhtar   Called 10:21:03   [Recall] [In Service] [Done]    │
│-------------------------------------------------------------------│
│ Next Patients                                                      │
│ 002  A*Sharma   Registered 10:15   Elapsed 06:10                  │
│ 003  R*Patel    Registered 10:18   Elapsed 03:35                  │
│-------------------------------------------------------------------│
│ [Call Next] (changes 002 to CALLED + triggers DID/voice announcement)│
└───────────────────────────────────────────────────────────────────┘

* Voice announcements can be customized according to clinic requirements.

## 3) Waiting Room DID (Fullscreen) `/display?room=...`

```text
┌─────────────────────────────────────────────────────────────────┐
│ [Clinic Logo] [Doctor's Room] Instruction                        │
│ "Please proceed to the doctor's room when your number is called" │
│─────────────────────────────────────────────────────────────────│
│                                                                 │
│  CURRENT CALL                                                   │
│  ┌──────────────────────────────┐                               │
│  │  001   F*Akhtar              │   (popup + voice announcement)│
│  └──────────────────────────────┘                               │
│                                                                 │
│  NEXT PATIENTS                                                  │
│  002  A*Sharma   10:15   Elapsed 06:10                         │
│  003  R*Patel    10:18   Elapsed 03:35                         │
│                                                                 │
│─────────────────────────────────────────────────────────────────│
│ [Video/Promotional Area]                                        │
│ (MP4/image/YouTube/stream playlist playback)                    │
└─────────────────────────────────────────────────────────────────┘

* The DID displays masked names (F*Akhtar); full names may be used for voice announcements.
* Registration time and elapsed waiting time are displayed.
* Call notifications and video content are displayed simultaneously.

## 4) Optional Admin `/admin`

- Doctor's room and queue rules (daily ticket number reset)
- Voice announcement templates
- DID theme and clinic logo
- Video playlist management