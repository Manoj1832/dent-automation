-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'DOCTOR', 'RECEPTIONIST');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "AppointmentStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'MISSED');

-- CreateEnum
CREATE TYPE "LabCaseStatus" AS ENUM ('SENT', 'IN_PROGRESS', 'READY', 'DELIVERED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PARTIAL', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('XRAY', 'PRESCRIPTION', 'INVOICE', 'TREATMENT_PHOTO', 'REPORT', 'LAB_INSTRUCTION', 'OTHER');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'RECEPTIONIST',
    "phone" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "patients" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "gender" "Gender",
    "address" TEXT,
    "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "medicalNotes" TEXT,
    "emergencyName" TEXT,
    "emergencyPhone" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "patients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "appointments" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "status" "AppointmentStatus" NOT NULL DEFAULT 'SCHEDULED',
    "type" TEXT,
    "notes" TEXT,
    "queueNumber" INTEGER,
    "metadata" JSONB,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "appointments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "treatments" (
    "id" TEXT NOT NULL,
    "procedure" TEXT NOT NULL,
    "toothNumbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "notes" TEXT,
    "prescription" TEXT,
    "cost" DOUBLE PRECISION,
    "followUpDate" TIMESTAMP(3),
    "metadata" JSONB,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "appointmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "treatments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_records" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
    "description" TEXT,
    "metadata" JSONB,
    "patientId" TEXT,
    "treatmentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "file_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "items" JSONB NOT NULL,
    "notes" TEXT,
    "dueDate" TIMESTAMP(3),
    "metadata" JSONB,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "referenceNo" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "invoiceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lab_cases" (
    "id" TEXT NOT NULL,
    "labName" TEXT NOT NULL,
    "caseType" TEXT NOT NULL,
    "toothNumbers" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "status" "LabCaseStatus" NOT NULL DEFAULT 'SENT',
    "instructions" TEXT,
    "sentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expectedDate" TIMESTAMP(3),
    "deliveryDate" TIMESTAMP(3),
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "metadata" JSONB,
    "patientId" TEXT NOT NULL,
    "doctorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lab_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" JSONB,
    "ipAddress" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clinic_settings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "clinicName" TEXT NOT NULL DEFAULT 'DentFlow Clinic',
    "phone" TEXT,
    "email" TEXT,
    "address" TEXT,
    "logo" TEXT,
    "settings" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clinic_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "patients_patientId_key" ON "patients"("patientId");

-- CreateIndex
CREATE INDEX "patients_name_idx" ON "patients"("name");

-- CreateIndex
CREATE INDEX "patients_phone_idx" ON "patients"("phone");

-- CreateIndex
CREATE INDEX "patients_patientId_idx" ON "patients"("patientId");

-- CreateIndex
CREATE INDEX "appointments_date_idx" ON "appointments"("date");

-- CreateIndex
CREATE INDEX "appointments_status_idx" ON "appointments"("status");

-- CreateIndex
CREATE INDEX "appointments_doctorId_date_idx" ON "appointments"("doctorId", "date");

-- CreateIndex
CREATE INDEX "treatments_patientId_idx" ON "treatments"("patientId");

-- CreateIndex
CREATE INDEX "treatments_doctorId_idx" ON "treatments"("doctorId");

-- CreateIndex
CREATE INDEX "file_records_patientId_idx" ON "file_records"("patientId");

-- CreateIndex
CREATE INDEX "file_records_category_idx" ON "file_records"("category");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_patientId_idx" ON "invoices"("patientId");

-- CreateIndex
CREATE INDEX "invoices_status_idx" ON "invoices"("status");

-- CreateIndex
CREATE INDEX "lab_cases_status_idx" ON "lab_cases"("status");

-- CreateIndex
CREATE INDEX "lab_cases_patientId_idx" ON "lab_cases"("patientId");

-- CreateIndex
CREATE INDEX "audit_logs_entity_entityId_idx" ON "audit_logs"("entity", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "treatments" ADD CONSTRAINT "treatments_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_records" ADD CONSTRAINT "file_records_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_records" ADD CONSTRAINT "file_records_treatmentId_fkey" FOREIGN KEY ("treatmentId") REFERENCES "treatments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lab_cases" ADD CONSTRAINT "lab_cases_doctorId_fkey" FOREIGN KEY ("doctorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
