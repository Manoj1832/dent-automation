# DentFlow - Dental Clinic Management Platform
## Project Architecture & Documentation

DentFlow (CliniQ) is a comprehensive, enterprise-grade Dental Clinic Management System. It bridges the gap between patient communication (via WhatsApp automation) and robust clinical operations.

---

## 1. Project Scope & Overview
DentFlow is designed to handle the end-to-end lifecycle of a dental practice. It provides a real-time dashboard for doctors and clinic staff while offering patients a seamless, automated booking experience directly through WhatsApp. 

**Key Objectives:**
- **Automated Patient Intake**: Allow patients to book, reschedule, or cancel appointments via an AI-powered WhatsApp bot without human intervention.
- **Real-Time Clinical Operations**: Manage live queues, prioritize emergency patients, and instantly update doctor dashboards via WebSockets.
- **Comprehensive Medical Records**: Store and track medical histories, chief complaints, oral examinations, and comprehensive treatment plans.
- **Business Operations**: Handle invoicing, analytics, and laboratory case tracking.

---

## 2. Technology Stack & Integrations
- **Backend**: NestJS (Node.js) framework.
- **Database**: PostgreSQL hosted on Supabase with PgBouncer connection pooling.
- **ORM**: Prisma for type-safe database queries.
- **Caching & Queues**: Redis (Upstash) for O(1) deduplication, rate limiting, distributed slot locks, and real-time priority queues.
- **Frontend**: React / Next.js with TailwindCSS.
- **External Integrations**:
  - **Meta WhatsApp Cloud API**: Handles all incoming Webhooks and outgoing conversational messages.
  - **LangGraph / Groq AI**: Powers the AI chatbot capabilities for handling complex patient queries.

---

## 3. Core Features & Capabilities
1. **WhatsApp Conversational Engine**:
   - **Smart Matching**: Uses custom fuzzy-matching algorithms to recognize patients even if they misspell their names.
   - **Idempotency**: Redis-backed `SETNX` deduplication ensures webhooks sent multiple times by Meta are only processed once.
   - **Human Takeover**: Gracefully hands over the conversation to clinical staff if the bot fails to understand the patient after multiple retries.
2. **Real-Time Priority Queues**:
   - WebSockets instantly emit `appointment:update` and `queue:update` events.
   - Emergency patients are automatically prioritized using Redis sorted sets (ZSET).
3. **Distributed Locking**:
   - Distributed Redis locks ensure that two patients trying to book the exact same slot concurrently do not cause double-bookings.
4. **Analytics & Billing**:
   - Generates invoices, tracks payments, and provides real-time revenue and patient-growth analytics.

---

## 4. Services & Modules
The backend architecture is heavily modularized into distinct business domains:

- **`WhatsAppModule`**: Handles the Meta Webhooks, payload parsing, idempotency, conversational state machine, and outbound API calls.
- **`AppointmentModule`**: Manages CRUD for appointments, integrates with the `PriorityQueueService` for Redis scheduling.
- **`RealtimeModule`**: Contains the `RealtimeGateway` (Socket.io) that pushes live state updates to the frontend dashboard.
- **`AuthModule`**: Secures endpoints using JWT.
- **`PatientModule`**: Manages patient identities, QR code generation, and search autocomplete.
- **`MedicalHistoryModule` & `ChiefComplaintModule`**: Stores clinical intake forms.
- **`OralExaminationModule`**: Manages findings, tooth charts, and condition tracking.
- **`TreatmentPlanModule`**: Links procedures to specific patients.
- **`AiModule`**: Connects the clinic to LangGraph-based agents for intelligent chat.

---

## 5. Endpoints & Routes Overview
All endpoints are prefixed with `/api`.

### 🟢 WhatsApp & AI
- `POST /api/whatsapp/webhook` - Core entry point for Meta WhatsApp payloads.
- `GET /api/whatsapp/webhook` - Verification endpoint for Meta dashboard.
- `POST /api/ai/chat` - External AI query endpoint.

### 🟢 Appointments & Queues
- `POST /api/appointments` - Create a new appointment.
- `GET /api/appointments` - List all appointments.
- `GET /api/appointments/queue` - Get the real-time ordered queue for a specific doctor.
- `GET /api/appointments/stats` - Fetch appointment statistics (completed, missed, cancelled).

### 🟢 Patients & Doctors
- `POST /api/patients` - Register a new patient.
- `GET /api/patients/autocomplete` - Fast patient search for dropdowns.
- `GET /api/patients/qr/:id` - Fetch patient QR code for walk-in check-ins.
- `GET /api/doctors` - Retrieve available doctors.

### 🟢 Clinical Operations
- `GET /api/oral-examinations/patient/:patientId/latest` - Fetch recent dental charts.
- `POST /api/treatment-plans` - Create a multi-step treatment timeline.
- `POST /api/lab-cases` - Register a prosthetic/lab order.

### 🟢 Billing & Analytics
- `GET /api/analytics/revenue` - Clinic financial graphs.
- `GET /api/analytics/patient-growth` - Intake metrics.
- `POST /api/billing/invoices` - Generate an invoice.

---

## 6. End-to-End Flow (Example: WhatsApp Booking)
1. **Trigger**: Patient sends "Book appointment" to the clinic's WhatsApp number.
2. **Webhook**: Meta sends an HTTP POST to `/api/whatsapp/webhook`.
3. **Deduplication**: `WhatsAppService` checks Redis `wa_dedup:{msgId}`. If valid, passes to the EventEmitter.
4. **State Machine**: `ConversationEngineService` fetches the user's cached state from Redis. It asks for Doctor preference and Date.
5. **Locking**: Once selected, `AppointmentWorkflowService` requests a Redis distributed lock for the specific doctor and timeslot.
6. **Persistence**: A Prisma transaction saves the `Appointment` to Supabase.
7. **Real-time Push**: `PriorityQueueService` adds the patient to the Redis ZSET queue and `RealtimeGateway` broadcasts a WebSocket ping to the Next.js frontend.
8. **Confirmation**: `WhatsAppSenderService` sends a successfully formatted WhatsApp confirmation back to the patient.
