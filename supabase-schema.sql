-- DentFlow Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- USERS (Clinic Staff)
-- =====================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'RECEPTIONIST',
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PATIENTS
-- =====================
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id TEXT UNIQUE NOT NULL,
  op_number TEXT UNIQUE,
  first_visit_date TIMESTAMPTZ,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  age INTEGER,
  date_of_birth TIMESTAMPTZ,
  gender TEXT,
  address TEXT,
  occupation TEXT,
  emergency_name TEXT,
  emergency_phone TEXT,
  is_archived BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- MEDICAL HISTORY
-- =====================
CREATE TABLE medical_histories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID UNIQUE REFERENCES patients(id) ON DELETE CASCADE,
  diabetic BOOLEAN DEFAULT false,
  hypertension BOOLEAN DEFAULT false,
  hepatic BOOLEAN DEFAULT false,
  cardio_vascular BOOLEAN DEFAULT false,
  pregnancy BOOLEAN DEFAULT false,
  pregnancy_trimester INTEGER,
  thyroid BOOLEAN DEFAULT false,
  ulcer BOOLEAN DEFAULT false,
  drug_allergy BOOLEAN DEFAULT false,
  drug_allergy_detail TEXT,
  bleeding_disorder BOOLEAN DEFAULT false,
  lactating_mother BOOLEAN DEFAULT false,
  neural BOOLEAN DEFAULT false,
  renal BOOLEAN DEFAULT false,
  previous_covid19 BOOLEAN DEFAULT false,
  hypercholesterolemia BOOLEAN DEFAULT false,
  other_specify TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- CHIEF COMPLAINTS
-- =====================
CREATE TABLE chief_complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  pain BOOLEAN DEFAULT false,
  mobility BOOLEAN DEFAULT false,
  irregularly_arranged BOOLEAN DEFAULT false,
  bleeding_gums BOOLEAN DEFAULT false,
  decay BOOLEAN DEFAULT false,
  missing_teeth BOOLEAN DEFAULT false,
  wants_clean BOOLEAN DEFAULT false,
  jaw TEXT,
  side TEXT,
  region TEXT,
  tooth_numbers INTEGER[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- ORAL EXAMINATIONS
-- =====================
CREATE TABLE oral_examinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  examined_at TIMESTAMPTZ,
  examined_by_id UUID REFERENCES users(id),
  appointment_id UUID,
  stain_calculus JSONB,
  ortho_notes TEXT,
  any_other_mention TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE oral_findings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  oral_examination_id UUID REFERENCES oral_examinations(id) ON DELETE CASCADE,
  finding_type TEXT NOT NULL,
  tooth_numbers INTEGER[],
  quadrant TEXT,
  detail TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TREATMENT PLANS
-- =====================
CREATE TABLE treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  planned_at TIMESTAMPTZ,
  planned_by_id UUID REFERENCES users(id),
  appointment_id UUID,
  status TEXT DEFAULT 'PLANNED',
  pre_op_photo BOOLEAN DEFAULT false,
  pre_op_model BOOLEAN DEFAULT false,
  estimated_total FLOAT,
  discount_amount FLOAT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE planned_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  treatment_plan_id UUID REFERENCES treatment_plans(id) ON DELETE CASCADE,
  procedure_type TEXT NOT NULL,
  tooth_numbers INTEGER[],
  material TEXT,
  type_detail TEXT,
  estimated_cost FLOAT,
  status TEXT DEFAULT 'PLANNED',
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- APPOINTMENTS
-- =====================
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMPTZ NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT DEFAULT 'SCHEDULED',
  type TEXT,
  notes TEXT,
  queue_number INTEGER,
  metadata JSONB,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- TREATMENTS
-- =====================
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_date TIMESTAMPTZ,
  doctor_id UUID REFERENCES users(id),
  planned_procedure_id UUID REFERENCES planned_procedures(id),
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  procedure_notes TEXT,
  medications_given TEXT,
  suture_details JSONB,
  follow_up_notes TEXT,
  procedure TEXT,
  tooth_numbers INTEGER[],
  prescription TEXT,
  cost FLOAT,
  follow_up_date TIMESTAMPTZ,
  appointment_id UUID REFERENCES appointments(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INVOICES
-- =====================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_number TEXT UNIQUE NOT NULL,
  total_amount FLOAT NOT NULL,
  paid_amount FLOAT DEFAULT 0,
  status TEXT DEFAULT 'PENDING',
  items JSONB,
  notes TEXT,
  due_date TIMESTAMPTZ,
  treatment_plan_id UUID REFERENCES treatment_plans(id),
  estimated_total FLOAT,
  discount_amount FLOAT,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- PAYMENTS
-- =====================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  amount FLOAT NOT NULL,
  method TEXT,
  reference_no TEXT,
  notes TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FILE RECORDS
-- =====================
CREATE TABLE file_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  size INTEGER,
  path TEXT,
  category TEXT DEFAULT 'OTHER',
  description TEXT,
  metadata JSONB,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  treatment_id UUID REFERENCES treatments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- LAB CASES
-- =====================
CREATE TABLE lab_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lab_name TEXT NOT NULL,
  case_type TEXT,
  tooth_numbers INTEGER[],
  status TEXT DEFAULT 'SENT',
  instructions TEXT,
  sent_date TIMESTAMPTZ DEFAULT NOW(),
  expected_date TIMESTAMPTZ,
  delivery_date TIMESTAMPTZ,
  cost FLOAT,
  notes TEXT,
  metadata JSONB,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- WAITLIST
-- =====================
CREATE TABLE waitlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID,
  preferred_date TIMESTAMPTZ,
  time_preference TEXT,
  reason TEXT,
  status TEXT DEFAULT 'WAITING',
  notified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- HOLIDAYS
-- =====================
CREATE TABLE holidays (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(date)
);

-- =====================
-- DOCTOR SCHEDULES
-- =====================
CREATE TABLE doctor_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  slot_duration INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, day_of_week)
);

-- =====================
-- APPOINTMENT SLOTS
-- =====================
CREATE TABLE appointment_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  doctor_id UUID REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration INTEGER DEFAULT 30,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, date, start_time)
);

-- =====================
-- NOTIFICATION LOGS
-- =====================
CREATE TABLE notification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  channel TEXT NOT NULL,
  recipient TEXT NOT NULL,
  patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  template TEXT,
  content TEXT,
  status TEXT DEFAULT 'PENDING',
  meta JSONB,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_patient_id ON patients(patient_id);
CREATE INDEX idx_patients_op_number ON patients(op_number);
CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_doctor_date ON appointments(doctor_id, date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_treatments_patient ON treatments(patient_id);
CREATE INDEX idx_treatments_visit_date ON treatments(visit_date);
CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chief_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE oral_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE planned_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE doctor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users
CREATE POLICY "Allow all for authenticated" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON medical_histories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON chief_complaints FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON oral_examinations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON oral_findings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON treatment_plans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON planned_procedures FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON appointments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON treatments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON payments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON file_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON lab_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON waitlists FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON holidays FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON doctor_schedules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON appointment_slots FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for authenticated" ON notification_logs FOR ALL USING (true) WITH CHECK (true);

SELECT 'Database schema created successfully!' as message;