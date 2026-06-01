import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { Gender, AppointmentStatus } from '@prisma/client';
import { ChatGroq } from '@langchain/groq';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export interface ChatResponse {
  reply: string;
  sessionId: string;
  toolsUsed?: string[];
  error?: boolean;
}

interface PatientCreateInput {
  name: string;
  phone?: string;
  age?: number;
  gender?: string;
}

interface AppointmentCreateInput {
  patientId: string;
  doctorId: string;
  date: string;
  startTime: string;
  type?: string;
  notes?: string;
}

interface ClinicSnapshot {
  patientCount: number;
  todayAppointments: any[];
  doctors: any[];
}

// ─────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────

const MAX_SEARCH_RESULTS = 5;
const MAX_UPCOMING_DAYS = 7;
const PATIENT_ID_PREFIX = 'DF';
const VALID_GENDERS: Gender[] = ['MALE', 'FEMALE', 'OTHER'];

const SESSION_TTL_MS = 30 * 60 * 1000; // 30 minutes

// ─────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────

@Injectable()
export class AiService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(AiService.name);

  private agent: ReturnType<typeof createReactAgent>;
  private checkpointer: MemorySaver;

  /** Track last activity per session for TTL-based cleanup */
  private sessionActivity = new Map<string, number>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  // ─── LIFECYCLE ─────────────────────────────────────────────────────────────

  onModuleInit() {
    this.checkpointer = new MemorySaver();
    this.agent = this.buildAgent();
    this.cleanupInterval = setInterval(() => this.evictStaleSessions(), SESSION_TTL_MS);
    this.logger.log('AiService initialized with LangGraph agent');
  }

  onModuleDestroy() {
    clearInterval(this.cleanupInterval);
  }

  // ─── AGENT BUILDER ─────────────────────────────────────────────────────────

  private buildAgent() {
    const apiKey = this.config.get<string>('GROQ_API_KEY');
    if (!apiKey) throw new Error('GROQ_API_KEY is not configured');

    const model = new ChatGroq({
      apiKey,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.2,
      maxRetries: 3,
    });

    const tools = this.buildTools();

    return createReactAgent({
      llm: model,
      tools,
      checkpointSaver: this.checkpointer,
    });
  }

  // ─── TOOLS ─────────────────────────────────────────────────────────────────

  private buildTools(): DynamicStructuredTool[] {
    return [
      new DynamicStructuredTool({
        name: 'search_patients',
        description:
          'Search for existing patients by name, phone number, or patient ID (e.g. DF-2025-0001). Always call this before booking an appointment to get the correct patient UUID.',
        schema: z.object({
          query: z.string().describe('Name, phone number, or patient ID to search for'),
        }),
        func: ({ query }) => this.toolSearchPatients(query),
      }),

      new DynamicStructuredTool({
        name: 'get_appointments_by_date',
        description:
          'Retrieve all appointments for a specific date. Use this to check availability or give a schedule overview.',
        schema: z.object({
          date: z.string().describe('Date in YYYY-MM-DD format'),
        }),
        func: ({ date }) => this.toolGetAppointmentsByDate(date),
      }),

      new DynamicStructuredTool({
        name: 'get_upcoming_appointments',
        description:
          'Get all appointments for the next N days (max 7). Useful for a weekly overview.',
        schema: z.object({
          days: z.number().min(1).max(7).default(3).describe('Number of days ahead to look'),
        }),
        func: ({ days }) => this.toolGetUpcomingAppointments(days),
      }),

      new DynamicStructuredTool({
        name: 'get_patient_details',
        description:
          'Get full details of a patient including medical history and recent appointments by their UUID.',
        schema: z.object({
          patientId: z.string().describe('The database UUID of the patient'),
        }),
        func: ({ patientId }) => this.toolGetPatientDetails(patientId),
      }),

      new DynamicStructuredTool({
        name: 'create_patient',
        description:
          'Create a new patient record. Only use after confirming via search_patients that the patient does NOT already exist.',
        schema: z.object({
          name: z.string().describe('Full name of the patient'),
          phone: z.string().optional().describe('Phone number'),
          age: z.number().int().min(0).max(150).optional().describe('Age in years'),
          gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
        }),
        func: (data) => this.toolCreatePatient(data),
      }),

      new DynamicStructuredTool({
        name: 'create_appointment',
        description:
          'Book a new appointment. Requires a valid patient UUID (from search_patients) and doctor UUID (from clinic data).',
        schema: z.object({
          patientId: z.string().uuid().describe('Database UUID of the patient'),
          doctorId: z.string().uuid().describe('Database UUID of the doctor'),
          date: z.string().describe('Date in YYYY-MM-DD format'),
          startTime: z.string().regex(/^\d{2}:\d{2}$/).describe('Time in HH:MM 24-hour format'),
          type: z.string().optional().describe('Appointment type e.g. Checkup, RCT, Cleaning'),
          notes: z.string().optional().describe('Optional notes'),
        }),
        func: (data) => this.toolCreateAppointment(data),
      }),

      new DynamicStructuredTool({
        name: 'cancel_appointment',
        description: 'Cancel an existing appointment by its UUID.',
        schema: z.object({
          appointmentId: z.string().uuid().describe('UUID of the appointment to cancel'),
          reason: z.string().optional().describe('Reason for cancellation'),
        }),
        func: ({ appointmentId, reason }) => this.toolCancelAppointment(appointmentId, reason),
      }),

      new DynamicStructuredTool({
        name: 'get_doctor_availability',
        description:
          'Check a specific doctor\'s schedule for a given date — their working hours and existing appointment slots.',
        schema: z.object({
          doctorId: z.string().uuid().describe('UUID of the doctor'),
          date: z.string().describe('Date in YYYY-MM-DD format'),
        }),
        func: ({ doctorId, date }) => this.toolGetDoctorAvailability(doctorId, date),
      }),
    ];
  }

  // ─── TOOL IMPLEMENTATIONS ──────────────────────────────────────────────────

  private async toolSearchPatients(query: string): Promise<string> {
    try {
      const patients = await this.prisma.patient.findMany({
        where: {
          isArchived: false,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { patientId: { contains: query, mode: 'insensitive' } },
            { phone: { contains: query } },
          ],
        },
        select: {
          id: true,
          patientId: true,
          name: true,
          phone: true,
          age: true,
          gender: true,
          createdAt: true,
        },
        take: MAX_SEARCH_RESULTS,
      });

      if (!patients.length) {
        return `No patients found matching "${query}". You may need to create a new patient record.`;
      }

      const lines = patients.map(
        (p) =>
          `• ${p.name} | ID: ${p.patientId} | UUID: ${p.id}` +
          (p.phone ? ` | Phone: ${p.phone}` : '') +
          (p.age ? ` | Age: ${p.age}` : '') +
          (p.gender ? ` | ${p.gender}` : ''),
      );

      return `Found ${patients.length} patient(s):\n${lines.join('\n')}`;
    } catch (err) {
      this.logger.error('toolSearchPatients failed', err);
      return 'Error searching patients. Please try again.';
    }
  }

  private async toolGetAppointmentsByDate(dateStr: string): Promise<string> {
    const { start, end, label } = this.parseDayRange(dateStr);
    if (!start || !end) return `Invalid date format: "${dateStr}". Use YYYY-MM-DD.`;

    try {
      const appts = await this.prisma.appointment.findMany({
        where: { date: { gte: start, lte: end } },
        include: {
          patient: { select: { name: true, phone: true } },
          doctor: { select: { name: true } },
        },
        orderBy: [{ queueNumber: 'asc' }, { startTime: 'asc' }],
      });

      if (!appts.length) return `No appointments scheduled on ${label}.`;

      const lines = appts.map(
        (a) =>
          `Q${a.queueNumber ?? '-'}: ${a.patient.name} → Dr. ${a.doctor?.name ?? 'Unassigned'}` +
          ` at ${this.formatTime(a.startTime)} [${a.status}]` +
          (a.type ? ` (${a.type})` : ''),
      );

      return `${appts.length} appointment(s) on ${label}:\n${lines.join('\n')}`;
    } catch (err) {
      this.logger.error('toolGetAppointmentsByDate failed', err);
      return 'Error fetching appointments.';
    }
  }

  private async toolGetUpcomingAppointments(days: number): Promise<string> {
    const start = this.startOfDay(new Date());
    const end = this.endOfDay(new Date(Date.now() + Math.min(days, MAX_UPCOMING_DAYS) * 86400000));

    try {
      const appts = await this.prisma.appointment.findMany({
        where: {
          date: { gte: start, lte: end },
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
        },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      });

      if (!appts.length) return `No upcoming appointments in the next ${days} day(s).`;

      // Group by date
      const grouped = appts.reduce<Record<string, typeof appts>>((acc, a) => {
        const key = a.date.toISOString().split('T')[0];
        (acc[key] ??= []).push(a);
        return acc;
      }, {});

      const sections = Object.entries(grouped).map(([date, list]) => {
        const rows = list.map(
          (a) => `  Q${a.queueNumber ?? '-'}: ${a.patient.name} → Dr. ${a.doctor?.name ?? 'TBD'} at ${this.formatTime(a.startTime)}`,
        );
        return `📅 ${date}\n${rows.join('\n')}`;
      });

      return sections.join('\n\n');
    } catch (err) {
      this.logger.error('toolGetUpcomingAppointments failed', err);
      return 'Error fetching upcoming appointments.';
    }
  }

  private async toolGetPatientDetails(patientId: string): Promise<string> {
    try {
      const patient = await this.prisma.patient.findUnique({
        where: { id: patientId },
        include: {
          medicalHistory: true,
          appointments: {
            orderBy: { date: 'desc' },
            take: 5,
            include: { doctor: { select: { name: true } } },
          },
          treatments: {
            orderBy: { visitDate: 'desc' },
            take: 3,
            select: { visitDate: true, procedure: true, cost: true },
          },
        },
      });

      if (!patient) return `No patient found with UUID: ${patientId}`;

      const mh = patient.medicalHistory;
      const conditions = mh
        ? Object.entries({
            Diabetic: mh.diabetic,
            Hypertension: mh.hypertension,
            'Cardio Vascular': mh.cardioVascular,
            Thyroid: mh.thyroid,
            'Drug Allergy': mh.drugAllergy,
            'Bleeding Disorder': mh.bleedingDisorder,
          })
            .filter(([, v]) => v)
            .map(([k]) => k)
        : [];

      const apptLines = patient.appointments.map(
        (a) => `  • ${a.date.toISOString().split('T')[0]} — Dr. ${a.doctor?.name} [${a.status}]`,
      );

      const txLines = patient.treatments.map(
        (t) => `  • ${t.visitDate?.toISOString().split('T')[0]} — ${t.procedure ?? 'Treatment'}${t.cost ? ` ₹${t.cost}` : ''}`,
      );

      return [
        `Patient: ${patient.name} (${patient.patientId})`,
        `UUID: ${patient.id}`,
        `Phone: ${patient.phone ?? 'N/A'} | Age: ${patient.age ?? 'N/A'} | Gender: ${patient.gender ?? 'N/A'}`,
        conditions.length ? `Medical Conditions: ${conditions.join(', ')}` : 'No major medical conditions on record.',
        `\nRecent Appointments (${apptLines.length}):`,
        apptLines.join('\n') || '  None',
        `\nRecent Treatments (${txLines.length}):`,
        txLines.join('\n') || '  None',
      ].join('\n');
    } catch (err) {
      this.logger.error('toolGetPatientDetails failed', err);
      return 'Error fetching patient details.';
    }
  }

  private async toolCreatePatient(data: PatientCreateInput): Promise<string> {
    try {
      const gender =
        data.gender && VALID_GENDERS.includes(data.gender as Gender)
          ? (data.gender as Gender)
          : null;

      const patient = await this.prisma.patient.create({
        data: {
          patientId: await this.generatePatientId(),
          name: data.name.trim(),
          phone: data.phone?.trim() || null,
          age: data.age || null,
          gender,
          firstVisitDate: new Date(),
        },
      });

      return `✅ Patient created successfully.\nName: ${patient.name}\nPatient ID: ${patient.patientId}\nUUID: ${patient.id}`;
    } catch (err: any) {
      this.logger.error('toolCreatePatient failed', err);
      if (err.code === 'P2002') return 'A patient with this phone number or ID already exists.';
      return 'Error creating patient. Please try again.';
    }
  }

  private async toolCreateAppointment(data: AppointmentCreateInput): Promise<string> {
    try {
      // Validate patient and doctor exist
      const [patient, doctor] = await Promise.all([
        this.prisma.patient.findUnique({ where: { id: data.patientId }, select: { id: true, name: true } }),
        this.prisma.user.findUnique({ where: { id: data.doctorId }, select: { id: true, name: true, role: true } }),
      ]);

      if (!patient) return `❌ Patient UUID "${data.patientId}" not found. Please search for the patient first.`;
      if (!doctor) return `❌ Doctor UUID "${data.doctorId}" not found.`;
      if (doctor.role !== 'DOCTOR') return `❌ User "${doctor.name}" is not a doctor.`;

      const { start: dayStart, end: dayEnd } = this.parseDayRange(data.date);
      if (!dayStart || !dayEnd) return `❌ Invalid date: "${data.date}". Use YYYY-MM-DD.`;

      // Check for double-booking
      const startTimeObj = new Date(`${data.date}T${data.startTime}:00`);
      if (isNaN(startTimeObj.getTime())) {
        return `❌ Invalid time: "${data.startTime}". Use HH:MM format.`;
      }

      const conflict = await this.prisma.appointment.findFirst({
        where: {
          doctorId: data.doctorId,
          startTime: startTimeObj,
          status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
        },
      });

      if (conflict) {
        return `❌ Dr. ${doctor.name} already has an appointment at ${data.startTime} on ${data.date}. Please choose a different time.`;
      }

      // Next queue number for the day
      const lastAppt = await this.prisma.appointment.findFirst({
        where: { date: { gte: dayStart, lte: dayEnd } },
        orderBy: { queueNumber: 'desc' },
        select: { queueNumber: true },
      });

      const queueNumber = (lastAppt?.queueNumber ?? 0) + 1;

      const appt = await this.prisma.appointment.create({
        data: {
          patientId: data.patientId,
          doctorId: data.doctorId,
          date: new Date(data.date),
          startTime: startTimeObj,
          status: AppointmentStatus.SCHEDULED,
          type: data.type?.trim() || null,
          notes: data.notes?.trim() || null,
          queueNumber,
        },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      });

      return [
        `✅ Appointment booked successfully!`,
        `Patient: ${appt.patient.name}`,
        `Doctor: Dr. ${appt.doctor?.name}`,
        `Date: ${data.date} at ${data.startTime}`,
        `Queue Number: ${appt.queueNumber}`,
        `Appointment ID: ${appt.id}`,
      ].join('\n');
    } catch (err: any) {
      this.logger.error('toolCreateAppointment failed', err);
      return 'Error creating appointment. Please try again.';
    }
  }

  private async toolCancelAppointment(appointmentId: string, reason?: string): Promise<string> {
    try {
      const appt = await this.prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
      });

      if (!appt) return `❌ Appointment "${appointmentId}" not found.`;
      if (appt.status === AppointmentStatus.CANCELLED) return `ℹ️ Appointment is already cancelled.`;
      if (appt.status === AppointmentStatus.COMPLETED) return `❌ Cannot cancel a completed appointment.`;

      await this.prisma.appointment.update({
        where: { id: appointmentId },
        data: {
          status: AppointmentStatus.CANCELLED,
          notes: reason ? `Cancelled: ${reason}` : appt.notes,
        },
      });

      return `✅ Appointment cancelled.\nPatient: ${appt.patient.name}\nDoctor: Dr. ${appt.doctor?.name}\nDate: ${appt.date.toISOString().split('T')[0]} at ${this.formatTime(appt.startTime)}`;
    } catch (err) {
      this.logger.error('toolCancelAppointment failed', err);
      return 'Error cancelling appointment.';
    }
  }

  private async toolGetDoctorAvailability(doctorId: string, dateStr: string): Promise<string> {
    const { start, end, label } = this.parseDayRange(dateStr);
    if (!start || !end) return `Invalid date: "${dateStr}"`;

    try {
      const [doctor, schedule, appointments] = await Promise.all([
        this.prisma.user.findUnique({ where: { id: doctorId }, select: { name: true } }),
        this.prisma.doctorSchedule.findFirst({
          where: { doctorId, dayOfWeek: new Date(dateStr).getDay(), isActive: true },
        }),
        this.prisma.appointment.findMany({
          where: {
            doctorId,
            date: { gte: start, lte: end },
            status: { in: [AppointmentStatus.SCHEDULED, AppointmentStatus.IN_PROGRESS] },
          },
          orderBy: { startTime: 'asc' },
          select: { startTime: true, endTime: true, status: true },
        }),
      ]);

      if (!doctor) return `Doctor UUID "${doctorId}" not found.`;

      const lines: string[] = [`Dr. ${doctor.name} on ${label}:`];

      if (!schedule) {
        lines.push('⚠️  No schedule configured for this day of the week.');
      } else {
        lines.push(`Working hours: ${schedule.startTime} – ${schedule.endTime} (${schedule.slotDuration} min slots)`);
      }

      if (!appointments.length) {
        lines.push('No appointments booked — fully available.');
      } else {
        lines.push(`Booked slots (${appointments.length}):`);
        appointments.forEach((a) => {
          lines.push(`  • ${this.formatTime(a.startTime)}${a.endTime ? ` – ${this.formatTime(a.endTime)}` : ''} [${a.status}]`);
        });
      }

      return lines.join('\n');
    } catch (err) {
      this.logger.error('toolGetDoctorAvailability failed', err);
      return 'Error checking doctor availability.';
    }
  }

  // ─── CONTEXT BUILDER ───────────────────────────────────────────────────────

  private async buildClinicSnapshot(): Promise<ClinicSnapshot> {
    const dayStart = this.startOfDay(new Date());
    const dayEnd = this.endOfDay(new Date());

    const [patientCount, todayAppointments, doctors] = await Promise.all([
      this.prisma.patient.count({ where: { isArchived: false } }),
      this.prisma.appointment.findMany({
        where: { date: { gte: dayStart, lte: dayEnd } },
        include: {
          patient: { select: { name: true } },
          doctor: { select: { name: true } },
        },
        orderBy: [{ queueNumber: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.user.findMany({
        where: { role: 'DOCTOR', isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    return { patientCount, todayAppointments, doctors };
  }

  private buildSystemPrompt(snapshot: ClinicSnapshot, action?: string): string {
    const { patientCount, todayAppointments, doctors } = snapshot;
    const today = new Date().toISOString().split('T')[0];

    const apptLines = todayAppointments.length
      ? todayAppointments
          .map(
            (a) =>
              `  Q${a.queueNumber ?? '-'}: ${a.patient.name} → Dr. ${a.doctor?.name ?? 'TBD'}` +
              ` at ${this.formatTime(a.startTime)} [${a.status}]` +
              (a.type ? ` (${a.type})` : ''),
          )
          .join('\n')
      : '  No appointments today.';

    const doctorLines = doctors
      .map((d) => `  • Dr. ${d.name} [UUID: ${d.id}]`)
      .join('\n');

    return `You are DentFlow AI — an expert dental clinic assistant with direct database access.

TODAY: ${today}

━━━ LIVE CLINIC DATA ━━━
Active Patients: ${patientCount}
Today's Appointments (${todayAppointments.length}):
${apptLines}

Available Doctors:
${doctorLines || '  None configured.'}

━━━ OPERATING RULES ━━━
1. ALWAYS call search_patients before booking to get the correct patient UUID. Never guess or hallucinate UUIDs.
2. When a user asks to book an appointment, IMMEDIATELY ask if it is for a "new or existing patient" before proceeding.
3. NEVER call a tool with placeholder text (e.g., "patient name"). If the user hasn't provided the exact name or query, ASK them for it first!
4. BEFORE directly adding anything to the DB (using create_patient or create_appointment), show the extracted data to the user for verification. Ask if they want to make any manual changes before you proceed.
5. Cleanly extract mobile numbers: remove all spaces, hyphens, and non-numeric characters. Ensure the final number is EXACTLY 10 digits (India format) before saving.
6. Pay very close attention to extracting regional Tamil names accurately, as users may speak them via voice input.
7. If information is missing, ask for ALL missing fields in ONE message (not one by one).
8. For appointments you need: patient name/ID, doctor, date (YYYY-MM-DD), time (HH:MM).
9. For new patients you need: name (required), phone (must be 10 digits), age, gender.
10. Confirm actions with the user before executing destructive operations (cancel/delete).
11. Be concise, warm, and professional. Use ✅ ❌ ℹ️ for status indicators.
9. Dates are always in IST (Asia/Kolkata). Today is ${today}.
${action ? `\n⚡ TRIGGERED ACTION: "${action}" — Ask the user for all required details in a single message.` : ''}`;
  }

  // ─── MAIN CHAT ENTRY POINT ─────────────────────────────────────────────────

  async chat(
    message: string,
    sessionId: string = 'default',
    action?: string,
  ): Promise<ChatResponse> {
    if (!message?.trim()) {
      return { reply: 'Please send a message.', sessionId, error: true };
    }

    // Track session activity
    this.sessionActivity.set(sessionId, Date.now());

    try {
      const snapshot = await this.buildClinicSnapshot();
      const systemPrompt = this.buildSystemPrompt(snapshot, action);

      const state = await this.agent.invoke(
        {
          messages: [
            new SystemMessage(systemPrompt),
            new HumanMessage(message.trim()),
          ],
        },
        {
          configurable: { thread_id: sessionId },
        },
      );

      // Extract final reply and collect tool names used
      const allMessages: any[] = state.messages ?? [];
      const finalMessage = allMessages[allMessages.length - 1];

      const toolsUsed = allMessages
        .filter((m) => m._getType?.() === 'tool' || m.type === 'tool')
        .map((m) => m.name)
        .filter(Boolean);

      const reply =
        typeof finalMessage?.content === 'string'
          ? finalMessage.content
          : Array.isArray(finalMessage?.content)
            ? finalMessage.content.map((c: any) => c.text ?? '').join('')
            : 'Action completed.';

      return { reply, sessionId, toolsUsed };
    } catch (err: any) {
      this.logger.error(`chat() failed for session "${sessionId}":`, err.message, err.stack);

      // Surface friendly errors
      if (err.message?.includes('rate limit')) {
        return { reply: 'I\'m receiving too many requests right now. Please try again in a moment.', sessionId, error: true };
      }
      if (err.message?.includes('API key')) {
        return { reply: 'AI service configuration error. Please contact support.', sessionId, error: true };
      }

      return { reply: 'Sorry, I encountered an error. Please try again.', sessionId, error: true };
    }
  }

  // ─── HELPERS ───────────────────────────────────────────────────────────────

  private parseDayRange(dateStr: string): { start: Date | null; end: Date | null; label: string } {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return { start: null, end: null, label: dateStr };
    return {
      start: this.startOfDay(d),
      end: this.endOfDay(d),
      label: dateStr,
    };
  }

  private startOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    return r;
  }

  private endOfDay(d: Date): Date {
    const r = new Date(d);
    r.setHours(23, 59, 59, 999);
    return r;
  }

  private formatTime(date: Date | null | undefined): string {
    if (!date) return '—';
    return new Date(date).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  }

  private async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${PATIENT_ID_PREFIX}-${year}`;

    const last = await this.prisma.patient.findFirst({
      where: { patientId: { startsWith: prefix } },
      orderBy: { patientId: 'desc' },
      select: { patientId: true },
    });

    const nextNum = last
      ? parseInt(last.patientId.split('-')[2] ?? '0', 10) + 1
      : 1;

    return `${prefix}-${String(nextNum).padStart(4, '0')}`;
  }

  /** Remove in-memory sessions that have been idle past TTL */
  private evictStaleSessions(): void {
    const cutoff = Date.now() - SESSION_TTL_MS;
    let evicted = 0;
    for (const [id, lastSeen] of this.sessionActivity.entries()) {
      if (lastSeen < cutoff) {
        this.sessionActivity.delete(id);
        evicted++;
      }
    }
    if (evicted > 0) {
      this.logger.debug(`Evicted ${evicted} stale session(s)`);
    }
  }

  /** Expose active session count for health checks */
  getActiveSessionCount(): number {
    return this.sessionActivity.size;
  }
}