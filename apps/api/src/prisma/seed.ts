import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed - Tamil Nadu Patients...\n');

  // 1. Create Admin/Doctor User
  const adminEmail = 'admin@dentflow.com';
  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  let admin;
  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Manoj@2006', 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        password: hashedPassword,
        name: 'Dr. Ramesh',
        role: 'ADMIN',
        phone: '9876543210',
      },
    });
    console.log('✅ Admin/Doctor created');
  } else {
    admin = existingAdmin;
    console.log('⚠️ Admin already exists');
  }

  // 2. Create Doctors
  const doctorsData = [
    { name: 'Dr. Priya', email: 'dr.priya@dentflow.com' },
    { name: 'Dr. Kannan', email: 'dr.kannan@dentflow.com' },
    { name: 'Dr. Vijay', email: 'dr.vijay@dentflow.com' },
  ];

  const doctors = [admin];
  for (const doc of doctorsData) {
    const existing = await prisma.user.findUnique({ where: { email: doc.email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('doctor123', 10);
      const doctor = await prisma.user.create({
        data: { email: doc.email, password: hashedPassword, name: doc.name, role: 'DOCTOR', phone: '9876543211' },
      });
      doctors.push(doctor);
      console.log(`✅ Doctor: ${doc.name}`);
    } else {
      doctors.push(existing);
    }
  }

  // 3. Tamil Nadu Patients Data (15 patients from various cities)
  const tamilNaduPatients = [
    { name: 'Karthik Raja', phone: '9876543210', age: 34, gender: 'MALE', occupation: 'Business', city: 'Chennai', address: '12, Anna Salai, Chennai - 600002', opNumber: '5001' },
    { name: 'Priya Dharshini', phone: '9988776655', age: 28, gender: 'FEMALE', occupation: 'Teacher', city: 'Coimbatore', address: '45, RS Puram, Coimbatore - 641002', opNumber: '5002' },
    { name: 'Senthil Kumar', phone: '9444455555', age: 45, gender: 'MALE', occupation: 'Engineer', city: 'Madurai', address: '8, Veli Street, Madurai - 625001', opNumber: '5003' },
    { name: 'Anitha Vasudevan', phone: '9123456789', age: 22, gender: 'FEMALE', occupation: 'Student', city: 'Trichy', address: '14, Thillai Nagar, Trichy - 620018', opNumber: '5004' },
    { name: 'Manoj Prabhakar', phone: '9840123456', age: 31, gender: 'MALE', occupation: 'Software Developer', city: 'Chennai', address: '22, KK Nagar, Chennai - 600078', opNumber: '5005' },
    { name: 'Divya Bharathi', phone: '9888877777', age: 26, gender: 'FEMALE', occupation: 'Nurse', city: 'Salem', address: '55, Fairlands, Salem - 636016', opNumber: '5006' },
    { name: 'Suriya Sivakumar', phone: '9765432109', age: 40, gender: 'MALE', occupation: 'Actor', city: 'Chennai', address: '7, Mount Road, Chennai - 600002', opNumber: '5007' },
    { name: 'Nandhini Rajendran', phone: '9654321098', age: 29, gender: 'FEMALE', occupation: 'CA', city: 'Coimbatore', address: '12, Race Course, Coimbatore - 641018', opNumber: '5008' },
    { name: 'Vignesh Murugan', phone: '9543210987', age: 35, gender: 'MALE', occupation: 'Bank Manager', city: 'Trichy', address: '9, Cantonment, Trichy - 620001', opNumber: '5009' },
    { name: 'Sneha Parthasarathy', phone: '9432109876', age: 24, gender: 'FEMALE', occupation: 'Designer', city: 'Madurai', address: '18, Anna Nagar, Madurai - 625020', opNumber: '5010' },
    { name: 'Arun Kumar', phone: '9323210987', age: 38, gender: 'MALE', occupation: 'Teacher', city: 'Tirunelveli', address: '25, South Gate, Tirunelveli - 627001', opNumber: '5011' },
    { name: 'Lakshmi Devi', phone: '9212345678', age: 52, gender: 'FEMALE', occupation: 'Housewife', city: 'Vellore', address: '30, Officers Line, Vellore - 632001', opNumber: '5012' },
    { name: 'Rajesh Kannan', phone: '9109876543', age: 42, gender: 'MALE', occupation: 'Business', city: 'Erode', address: '15, Gandhi Road, Erode - 638001', opNumber: '5013' },
    { name: 'Madhavi Srinivasan', phone: '9098765432', age: 30, gender: 'FEMALE', occupation: 'Doctor', city: 'Chennai', address: '42, T Nagar, Chennai - 600017', opNumber: '5014' },
    { name: 'Prashanth Raj', phone: '9087654321', age: 33, gender: 'MALE', occupation: 'Engineer', city: 'Hosur', address: '8, Industrial Layout, Hosur - 635109', opNumber: '5015' },
  ];

  console.log('\n⏳ Creating patients...');
  const patients = [];
  for (const p of tamilNaduPatients) {
    const year = new Date().getFullYear();
    const patientId = `DF-${year}-${p.opNumber}`;
    
    const existing = await prisma.patient.findUnique({ where: { opNumber: p.opNumber } });
    let patient;
    if (existing) {
      patient = existing;
    } else {
      patient = await prisma.patient.create({
        data: {
          patientId,
          opNumber: p.opNumber,
          firstVisitDate: new Date(),
          name: p.name,
          email: `${p.name.toLowerCase().replace(' ', '.')}@gmail.com`,
          phone: p.phone,
          age: p.age,
          dateOfBirth: new Date(new Date().setFullYear(new Date().getFullYear() - p.age)),
          gender: p.gender as any,
          address: p.address,
          occupation: p.occupation,
          emergencyName: `Emergency ${p.name.split(' ')[0]}`,
          emergencyPhone: p.phone,
        },
      });
    }
    patients.push(patient);
  }
  console.log(`✅ ${patients.length} patients ready`);

  // 4. Medical History for each patient
  console.log('\n⏳ Creating medical history...');
  const conditions = ['diabetic', 'hypertension', 'thyroid', 'drugAllergy', 'bleedingDisorder'];
  for (const patient of patients) {
    await prisma.medicalHistory.upsert({
      where: { patientId: patient.id },
      update: {},
      create: {
        patientId: patient.id,
        diabetic: Math.random() > 0.7,
        hypertension: Math.random() > 0.8,
        thyroid: Math.random() > 0.9,
        drugAllergy: Math.random() > 0.85,
        drugAllergyDetail: Math.random() > 0.85 ? 'Penicillin' : null,
      },
    });
  }
  console.log('✅ Medical history created');

  // 5. Chief Complaints
  console.log('\n⏳ Creating chief complaints...');
  const complaints = ['pain', 'decay', 'bleedingGums', 'wantsClean', 'missingTeeth'];
  const jaws = ['UPPER', 'LOWER', 'BOTH'];
  const sides = ['RIGHT', 'LEFT', 'FRONT', 'ALL'];
  for (const patient of patients) {
    const complaintType = complaints[Math.floor(Math.random() * complaints.length)];
    await prisma.chiefComplaint.create({
      data: {
        patientId: patient.id,
        [complaintType]: true,
        jaw: jaws[Math.floor(Math.random() * jaws.length)] as any,
        side: sides[Math.floor(Math.random() * sides.length)] as any,
        notes: `Patient mentioned ${complaintType} issue`,
      },
    });
  }
  console.log('✅ Chief complaints created');

  // 6. Oral Examinations
  console.log('\n⏳ Creating oral examinations...');
  const findings = ['DC', 'STAINS_CALCULUS', 'OLD_FILLING', 'GD', 'NON_VITAL'];
  const quadrants = ['UL', 'UR', 'LL', 'LR'];
  for (const patient of patients) {
    const exam = await prisma.oralExamination.create({
      data: {
        patientId: patient.id,
        examinedAt: new Date(),
        examinedById: doctors[0].id,
        orthoNotes: 'Normal occlusion',
      },
    });

    await prisma.oralFinding.create({
      data: {
        oralExaminationId: exam.id,
        findingType: findings[Math.floor(Math.random() * findings.length)] as any,
        toothNumbers: [Math.floor(Math.random() * 32) + 1],
        quadrant: quadrants[Math.floor(Math.random() * quadrants.length)] as any,
      },
    });
  }
  console.log('✅ Oral examinations created');

  // 7. Treatment Plans
  console.log('\n⏳ Creating treatment plans...');
  const procedures = ['SCALING', 'FILLING', 'RCT', 'EXTRACTION', 'CROWN', 'CROWN_BRIDGE'];
  for (const patient of patients.slice(0, 10)) {
    const plan = await prisma.treatmentPlan.create({
      data: {
        patientId: patient.id,
        plannedAt: new Date(),
        plannedById: doctors[0].id,
        status: ['PLANNED', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 3)] as any,
        preOpPhoto: Math.random() > 0.5,
        estimatedTotal: Math.floor(Math.random() * 5000) + 1000,
        notes: 'Treatment plan discussed',
      },
    });

    await prisma.plannedProcedure.create({
      data: {
        treatmentPlanId: plan.id,
        procedureType: procedures[Math.floor(Math.random() * procedures.length)] as any,
        toothNumbers: [Math.floor(Math.random() * 32) + 1],
        material: ['GIC', 'LCF', 'Fibre'][Math.floor(Math.random() * 3)],
        estimatedCost: Math.floor(Math.random() * 2000) + 500,
        status: 'PLANNED',
      },
    });
  }
  console.log('✅ Treatment plans created');

  // 8. Appointments
  console.log('\n⏳ Creating appointments...');
  const appointmentTypes = ['Consultation', 'Root Canal', 'Scaling', 'Filling', 'Checkup', 'Extraction', 'Crown'];
  const statuses = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
  const cities = ['Chennai', 'Coimbatore', 'Madurai', 'Trichy', 'Salem', 'Tirunelveli', 'Vellore', 'Erode', 'Hosur', 'Tiruppur'];

  for (let i = 0; i < 15; i++) {
    const patient = patients[i];
    const doctor = doctors[i % doctors.length];
    
    const appointmentDate = new Date();
    appointmentDate.setDate(appointmentDate.getDate() + Math.floor(Math.random() * 14) - 3);
    appointmentDate.setHours(9 + Math.floor(Math.random() * 8), 0, 0);
    
    const endTime = new Date(appointmentDate);
    endTime.setHours(endTime.getHours() + 1);

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        type: appointmentTypes[Math.floor(Math.random() * appointmentTypes.length)],
        date: appointmentDate,
        startTime: appointmentDate,
        endTime: endTime,
        status: statuses[Math.floor(Math.random() * statuses.length)] as any,
        notes: `Appointment for dental checkup in ${cities[i % cities.length]}`,
        queueNumber: i + 1,
      },
    });
  }
  console.log('✅ 15 appointments created');

  // 9. Treatments (Visit Log)
  console.log('\n⏳ Creating treatment records...');
  const treatmentNotes = [
    'Scaling completed - recommended 6 month recall',
    'Filling done on tooth #36, composite restoration',
    'Root canal initiated for tooth #46, medication placed',
    'Extraction of mobile tooth #47, suture placed',
    'Crown fixation completed, bite adjusted',
  ];
  
  for (let i = 0; i < 10; i++) {
    const patient = patients[i];
    const visitDate = new Date();
    visitDate.setDate(visitDate.getDate() - Math.floor(Math.random() * 30));

    await prisma.treatment.create({
      data: {
        patientId: patient.id,
        doctorId: doctors[0].id,
        visitDate: visitDate,
        procedureNotes: treatmentNotes[i % treatmentNotes.length],
        medicationsGiven: 'Rx: Amoxicillin 500mg TDS, Painkiller SOS',
        followUpNotes: 'Review after 1 week',
        procedure: ['Scaling', 'Filling', 'RCT', 'Extraction', 'Crown'][i % 5],
        cost: [500, 1500, 3000, 800, 5000][i % 5],
      },
    });
  }
  console.log('✅ Treatment records created');

  // 10. Invoices
  console.log('\n⏳ Creating invoices...');
  for (let i = 0; i < 10; i++) {
    const patient = patients[i];
    const totalAmount = [500, 1500, 3000, 800, 5000, 1200, 2500, 4500, 3500, 2000][i];
    const paidAmount = Math.random() > 0.3 ? totalAmount : Math.floor(totalAmount * 0.7);
    const invoiceNumber = `INV-2026-${String(i + 1).padStart(4, '0')}`;
    
    const existingInvoice = await prisma.invoice.findUnique({ where: { invoiceNumber } });
    if (existingInvoice) continue;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        totalAmount,
        paidAmount,
        status: paidAmount >= totalAmount ? 'PAID' : 'PARTIAL',
        items: JSON.stringify([{ description: 'Dental treatment', amount: totalAmount }]),
        patientId: patient.id,
      },
    });

    await prisma.payment.create({
      data: {
        invoiceId: invoice.id,
        amount: paidAmount,
        method: ['Cash', 'Card', 'UPI'][Math.floor(Math.random() * 3)],
        notes: 'Payment received',
        paidAt: new Date(),
      },
    });
  }
  console.log('✅ Invoices created');

  console.log('\n🎉 Database seeding complete!');
  console.log('\n📋 Summary:');
  console.log(`   - ${doctors.length} Doctors`);
  console.log(`   - ${patients.length} Patients (Tamil Nadu)`);
  console.log(`   - 15 Appointments`);
  console.log(`   - 10 Treatment records`);
  console.log(`   - 10 Invoices`);
  console.log('\n📋 Login: admin@dentflow.com / SreeArumuga@2026!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });