# MASTER PROMPT — DentFlow (Dental Clinic Management & Automation System)

You are a senior software architect, healthcare workflow engineer, PostgreSQL database architect, NestJS backend engineer, and Next.js frontend engineer.

Your task is to design and build a COMPLETE production-grade Dental Clinic Management & Automation Platform called:

# DentFlow

The platform should focus on:

* operational simplicity
* clinic workflow automation
* low maintenance
* high scalability
* fast receptionist workflow
* modular architecture
* future schema flexibility

IMPORTANT:
The schema, tables, relationships, and business logic MUST remain highly flexible and easily modifiable later because clinic workflows evolve frequently.

Avoid rigid over-engineered architecture.

The system should be designed as:

# Modular Monolith Architecture

NOT microservices initially.

---

# PRIMARY GOAL

The clinic currently:

* maintains physical patient cards
* has ~15,000 patient records
* manually searches returning patients
* manually handles appointments
* manually coordinates with labs
* wants to digitize workflow
* wants QR-based patient retrieval
* wants automation to reduce manual work

The application must:

* reduce receptionist workload
* digitize patient records
* automate reminders
* improve reliability
* improve patient retention
* improve operational speed

---

# CORE BUSINESS MODEL

This is NOT a patient-facing SaaS initially.

This is:

# Internal Clinic Operating System

Patients DO NOT require accounts/login.

Instead:

* each patient receives a virtual ID
* QR code generated
* clinic staff accesses records internally

Only clinic staff login is required.

---

# CORE ARCHITECTURE

# Frontend

* Next.js App Router
* TypeScript
* TailwindCSS
* shadcn/ui
* TanStack Query
* Zustand

---

# Backend

* NestJS
* TypeScript
* Prisma ORM
* REST APIs

---

# Database

* PostgreSQL

IMPORTANT:
Database schema MUST remain:

* flexible
* migration-friendly
* extensible
* loosely coupled

Avoid over-normalization initially.

---

# Queue & Automation

* Redis
* BullMQ

---

# Realtime

* Socket.IO

---

# File Storage

Initially:

* local storage

Later:

* Cloudflare R2 compatible architecture

---

# Deployment

Initial:

* Railway
* Vercel

Future:

* Docker
* VPS
* Hetzner
* Coolify

---

# IMPORTANT DEVELOPMENT RULES

1. Keep architecture modular
2. Avoid premature optimization
3. Avoid microservices
4. Avoid hardcoded business logic
5. Schema should be editable later
6. All modules should be independently extensible
7. Build for real-world clinic workflow speed
8. Prioritize receptionist UX
9. Minimal clicks for common tasks
10. Design for future multi-clinic support

---

# AUTHENTICATION MODEL

Patients:

* NO LOGIN
* NO accounts
* NO signup

Clinic Staff:

* Admin
* Doctor
* Receptionist

Use:

* JWT auth
* role-based access

Simple internal authentication only.

---

# PATIENT ID SYSTEM

Generate:

```text
DF-2026-0001
```

Each patient receives:

* unique patient ID
* QR code

IMPORTANT:
QR MUST NOT contain sensitive patient data.

QR should contain ONLY:

```text
patient_id
```

Backend fetches data securely.

---

# QR WORKFLOW

```text
Scan QR
→ frontend receives patient_id
→ backend fetches patient record
→ patient dashboard opens
```

---

# FILE STORAGE STRATEGY

Store:

* X-rays
* prescriptions
* invoices
* treatment images
* reports

IMPORTANT:
Store ONLY metadata in database.

Actual files:

* local filesystem initially
* future cloud object storage

---

# APPLICATION MODULES

---

# MODULE 1 — FOUNDATION SETUP

Generate:

* scalable folder structure
* NestJS module structure
* Next.js architecture
* environment configuration
* validation architecture
* logger setup
* error handling architecture
* Prisma configuration
* Railway deployment configuration

Generate complete folder hierarchy.

