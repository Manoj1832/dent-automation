import { Injectable, Logger, Inject, Optional } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { WhatsAppSenderService } from './whatsapp-sender.service';
import { AppointmentWorkflowService } from './appointment-workflow.service';
import { ConversationState, Gender } from '@prisma/client';
import Redis from 'ioredis';
import { REDIS_CLIENT } from '../common/redis.module';
import * as QRCode from 'qrcode';

interface InboundEvent {
  phone: string;
  content: string;
  messageType: string;
  interactiveReplyId?: string;
  senderName?: string;
  botPhoneId: string;
  waMessageId: string;
  metaMessageId: string;
}

interface ConversationContext {
  senderName?: string;
  patientId?: string;
  patientName?: string;
  collectingName?: string;
  collectingPhone?: string;
  patientAge?: number;
  patientGender?: string;
  doctorOptions?: Array<{ id: string; name: string }>;
  slotOptions?: Array<{ id: string; label: string; startTime: string }>;
  [key: string]: any;
}

@Injectable()
export class ConversationEngineService {
  private readonly logger = new Logger(ConversationEngineService.name);
  private redis: Redis | null = null;
  private readonly SESSION_TTL = 3600; // 1 hour
  private readonly MAX_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly sender: WhatsAppSenderService,
    private readonly workflow: AppointmentWorkflowService,
    @Inject(REDIS_CLIENT) @Optional() sharedRedis: Redis | null,
  ) {
    this.redis = sharedRedis;
    if (!this.redis) {
      this.logger.warn('ConversationEngine: no shared Redis — caching disabled');
    }
  }

  // ─── Event Listener ───────────────────────────────────────────────────────

  @OnEvent('whatsapp.message.received')
  async handleMessage(event: InboundEvent): Promise<void> {
    try {
      const conversation = await this.getOrCreateConversation(event.phone, event.senderName);
      await this.logMessage(conversation.id, 'user', event.content);

      // Link WhatsApp message to conversation (find by messageId not id)
      const whatsappMessage = await this.prisma.whatsAppMessage.findFirst({
        where: { messageId: event.waMessageId },
      });
      if (whatsappMessage) {
        await this.prisma.whatsAppMessage.update({
          where: { id: whatsappMessage.id },
          data: { conversationId: conversation.id, patientId: conversation.patientId },
        });
      }

      // Check global escape commands
      const lowerContent = event.content.toLowerCase().trim();
      if (['help', 'human', 'agent', 'staff', 'operator'].includes(lowerContent)) {
        await this.transitionTo(conversation, ConversationState.HUMAN_SUPPORT, event.phone);
        return;
      }
      if (['hi', 'hello', 'hey', 'start', 'restart', 'menu', 'back', 'return'].includes(lowerContent)) {
        if (conversation.humanTakeover) {
          await this.prisma.conversation.update({ where: { id: conversation.id }, data: { humanTakeover: false } });
          conversation.humanTakeover = false;
        }
        await this.transitionTo(conversation, ConversationState.GREETING, event.phone);
        return;
      }

      // Check for human takeover - send helpful message instead of skipping silently
      if (conversation.humanTakeover) {
        await this.sender.sendText(event.phone,
          '👤 You are currently connected to human support.\n\nType *menu* or *back* to return to the bot menu.'
        );
        return;
      }

      // Route to state handler
      await this.routeToState(conversation, event);
    } catch (error) {
      this.logger.error('ConversationEngine error for ' + event.phone + ': ' + (error as Error).message);
      await this.sender.sendText(event.phone, 'Sorry, something went wrong. Please try again or type "help" for assistance.');
    }
  }

  // ─── State Router ─────────────────────────────────────────────────────────

  private async routeToState(conversation: any, event: InboundEvent): Promise<void> {
    const state = conversation.state as ConversationState;
    const phone = event.phone;
    const text = event.content.trim();
    const replyId = event.interactiveReplyId;

    if (replyId?.startsWith('reschedule_')) {
      await this.handleRescheduleReply(conversation, phone, replyId);
      return;
    }

    switch (state) {
      case ConversationState.IDLE:
      case ConversationState.GREETING:
        await this.handleGreeting(conversation, phone);
        break;

      case ConversationState.SELECTING_ACTION:
        await this.handleActionSelection(conversation, phone, text, replyId);
        break;

      case ('ASK_NEW_EXISTING' as any):
        await this.handleAskNewExisting(conversation, phone, text, replyId);
        break;

      case ConversationState.IDENTIFYING_PATIENT:
        await this.handlePatientIdentification(conversation, phone, text);
        break;

      case ConversationState.COLLECTING_NAME:
        await this.handleCollectName(conversation, phone, text);
        break;

      case ConversationState.COLLECTING_PHONE:
        await this.handleCollectPhone(conversation, phone, text);
        break;

      case ConversationState.COLLECTING_AGE_GENDER:
        await this.handleCollectAgeGender(conversation, phone, text, replyId);
        break;

      case ConversationState.SELECTING_DOCTOR:
        await this.handleDoctorSelection(conversation, phone, text, replyId);
        break;

      case ConversationState.SELECTING_SLOT:
        await this.handleSlotSelection(conversation, phone, text, replyId);
        break;

      case ConversationState.CONFIRMING_BOOKING:
        await this.handleBookingConfirmation(conversation, phone, text, replyId);
        break;

      case ConversationState.HUMAN_SUPPORT:
        await this.sender.sendText(phone, '👤 You are connected to human support. A staff member will respond shortly.\n\nType *menu* or *back* to return to the bot.');
        break;

      case ConversationState.CANCELLING:
        await this.handleCancellationSelection(conversation, phone, text, replyId);
        break;

      case ConversationState.COMPLETED:
        await this.transitionTo(conversation, ConversationState.GREETING, phone);
        break;

      case ConversationState.RESCHEDULING:
      case ConversationState.FOLLOW_UP:
        await this.transitionTo(conversation, ConversationState.GREETING, phone);
        break;

      default:
        await this.transitionTo(conversation, ConversationState.GREETING, phone);
        break;
    }
  }

  // ─── State Handlers ───────────────────────────────────────────────────────

  private async handleGreeting(conv: any, phone: string): Promise<void> {
    await this.sender.sendButtons(
      phone,
      '✨ *Welcome to SREE ARUMUGAVADIVU DENTAL CLINIC!* ✨\nYour premium digital dental care partner.\n\nWe\'re thrilled to have you here. How can we bring a brighter smile to your face today?',
      [
        { id: 'action_book', title: '📅 Book Appointment' },
        { id: 'action_cancel', title: '❌ Cancel Appt' },
        { id: 'action_human', title: '👤 Talk to Staff' },
      ],
      'SREE ARUMUGAVADIVU DENTAL CLINIC',
    );
    await this.updateState(conv, ConversationState.SELECTING_ACTION);
  }

  private async handleActionSelection(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const action = replyId || text.toLowerCase();

    if (action.includes('book') || action === 'action_book' || action === '1') {
      await this.sender.sendButtons(
        phone,
        '📋 *Book Appointment*\n\nAre you a new patient or an existing patient?',
        [
          { id: 'patient_existing', title: '📱 Existing Patient' },
          { id: 'patient_new', title: '🆕 New Patient' },
        ],
      );
      await this.updateState(conv, ConversationState.ASK_NEW_EXISTING, { workflowType: 'BOOK_APPOINTMENT' });
    } else if (action.includes('cancel') || action === 'action_cancel' || action === '2') {
      await this.sender.sendButtons(
        phone,
        '📋 To cancel an appointment, are you a new or existing patient?',
        [
          { id: 'patient_existing', title: '📱 Existing Patient' },
          { id: 'patient_new', title: '🆕 New Patient' },
        ],
      );
      await this.updateState(conv, ConversationState.ASK_NEW_EXISTING, { workflowType: 'CANCEL_APPOINTMENT' });
    } else if (action.includes('human') || action.includes('staff') || action === 'action_human' || action === '3') {
      await this.transitionTo(conv, ConversationState.HUMAN_SUPPORT, phone);
    } else {
      await this.handleRetry(conv, phone, 'I didn\'t understand that. Please select an option:');
    }
  }

  private async handleAskNewExisting(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const reply = replyId || text.toLowerCase();
    const isCancel = conv.workflowType === 'CANCEL_APPOINTMENT';

    if (reply === 'patient_existing' || reply.includes('existing')) {
      await this.sender.sendText(phone, '📱 Please share your *10-digit mobile number* (e.g., 9876543210).');
      await this.updateState(conv, ConversationState.IDENTIFYING_PATIENT);
    } else if (reply === 'patient_new' || reply.includes('new')) {
      await this.sender.sendText(phone, '🆕 Awesome! Let\'s register you as a new patient.\n\n📝 What is your *full name*?');
      await this.updateState(conv, ConversationState.COLLECTING_NAME, { collectingName: 'waiting' });
    } else {
      await this.sender.sendButtons(
        phone,
        'Please select an option:',
        [
          { id: 'patient_existing', title: '📱 Existing Patient' },
          { id: 'patient_new', title: '🆕 New Patient' },
        ],
      );
    }
  }

  private async handlePatientIdentification(conv: any, phone: string, text: string): Promise<void> {
    const cleaned = text.replace(/[\s\-\+91]/g, '').replace(/^0/, '');

    if (/^\d{10}$/.test(cleaned)) {
      const patients = await this.workflow.searchPatient(cleaned);
      if (patients.length === 1) {
        const p = patients[0];
        const ctx: ConversationContext = this.getContext(conv);
        ctx.patientId = p.id;
        ctx.patientName = p.name;

        await this.prisma.conversation.update({ where: { id: conv.id }, data: { patientId: p.id } });

        if (conv.workflowType === 'CANCEL_APPOINTMENT') {
          await this.handleCancellationFlow(conv, phone, p.id, p.name);
          return;
        }

        await this.showDoctorSelection(conv, phone, p.name, ctx);
        return;
      }
    }

    const patients = await this.workflow.searchPatient(text);

    if (patients.length === 1) {
      const p = patients[0];
      const ctx: ConversationContext = this.getContext(conv);
      ctx.patientId = p.id;
      ctx.patientName = p.name;

      await this.prisma.conversation.update({ where: { id: conv.id }, data: { patientId: p.id } });

      if (conv.workflowType === 'CANCEL_APPOINTMENT') {
        await this.handleCancellationFlow(conv, phone, p.id, p.name);
        return;
      }

      await this.showDoctorSelection(conv, phone, p.name, ctx);
    } else if (patients.length > 1) {
      const list = patients.map((p, i) => `${i + 1}. ${p.name} (${p.patientId})`).join('\n');
      await this.sender.sendText(phone, `Multiple patients found:\n\n${list}\n\nPlease reply with the number or patient ID.`);
    } else {
      await this.sender.sendButtons(phone,
        `No patient found for "${text}".\n\nWould you like to register as a new patient?`,
        [{ id: 'new_yes', title: '✅ Yes, register' }, { id: 'new_no', title: '❌ No, try again' }],
      );
      await this.updateState(conv, ConversationState.COLLECTING_NAME);
    }
  }

  private async handleCollectName(conv: any, phone: string, text: string): Promise<void> {
    const replyLower = text.toLowerCase();
    if (replyLower === 'new_yes' || replyLower === 'yes' || replyLower.includes('register')) {
      await this.sender.sendText(phone, '📝 What is your *full name*?');
      await this.updateState(conv, ConversationState.COLLECTING_NAME, { collectingName: 'waiting' });
      return;
    }
    if (replyLower === 'new_no' || replyLower === 'no') {
      await this.sender.sendText(phone, 'Please share your *patient ID* (e.g., DF-2025-0001):');
      await this.updateState(conv, ConversationState.IDENTIFYING_PATIENT);
      return;
    }

    const ctx = this.getContext(conv);
    if (ctx.collectingName === 'waiting') {
      const name = text.trim();
      if (!name || name.length < 2) {
        await this.sender.sendText(phone, 'Error: Please enter a valid name (at least 2 characters).');
        return;
      }
      if (/^\d+$/.test(name)) {
        await this.sender.sendText(phone, 'Error: Name cannot contain only numbers. Please enter your name.');
        return;
      }
      ctx.collectingName = name;
      await this.sender.sendText(phone, `Great, ${ctx.collectingName}! 📱 Please share your *10-digit mobile number* (e.g., 9876543210).`);
      await this.updateState(conv, ConversationState.COLLECTING_PHONE, ctx);
    } else {
      const patients = await this.workflow.searchPatient(text);
      if (patients.length > 0) {
        await this.handlePatientIdentification(conv, phone, text);
      } else {
        await this.sender.sendButtons(phone,
          'Please select an option:',
          [{ id: 'new_yes', title: '✅ Yes, register' }, { id: 'new_no', title: '❌ Try again' }]
        );
      }
    }
  }

  private async handleCollectPhone(conv: any, phone: string, text: string): Promise<void> {
    const cleaned = text.replace(/[\s\-\+]/g, '').replace(/^0/, '');
    if (!/^[6-9]\d{9}$/.test(cleaned)) {
      await this.sender.sendText(phone, '❌ Please enter a valid *10-digit Indian mobile number* (e.g., 9876543210).');
      return;
    }

    const ctx = this.getContext(conv);

    const existingPatient = await this.prisma.patient.findFirst({
      where: { phone: cleaned, isArchived: false },
      select: { id: true, name: true, patientId: true },
    });

    if (existingPatient) {
      await this.sender.sendText(phone,
        `⚠️ A patient with this phone number already exists in our system.\n\n` +
        `Please select *Existing Patient* option to continue with your existing record.\n\n` +
        `If you need help, type *menu* to start over.`,
      );
      await this.updateState(conv, ConversationState.ASK_NEW_EXISTING);
      return;
    }

    ctx.collectedPhone = cleaned;
    await this.sender.sendButtons(phone,
      `📱 Perfect! Now please select your gender, and share your age (e.g., "25" or "30 years")`,
      [
        { id: 'age_male', title: '👨 Male' },
        { id: 'age_female', title: '👩 Female' },
        { id: 'age_other', title: '⚧ Other' },
      ],
    );
    await this.updateState(conv, ConversationState.COLLECTING_AGE_GENDER, ctx);
  }

  private async handleCollectAgeGender(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const ctx = this.getContext(conv);
    const reply = replyId || text.toLowerCase();
    
    let gender: Gender | undefined;
    if (reply.includes('male') || reply === 'age_male') {
      gender = Gender.MALE;
    } else if (reply.includes('female') || reply === 'age_female') {
      gender = Gender.FEMALE;
    }

    let age: number | undefined;
    const ageMatch = text.match(/\b(\d{1,2})\b/);
    if (ageMatch) {
      const parsedAge = parseInt(ageMatch[1]);
      if (parsedAge > 0 && parsedAge <= 100) {
        age = parsedAge;
      }
    }

    if (!age && !gender) {
      await this.sender.sendText(phone, 
        '❌ Please provide your age (e.g., 25 or 30) and select your gender from the buttons below.'
      );
      await this.sender.sendButtons(phone,
        'Select your gender:',
        [
          { id: 'age_male', title: '👨 Male' },
          { id: 'age_female', title: '👩 Female' },
          { id: 'age_other', title: '⚧ Other' },
        ],
      );
      return;
    }

    if (!gender) {
      gender = Gender.OTHER;
    }

    ctx.patientGender = gender;
    ctx.patientAge = age;

    if (!age) {
      await this.sender.sendText(phone, `Got it! Gender: ${gender === Gender.MALE ? '👨 Male' : gender === Gender.FEMALE ? '👩 Female' : '⚧ Other'}\n\nPlease enter your age (e.g., 25 or 30):`);
      return;
    }

    const patientPhone = ctx.collectedPhone;
    const name = ctx.collectingName || 'Unknown';

    try {
      const patient = await this.prisma.patient.create({
        data: {
          patientId: await this.generatePatientId(),
          name: name.trim(),
          phone: patientPhone,
          gender: gender,
          age: age,
          firstVisitDate: new Date(),
        },
        select: { id: true, name: true, patientId: true },
      });

      ctx.patientId = patient.id;
      ctx.patientName = patient.name;
      ctx.registeredPatientId = patient.patientId;
      ctx.registeredPatientPhone = patientPhone;

      await this.prisma.conversation.update({ where: { id: conv.id }, data: { patientId: patient.id } });

      let detailsMsg = `✅ *${patient.name}* registered (ID: ${patient.patientId})`;
      if (age) detailsMsg += `\n📅 Age: ${age}`;
      detailsMsg += `\n👤 Gender: ${gender}`;
      detailsMsg += `\n\nNow let's book your appointment!`;

      await this.sender.sendText(phone, detailsMsg);

      await this.showDoctorSelection(conv, phone, patient.name, ctx);
    } catch (error) {
      const errorMsg = (error as Error).message;
      this.logger.error(`Failed to create patient: ${errorMsg}`);
      await this.sender.sendText(phone,
        `❌ ${errorMsg}\n\nPlease try again or type *menu* to start over.`,
      );
    }
  }

  private async generatePatientId(): Promise<string> {
    const year = new Date().getFullYear();
    const lastPatient = await this.prisma.patient.findFirst({
      where: { patientId: { startsWith: `DF-${year}` } },
      orderBy: { patientId: 'desc' },
      select: { patientId: true },
    });

    let nextNum = 1;
    if (lastPatient) {
      const parts = lastPatient.patientId.split('-');
      nextNum = parseInt(parts[2] || '0') + 1;
    }

    return `DF-${year}-${String(nextNum).padStart(4, '0')}`;
  }

  private async sendPatientIdCardViaWhatsApp(phone: string, patientId: string, name: string, patientIdStr: string, patientPhone: string): Promise<void> {
    try {
      const qrPayload = JSON.stringify({
        id: patientId,
        patientId: patientIdStr,
        name: name,
        phone: patientPhone || '',
      });
      this.logger.debug(`QR payload: ${qrPayload}`);
      const qrDataUrl = await QRCode.toDataURL(qrPayload, {
        width: 300,
        margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
      });
      const base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');

      const message = `🏥 *Welcome to SREE ARUMUGAVADIVU DENTAL CLINIC!*\n\n` +
        `📋 *Patient ID Card*\n\n` +
        `👤 Name: ${name}\n` +
        `🆔 Patient ID: ${patientIdStr}\n` +
        `📱 Phone: ${patientPhone}\n` +
        `📅 First Visit: ${new Date().toLocaleDateString('en-IN')}\n\n` +
        `📱 Save this QR code - it contains your patient ID for quick check-in!\n\n` +
        `Thank you for choosing SREE ARUMUGAVADIVU! 🌟`;

      await this.sender.sendText(phone, message);
      await this.sender.sendImage(phone, base64Data, `Patient ID: ${patientIdStr}`);

      this.logger.log(`Sent ID card to new patient ${patientIdStr} at ${phone}`);
    } catch (error) {
      this.logger.error(`Failed to send ID card: ${(error as Error).message}`);
    }
  }

  private async showDoctorSelection(conv: any, phone: string, patientName: string, ctx: ConversationContext): Promise<void> {
    this.logger.debug(`showDoctorSelection called for patient: ${patientName}`);
    
    const doctors = await this.prisma.user.findMany({
      where: { role: 'DOCTOR', isActive: true },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });
    
    this.logger.debug(`Found ${doctors.length} doctors directly: ${JSON.stringify(doctors)}`);
    if (!doctors.length) {
      await this.sender.sendText(phone, '😔 No doctors are currently available. Please try again later or type "help" for assistance.');
      await this.updateState(conv, ConversationState.IDLE);
      return;
    }

    ctx.doctorOptions = doctors.map((d) => ({ id: d.id, name: d.name }));

    await this.sender.sendList(phone,
      `Hi ${patientName}! Please select a doctor:`,
      'Choose Doctor',
      [{
        title: 'Available Doctors',
        rows: doctors.map((d) => ({ id: `doc_${d.id}`, title: `Dr. ${d.name}` })),
      }],
    );
    await this.updateState(conv, ConversationState.SELECTING_DOCTOR, ctx);
  }

  private async handleDoctorSelection(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const ctx = this.getContext(conv);
    let doctorId: string | undefined;

    if (replyId?.startsWith('doc_')) {
      doctorId = replyId.replace('doc_', '');
    } else {
      const match = ctx.doctorOptions?.find((d) =>
        this.fuzzyMatch(text, d.name)
      );
      doctorId = match?.id;
    }

    if (!doctorId) {
      await this.handleRetry(conv, phone, 'Oops! I couldn\'t find a doctor matching that name. Could you please select one directly from the list below?');
      await this.showDoctorSelection(conv, phone, ctx.patientName || 'Patient', ctx);
      return;
    }

    const doctor = ctx.doctorOptions?.find((d) => d.id === doctorId);
    ctx.selectedDoctor = doctorId;

    this.logger.debug(`Getting slots for doctor: ${doctorId}`);
    const slots = await this.workflow.getAvailableSlots(doctorId);
    this.logger.debug(`Found ${slots.length} slots: ${JSON.stringify(slots)}`);
    if (!slots.length) {
      await this.sender.sendText(phone, `😔 Dr. ${doctor?.name || 'Selected doctor'} has no available slots. Please choose another doctor.`);
      return;
    }

    ctx.slotOptions = slots.map((s) => ({ id: s.id, label: s.label, startTime: s.startTime }));

    await this.sender.sendList(phone,
      `Available slots for Dr. ${doctor?.name}:`,
      'Choose Slot',
      [{
        title: 'Available Slots',
        rows: slots.slice(0, 10).map((s) => ({ id: `slot_${s.id}`, title: s.label })),
      }],
    );
    await this.updateState(conv, ConversationState.SELECTING_SLOT, { ...ctx, selectedDoctor: doctorId });
  }

  private async handleSlotSelection(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const ctx = this.getContext(conv);
    let slotId: string | undefined;

    if (replyId?.startsWith('slot_')) {
      slotId = replyId.replace('slot_', '');
    } else {
      const num = parseInt(text);
      if (!isNaN(num) && ctx.slotOptions?.[num - 1]) {
        slotId = ctx.slotOptions[num - 1].id;
      }
    }

    if (!slotId) {
      await this.handleRetry(conv, phone, 'Please select a valid slot from the list.');
      return;
    }

    const slot = ctx.slotOptions?.find((s) => s.id === slotId);
    const doctor = ctx.doctorOptions?.find((d) => d.id === ctx.selectedDoctor);

    await this.sender.sendButtons(phone,
      `📋 *Booking Summary*\n\n👤 Patient: ${ctx.patientName}\n🩺 Doctor: Dr. ${doctor?.name}\n📅 Slot: ${slot?.label}\n\nConfirm this appointment?`,
      [{ id: 'confirm_yes', title: '✅ Confirm' }, { id: 'confirm_no', title: '❌ Change' }],
    );
    await this.updateState(conv, ConversationState.CONFIRMING_BOOKING, { ...ctx, selectedSlot: slotId });
  }

  private async handleBookingConfirmation(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const answer = replyId || text.toLowerCase();

    if (answer === 'confirm_yes' || answer.includes('yes') || answer.includes('confirm')) {
      const ctx = this.getContext(conv);
      try {
        const appointment = await this.workflow.bookAppointment(
          ctx.patientId!,
          ctx.selectedDoctor!,
          ctx.selectedSlot!,
        );

        const isNewPatient = !!ctx.registeredPatientId;

        await this.sender.sendText(phone,
          `✅ *Appointment Booked!*\n\n` +
          `🔢 Queue: #${appointment.queueNumber}\n` +
          `👤 Patient: ${ctx.patientName}\n` +
          `🩺 Doctor: Dr. ${appointment.doctorName}\n` +
          `📅 Date: ${appointment.date}\n` +
          `🕐 Time: ${appointment.time}\n\n` +
          `Thank you! Type "menu" anytime to start over.`,
        );

        if (isNewPatient && ctx.registeredPatientId && ctx.registeredPatientPhone) {
          await this.sendPatientIdCardViaWhatsApp(
            phone,
            ctx.patientId!,
            ctx.patientName!,
            ctx.registeredPatientId,
            ctx.registeredPatientPhone,
          );
        }

        await this.updateState(conv, ConversationState.COMPLETED);
      } catch (error) {
        this.logger.error(`Booking failed: ${error.message}`);
        await this.sender.sendText(phone, `❌ Booking failed: ${error.message}\n\nPlease try again.`);
        await this.updateState(conv, ConversationState.SELECTING_SLOT);
      }
    } else {
      await this.sender.sendText(phone, 'No problem! Let me show you the slots again.');
      await this.updateState(conv, ConversationState.SELECTING_DOCTOR);
      const ctx = this.getContext(conv);
      await this.showDoctorSelection(conv, phone, ctx.patientName || 'Patient', ctx);
    }
  }

  private async handleCancellationFlow(conv: any, phone: string, patientId: string, patientName: string): Promise<void> {
    const appointments = await this.workflow.getUpcomingAppointments(patientId);
    if (!appointments.length) {
      await this.sender.sendText(phone, `No upcoming appointments found for ${patientName}.\n\nType "menu" to go back.`);
      await this.updateState(conv, ConversationState.IDLE);
      return;
    }

    const list = appointments.map((a, i) => `${i + 1}. ${a.date} at ${a.time} — Dr. ${a.doctorName}`).join('\n');
    await this.sender.sendText(phone, `Upcoming appointments for ${patientName}:\n\n${list}\n\nReply with the number to cancel, or "menu" to go back.`);
    await this.updateState(conv, ConversationState.CANCELLING, { patientId, appointments });
  }

  private async handleCancellationSelection(conv: any, phone: string, text: string, replyId?: string): Promise<void> {
    const ctx = this.getContext(conv);
    const appointments: Array<{ id: string; date: string; time: string; doctorName: string }> = ctx.appointments || [];

    const num = parseInt(text);
    if (isNaN(num) || num < 1 || num > appointments.length) {
      await this.sender.sendText(phone, `Please reply with a number from 1 to ${appointments.length}, or type "menu" to go back.`);
      return;
    }

    const appointment = appointments[num - 1];
    try {
      await this.workflow.cancelAppointment(appointment.id);
      await this.sender.sendText(phone, `✅ Your appointment on ${appointment.date} at ${appointment.time} has been cancelled. We hope to see you again soon!\n\nType "menu" to start over.`);
      await this.updateState(conv, ConversationState.COMPLETED);
    } catch (error) {
      this.logger.error(`Cancellation failed: ${error.message}`);
      await this.sender.sendText(phone, `❌ Could not cancel that appointment: ${error.message}\n\nPlease try again or type "menu".`);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async getOrCreateConversation(phone: string, senderName?: string) {
    const normalizedPhone = this.normalizePhone(phone);

    if (this.redis) {
      const cached = await this.redis.get(`conv:${normalizedPhone}`);
      if (cached) {
        try {
          const conv = JSON.parse(cached);
          if (conv.expiresAt && new Date(conv.expiresAt) < new Date()) {
            await this.redis.del(`conv:${normalizedPhone}`);
          } else {
            return conv;
          }
        } catch (e) {
          this.logger.warn(`Corrupted cache entry for ${normalizedPhone} — refetching from DB`);
          await this.redis.del(`conv:${normalizedPhone}`);
        }
      }
    }

    let conversation = await this.prisma.conversation.findFirst({
      where: { phone: normalizedPhone, state: { not: ConversationState.COMPLETED } },
      orderBy: { lastMessageAt: 'desc' },
    });

    if (!conversation || this.isExpired(conversation)) {
      conversation = await this.prisma.conversation.create({
        data: {
          phone: normalizedPhone,
          state: ConversationState.IDLE,
          lastMessageAt: new Date(),
          expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
          context: { senderName } as any,
        },
      });
    }

    if (this.redis) {
      await this.redis.set(`conv:${normalizedPhone}`, JSON.stringify(conversation), 'EX', this.SESSION_TTL);
    }

    return conversation;
  }

  private async updateState(conv: any, newState: ConversationState, extraContext?: any): Promise<void> {
    const ctx = { ...(this.getContext(conv)), ...(extraContext || {}) };
    const updated = await this.prisma.conversation.update({
      where: { id: conv.id },
      data: {
        state: newState,
        context: ctx as any,
        lastMessageAt: new Date(),
        expiresAt: new Date(Date.now() + this.SESSION_TTL * 1000),
        messageCount: { increment: 1 },
        retries: 0,
        workflowType: ctx.workflowType || conv.workflowType,
        selectedDoctor: ctx.selectedDoctor || null,
        selectedSlot: ctx.selectedSlot || null,
      },
    });

    if (this.redis) {
      await this.redis.set(`conv:${conv.phone}`, JSON.stringify(updated), 'EX', this.SESSION_TTL);
    }

    Object.assign(conv, updated);
  }

  private async transitionTo(conv: any, state: ConversationState, phone: string): Promise<void> {
    if (state === ConversationState.HUMAN_SUPPORT) {
      await this.prisma.conversation.update({ where: { id: conv.id }, data: { humanTakeover: true, state } });
      await this.sender.sendText(phone, '👤 Transferring you to a staff member. They\'ll be with you shortly.\n\nType "menu" to return to the bot.');
      return;
    }

    if (state === ConversationState.GREETING) {
      await this.updateState(conv, ConversationState.GREETING, {});
      await this.handleGreeting(conv, phone);
      return;
    }

    await this.updateState(conv, state);
  }

  private async handleRescheduleReply(conv: any, phone: string, replyId: string): Promise<void> {
    if (replyId.startsWith('reschedule_')) {
      const parts = replyId.split('_');
      const appointmentId = parts[1];
      const isYes = parts[2] === 'yes';

      if (isYes) {
        const appointment = await this.prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: { patient: true },
        });

        if (appointment) {
          await this.prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CANCELLED' },
          });

          const ctx = this.getContext(conv);
          ctx.patientId = appointment.patientId;
          ctx.patientName = appointment.patient?.name;

          await this.updateState(conv, ConversationState.IDENTIFYING_PATIENT, { workflowType: 'BOOK_APPOINTMENT' });

          await this.sender.sendText(phone,
            `Your previous appointment has been cancelled.\n\n` +
            `📋 Let's book a new appointment. Please share your *10-digit mobile number* or *patient ID*.`,
          );
        }
      } else {
        await this.sender.sendText(phone,
          `No problem! If you need to book again in the future, just type *menu*.\n\nTake care! 😊`,
        );
        await this.updateState(conv, ConversationState.COMPLETED);
      }
      return;
    }
  }

  private async handleRetry(conv: any, phone: string, message: string): Promise<void> {
    const retries = (conv.retries || 0) + 1;
    if (retries >= this.MAX_RETRIES) {
      await this.sender.sendText(phone, 'It seems I\'m having a bit of trouble understanding. No worries! I\'ll connect you with our friendly staff to help you out.');
      await this.transitionTo(conv, ConversationState.HUMAN_SUPPORT, phone);
      return;
    }
    await this.prisma.conversation.update({ where: { id: conv.id }, data: { retries } });
    conv.retries = retries;
    await this.sender.sendText(phone, message);
  }

  private fuzzyMatch(input: string, target: string): boolean {
    const i = input.toLowerCase().replace(/[^a-z0-9]/g, '');
    const t = target.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (i === t || t.includes(i)) return true;
    
    // Very basic Levenshtein check for small typos
    if (Math.abs(i.length - t.length) > 2) return false;
    let mismatches = 0;
    for (let j = 0, k = 0; j < i.length && k < t.length; j++, k++) {
      if (i[j] !== t[k]) {
        mismatches++;
        if (i.length > t.length) k--;
        else if (i.length < t.length) j--;
      }
    }
    return mismatches <= 2;
  }

  private async logMessage(conversationId: string, role: string, content: string): Promise<void> {
    await this.prisma.conversationMessage.create({
      data: { conversationId, role, content },
    });
  }

  private getContext(conv: any): ConversationContext {
    if (!conv.context || typeof conv.context !== 'object') return {};
    return conv.context as ConversationContext;
  }

  private isExpired(conv: any): boolean {
    if (!conv.expiresAt) return false;
    return new Date(conv.expiresAt) < new Date();
  }

  private normalizePhone(phone: string): string {
    return phone.replace(/[\s\-\+]/g, '');
  }

  // ─── Stale Session Cleanup (every 15 min) ─────────────────────────────────

  @Cron('0 */15 * * * *')
  async cleanupStaleSessions(): Promise<void> {
    const expired = await this.prisma.conversation.updateMany({
      where: {
        expiresAt: { lt: new Date() },
        state: { notIn: [ConversationState.IDLE, ConversationState.COMPLETED] },
      },
      data: { state: ConversationState.IDLE, retries: 0 },
    });

    if (expired.count > 0) {
      this.logger.log(`🧹 Cleaned up ${expired.count} stale conversations`);
    }
  }
}