---

# MODULE 2 — AUTHENTICATION SYSTEM

Generate:

* JWT authentication
* login/logout
* role middleware
* guards
* route protection
* session handling

Roles:

* Admin
* Doctor
* Receptionist

NO patient authentication.

---

# MODULE 3 — PATIENT MANAGEMENT SYSTEM

This is the MOST IMPORTANT module.

Features:

* add patient
* edit patient
* archive patient
* patient search
* QR generation
* virtual patient card
* patient profile
* treatment history timeline

Patient Profile Includes:

* name
* phone
* age
* gender
* address
* allergies
* medical notes
* history
* emergency contact

IMPORTANT:
Design schema flexible for future fields.

---

# MODULE 4 — APPOINTMENT SYSTEM

Features:

* create appointment
* calendar view
* appointment status
* doctor assignment
* queue management
* missed appointments
* rescheduling

Statuses:

* scheduled
* completed
* cancelled
* missed
* in_progress

Generate:

* receptionist dashboard
* doctor schedule dashboard

---

# MODULE 5 — TREATMENT MANAGEMENT

Features:

* dental treatment tracking
* tooth selection UI
* procedure notes
* prescriptions
* treatment timeline
* image uploads
* X-ray uploads
* follow-up scheduling

IMPORTANT:
Design treatment schema flexible because procedures vary widely.

---

# MODULE 6 — FILE STORAGE SYSTEM

Generate:

* secure upload architecture
* protected file routes
* image optimization
* file metadata handling
* storage abstraction layer

Files:

* X-rays
* PDFs
* prescriptions
* reports
* treatment photos

IMPORTANT:
Files should NOT be publicly accessible directly.

---

# MODULE 7 — AUTOMATION ENGINE

Build automation manually.

DO NOT use n8n.

Use:

* BullMQ
* Redis
* worker architecture
* scheduled jobs

Generate architecture for:

* appointment reminders
* missed appointment recovery
* recall reminders
* follow-up reminders

Example:

* 1 day before appointment
* 2 hours before appointment
* 6 month dental recall

---

# MODULE 8 — BILLING SYSTEM

Features:

* invoice generation
* payment tracking
* pending dues
* billing history
* printable invoice
* PDF invoice generation

Generate:

* billing schema
* invoice numbering strategy
* payment tracking architecture

---

# MODULE 9 — LAB MANAGEMENT SYSTEM

Features:

* create lab case
* upload instructions
* tooth tracking
* status tracking
* image uploads
* delivery tracking

Statuses:

* sent
* in_progress
* ready
* delivered

---

# MODULE 10 — ANALYTICS DASHBOARD

Generate dashboards for:

* patient growth
* appointments
* revenue
* missed appointments
* treatment analytics
* pending payments

Generate:

* KPI architecture
* query optimization strategy
* aggregation design

---

# MODULE 11 — OCR DIGITIZATION

Features:

* scan physical cards
* OCR extraction
* manual verification
* auto-fill forms

Use:

* Tesseract OCR

Generate:

* OCR workflow
* processing pipeline
* verification flow

---

# MODULE 12 — REALTIME FEATURES

Use:

* Socket.IO

Realtime features:

* live appointment queue
* doctor status
* waiting room updates
* realtime notifications

---

# DATABASE REQUIREMENTS

IMPORTANT:
Schema must remain flexible.

Generate:

* Prisma schema
* relationships
* indexing strategy
* migration strategy
* soft delete strategy
* audit fields

IMPORTANT:
Avoid rigid normalization.

Design for:

* future field additions
* evolving clinic workflow
* scalable schema modifications

---

# DATABASE DESIGN PRINCIPLES

1. Flexible schema design
2. Optional fields where appropriate
3. Extensible JSON metadata where useful
4. Soft deletes
5. Audit timestamps
6. Easy migration support
7. Avoid premature complexity

---

# API REQUIREMENTS

Generate:

* REST API architecture
* route hierarchy
* DTO structure
* validation strategy
* response structure
* error handling strategy

---

# UI/UX REQUIREMENTS

Design:

* fast receptionist workflow
* healthcare aesthetic
* responsive design
* dashboard-first architecture
* minimal clicks
* tablet-friendly layout

Generate:

* sidebar structure
* dashboard hierarchy
* patient workflow screens
* appointment workflow screens

---

# PERFORMANCE REQUIREMENTS

The system should support:

* 100k+ patients
* thousands of appointments
* realtime dashboard updates
* image uploads
* concurrent clinic staff

Optimize:

* patient search
* dashboard queries
* file serving
* appointment scheduling

---

# SECURITY REQUIREMENTS

Generate:

* protected APIs
* JWT architecture
* RBAC
* secure file serving
* audit logging
* database security
* backup strategy

---

# DEPLOYMENT REQUIREMENTS

Initial:

* Railway
* Vercel

Future:

* Docker Compose
* VPS deployment
* Nginx
* PostgreSQL self-hosting
* Redis self-hosting

Generate:

* deployment strategy
* environment setup
* production configuration

---

# DEVELOPMENT PHASES

---

# PHASE 0 — PROJECT FOUNDATION

Tasks:

* setup Next.js
* setup NestJS
* setup Prisma
* connect PostgreSQL
* setup Tailwind
* setup shadcn/ui
* folder structure
* linting
* formatting
* env configuration

Deliverable:
production-ready project foundation

---

# PHASE 1 — AUTH SYSTEM

Tasks:

* login
* JWT
* RBAC
* guards
* protected routes

Deliverable:
secure clinic staff authentication

---

# PHASE 2 — PATIENT MANAGEMENT

Tasks:

* patient CRUD
* patient profile
* patient search
* QR generation
* virtual ID card

Deliverable:
fully digital patient management system

---

# PHASE 3 — APPOINTMENTS

Tasks:

* appointment booking
* calendar
* appointment statuses
* doctor schedules
* queue dashboard

Deliverable:
digital appointment workflow

---

# PHASE 4 — TREATMENTS

Tasks:

* treatment records
* prescriptions
* treatment timeline
* image uploads
* X-ray uploads

Deliverable:
complete treatment history system

---

# PHASE 5 — FILE STORAGE

Tasks:

* secure uploads
* protected routes
* metadata storage
* image optimization

Deliverable:
secure medical file management

---

# PHASE 6 — AUTOMATION ENGINE

Tasks:

* Redis
* BullMQ
* reminder workers
* scheduling system
* notification architecture

Deliverable:
automated clinic workflow system

---

# PHASE 7 — BILLING(no ned now,  future idea)

Tasks:

* invoices
* payments
* billing dashboard
* PDF generation

Deliverable:
digital billing system

---

# PHASE 8 — LAB MANAGEMENT

Tasks:

* lab cases
* status tracking
* uploads
* delivery tracking

Deliverable:
digital lab coordination system

---

# PHASE 9 — ANALYTICS

Tasks:

* charts
* KPIs
* reports
* aggregations

Deliverable:
clinic analytics dashboard

---

# PHASE 10 — OCR DIGITIZATION

Tasks:

* OCR pipeline
* scan processing
* verification system

Deliverable:
physical card digitization

---

# PHASE 11 — REALTIME FEATURES

Tasks:

* Socket.IO
* realtime queues
* live updates
* notifications

Deliverable:
realtime clinic operations

---

# IMPORTANT FINAL INSTRUCTIONS

Generate:

* production-grade architecture
* modular code structure
* scalable schema design
* migration-friendly database
* extensible backend
* flexible workflow engine

IMPORTANT:
The clinic workflow may evolve later.

Therefore:

* schema must remain editable
* fields must remain extensible
* modules should be loosely coupled
* avoid rigid architecture

Build the system as a real-world production healthcare workflow platform optimized for operational efficiency and future extensibility.
