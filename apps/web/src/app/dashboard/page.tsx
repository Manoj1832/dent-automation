'use client';

import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar, Users, Activity, FlaskConical, BarChart3, ScanLine,
  Settings, UserPlus, FileText, Mic, MicOff, ChevronRight, Check,
  Syringe, Search, Camera, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { patientApi, appointmentApi, treatmentApi, doctorApi } from "@/lib/api";
import { Html5Qrcode } from "html5-qrcode";

interface Patient { id: string; name: string; patientId: string; phone: string | null; }
interface Doctor { id: string; name: string; }

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [patientForm, setPatientForm] = useState<{name:string; phone:string; email:string; age:string; gender:string; address:string}>({ name: '', phone: '', email: '', age: '', gender: '', address: '' });
  const [appointmentForm, setAppointmentForm] = useState<{patientId:string; doctorId:string; date:string; time:string; type:string}>({ patientId: '', doctorId: '', date: '', time: '', type: '' });
  const [treatmentForm, setTreatmentForm] = useState<{patientId:string; doctorId:string; procedure:string; procedureNotes:string; prescription:string; cost:string}>({ patientId: '', doctorId: '', procedure: '', procedureNotes: '', prescription: '', cost: '' });
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [qrScanning, setQrScanning] = useState(false);
  const [qrError, setQrError] = useState('');
  const [foundPatient, setFoundPatient] = useState<Patient | null>(null);
  const qrScannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderMounted = useRef(false);

  const handleQrScan = async (patientId: string) => {
    try {
      const { data } = await patientApi.scan(patientId);
      const p = data.data?.patient || data.data;
      setFoundPatient({ id: p.id, name: p.name, patientId: p.patientId, phone: p.phone });
      setQrScanning(false);
      if (qrScannerRef.current) {
        qrScannerRef.current.stop().catch(() => {});
        qrScannerRef.current = null;
      }
    } catch {
      toast.error('Patient not found');
    }
  };

  useEffect(() => {
    if (qrScanning && !qrScannerRef.current && qrReaderMounted.current) {
      const startScanner = async () => {
        try {
          const html5Qrcode = new Html5Qrcode('dashboard-qr-reader');
          qrScannerRef.current = html5Qrcode;
          await html5Qrcode.start(
            { facingMode: 'environment' },
            { fps: 10, qrbox: { width: 200, height: 200 } },
            (decodedText) => {
              html5Qrcode.stop().then(() => handleQrScan(decodedText));
            },
            () => {}
          );
        } catch { setQrScanning(false); setQrError('Camera error'); }
      };
      startScanner();
    }
  }, [qrScanning]);

  const startQrScanner = async () => {
    try {
      setQrError('');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(t => t.stop());
      qrReaderMounted.current = true;
      setQrScanning(true);
    } catch { setQrError('Camera permission denied'); toast.error('Please allow camera access'); }
  };

  const stopQrScanner = async () => {
    if (qrScannerRef.current) { try { await qrScannerRef.current.stop(); qrScannerRef.current = null; } catch {} }
    qrReaderMounted.current = false;
    setQrScanning(false);
  };

  const { data: patientsData } = useQuery({
    queryKey: ['dashboard-patients'], queryFn: () => patientApi.getAll({ limit: 100 }),
    select: (res) => res.data.data?.patients || [],
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors-list'], queryFn: () => doctorApi.getAll(),
    select: (res) => res.data.data?.doctors || [],
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['dashboard-appointments'], queryFn: () => appointmentApi.getAll({ limit: 50 }),
    select: (res) => res.data.data,
  });

  const createPatient = useMutation({
    mutationFn: (data: any) => patientApi.create(data),
    onSuccess: () => { toast.success('Patient registered!'); setActiveModal(null); resetForms(); queryClient.invalidateQueries({ queryKey: ['dashboard-patients'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createAppointment = useMutation({
    mutationFn: (data: any) => appointmentApi.create(data),
    onSuccess: () => { toast.success('Appointment booked!'); setActiveModal(null); resetForms(); queryClient.invalidateQueries({ queryKey: ['dashboard-appointments'] }); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const createTreatment = useMutation({
    mutationFn: (data: any) => treatmentApi.create(data),
    onSuccess: () => { toast.success('Treatment recorded!'); setActiveModal(null); resetForms(); },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed'),
  });

  const resetForms = () => {
    setPatientForm({ name: '', phone: '', email: '', age: '', gender: '', address: '' });
    setAppointmentForm({ patientId: '', doctorId: '', date: '', time: '', type: '' });
    setTreatmentForm({ patientId: '', doctorId: '', procedure: '', procedureNotes: '', prescription: '', cost: '' });
  };

  const startVoiceInput = (field: string) => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { toast.error('Voice not supported'); return; }
    const recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    setRecordingField(field);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setTreatmentForm((prev: any) => ({ ...prev, [field]: prev[field] + ' ' + transcript }));
    };
    recognition.onend = () => setRecordingField(null);
    recognition.start();
    setTimeout(() => recognition.stop(), 8000);
  };

  const handleSubmit = () => {
    if (activeModal === 'new-patient') {
      if (!patientForm.name || !patientForm.phone) { toast.error('Name & phone required'); return; }
      createPatient.mutate({ name: patientForm.name, phone: patientForm.phone, email: patientForm.email || null, age: patientForm.age ? parseInt(patientForm.age) : null, gender: patientForm.gender || null });
    } else if (activeModal === 'appointment') {
      if (!appointmentForm.patientId || !appointmentForm.doctorId || !appointmentForm.date) { toast.error('Fill required fields'); return; }
      let startTimeStr = '';
      if (appointmentForm.time) {
        const [hours, minutes] = appointmentForm.time.split(':');
        const d = new Date(appointmentForm.date);
        d.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
        startTimeStr = d.toISOString();
      } else {
        const d = new Date(appointmentForm.date);
        startTimeStr = d.toISOString();
      }
      const { time, ...rest } = appointmentForm;
      createAppointment.mutate({ ...rest, date: new Date(appointmentForm.date).toISOString(), startTime: startTimeStr });
    } else if (activeModal === 'treatment') {
      if (!treatmentForm.patientId || !treatmentForm.doctorId || !treatmentForm.procedure) { toast.error('Fill required fields'); return; }
      createTreatment.mutate({ ...treatmentForm, cost: treatmentForm.cost ? parseFloat(treatmentForm.cost) : null, visitDate: new Date() });
    }
  };

  const todayAppts = appointmentsData?.appointments?.filter((a: any) => new Date(a.date).toDateString() === new Date().toDateString()) || [];
  const upcomingAppts = appointmentsData?.appointments?.filter((a: any) => new Date(a.date) >= new Date())?.slice(0, 5) || [];

  return (
    <div className="animate-fade-in">
      {/* Greeting Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-[28px] font-bold text-[#0D0D0D] tracking-tight">Good Morning! 👋</h1>
          <p className="text-[14px] text-[#6B7280] mt-1">Welcome to SREE ARUMUGAVADIVU Dental Clinic</p>
        </div>
        {/* Quick Action Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={() => setActiveModal('new-patient')} className="h-8 px-3 rounded-[10px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[12px] font-medium btn-active">
            <UserPlus className="w-3.5 h-3.5 mr-1.5" /> New Patient
          </Button>
          <Button onClick={() => setActiveModal('appointment')} className="h-8 px-3 rounded-[10px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[12px] font-medium btn-active">
            <Calendar className="w-3.5 h-3.5 mr-1.5" /> Book Appt
          </Button>
          <Button onClick={() => setActiveModal('treatment')} className="h-8 px-3 rounded-[10px] bg-white border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] text-[12px] font-medium btn-active">
            <Syringe className="w-3.5 h-3.5 mr-1.5" /> Treatment
          </Button>
          <Button onClick={() => { setQrModalOpen(true); setFoundPatient(null); }} className="h-8 px-3 rounded-[10px] bg-[#DBEAFE] text-[#1D4ED8] hover:bg-[#BFDBFE] text-[12px] font-medium btn-active">
            <ScanLine className="w-3.5 h-3.5 mr-1.5" /> QR Scan
          </Button>
        </div>
      </div>

      {/* Stat Cards - 4 Column Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-[12px] p-4 bg-[#2563EB] text-white card-hover">
          <p className="font-display text-[28px] font-bold">{patientsData?.length || 0}</p>
          <p className="text-[11px] text-white/70 font-medium">Total Patients</p>
        </div>
        <div className="rounded-[12px] p-4 bg-[#1D4ED8] text-white card-hover">
          <p className="font-display text-[28px] font-bold">{todayAppts.length}</p>
          <p className="text-[11px] text-white/70 font-medium">Today's Appts</p>
        </div>
        <div className="rounded-[12px] p-4 bg-[#3B82F6] text-white card-hover">
          <p className="font-display text-[28px] font-bold">{upcomingAppts.length}</p>
          <p className="text-[11px] text-white/70 font-medium">Upcoming</p>
        </div>
        <div className="rounded-[12px] p-4 bg-[#60A5FA] text-white card-hover">
          <p className="font-display text-[28px] font-bold">₹12.5k</p>
          <p className="text-[11px] text-white/70 font-medium">Today Revenue</p>
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid md:grid-cols-5 gap-4">
        {/* Today's Schedule - 60% */}
        <div className="md:col-span-3 bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-[18px] font-semibold text-[#0D0D0D]">Today's Schedule</h2>
            <Link href="/dashboard/appointments" className="text-[12px] text-[#3B82F6] hover:underline">View All →</Link>
          </div>
          <div className="space-y-2">
            {todayAppts.length === 0 ? (
              <p className="text-[#9CA3AF] text-sm text-center py-6">No appointments today</p>
            ) : (
              todayAppts.slice(0, 4).map((apt: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-[10px] hover:bg-[#F8F9FA] transition-all border-l-2 border-transparent hover:border-[#3B82F6] group">
                  <div className="w-10 h-10 rounded-[10px] bg-[#DBEAFE] flex flex-col items-center justify-center">
                    <span className="text-[11px] font-bold text-[#1D4ED8]">{new Date(apt.date).getDate()}</span>
                    <span className="text-[9px] text-[#3B82F6]">{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[14px] text-[#0D0D0D] truncate">{apt.patient?.name || 'Patient'}</p>
                    <p className="text-[12px] text-[#9CA3AF]">Dr. {apt.doctor?.name} • {apt.startTime}</p>
                  </div>
                  <span className="badge-pill status-scheduled">{apt.status}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Access - 40% */}
        <div className="md:col-span-2 bg-white rounded-[14px] p-4 border border-[rgba(0,0,0,0.08)]">
          <h2 className="font-display text-[18px] font-semibold text-[#0D0D0D] mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Users, label: 'Patients', href: '/dashboard/patients' },
              { icon: Calendar, label: 'Appointments', href: '/dashboard/appointments' },
              { icon: Activity, label: 'Treatments', href: '/dashboard/treatments' },
              { icon: FlaskConical, label: 'Lab Cases', href: '/dashboard/lab' },
              { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
              { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div className="rounded-[10px] p-3 border border-[rgba(0,0,0,0.08)] flex flex-col items-center gap-2 hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer card-hover">
                  <div className="w-10 h-10 rounded-full bg-[#DBEAFE] flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-[#3B82F6]" />
                  </div>
                  <span className="text-[12px] text-[#6B7280]">{item.label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Dialog open={!!activeModal} onOpenChange={() => setActiveModal(null)}>
        <DialogContent className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-[18px] font-semibold">
              {activeModal === 'new-patient' && 'Register New Patient'}
              {activeModal === 'appointment' && 'Book Appointment'}
              {activeModal === 'treatment' && 'Record Treatment'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {activeModal === 'new-patient' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Full Name *</Label>
                  <Input value={patientForm.name} onChange={(e) => setPatientForm({...patientForm, name: e.target.value})} placeholder="Patient name" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Phone Number *</Label>
                  <Input value={patientForm.phone} onChange={(e) => setPatientForm({...patientForm, phone: e.target.value})} placeholder="10-digit mobile" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Age</Label>
                    <Input type="number" value={patientForm.age} onChange={(e) => setPatientForm({...patientForm, age: e.target.value})} placeholder="Age" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Gender</Label>
                    <Select value={patientForm.gender} onValueChange={(v) => setPatientForm({...patientForm, gender: v || ''})}>
                      <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MALE">Male</SelectItem>
                        <SelectItem value="FEMALE">Female</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Email</Label>
                  <Input type="email" value={patientForm.email} onChange={(e) => setPatientForm({...patientForm, email: e.target.value})} placeholder="email@example.com" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
              </>
            )}
            {activeModal === 'appointment' && (
              <>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Patient *</Label>
                  <Select value={appointmentForm.patientId} onValueChange={(v) => setAppointmentForm({...appointmentForm, patientId: v || ''})}>
                    <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patientsData?.map((p: Patient) => (<SelectItem key={p.id} value={p.id}>{p.name} ({p.patientId})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Doctor *</Label>
                  <Select value={appointmentForm.doctorId} onValueChange={(v) => setAppointmentForm({...appointmentForm, doctorId: v || ''})}>
                    <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select doctor" /></SelectTrigger>
                    <SelectContent>
                      {doctorsData?.map((d: Doctor) => (<SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Date *</Label>
                    <Input type="date" value={appointmentForm.date} onChange={(e) => setAppointmentForm({...appointmentForm, date: e.target.value})} className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Time</Label>
                    <Input type="time" value={appointmentForm.time} onChange={(e) => setAppointmentForm({...appointmentForm, time: e.target.value})} className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Type</Label>
                  <Select value={appointmentForm.type} onValueChange={(v) => setAppointmentForm({...appointmentForm, type: v || ''})}>
                    <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Consultation">Consultation</SelectItem>
                      <SelectItem value="Check-up">Check-up</SelectItem>
                      <SelectItem value="Treatment">Treatment</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            {activeModal === 'treatment' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Patient *</Label>
                    <Select value={treatmentForm.patientId} onValueChange={(v) => setTreatmentForm({...treatmentForm, patientId: v || ''})}>
                      <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {patientsData?.map((p: Patient) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Doctor *</Label>
                    <Select value={treatmentForm.doctorId} onValueChange={(v) => setTreatmentForm({...treatmentForm, doctorId: v || ''})}>
                      <SelectTrigger className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)]"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        {doctorsData?.map((d: Doctor) => (<SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Procedure *</Label>
                  <Input value={treatmentForm.procedure} onChange={(e) => setTreatmentForm({...treatmentForm, procedure: e.target.value})} placeholder="e.g., Root Canal, Extraction" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Notes</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => startVoiceInput('procedureNotes')}>
                      {recordingField === 'procedureNotes' ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Textarea value={treatmentForm.procedureNotes} onChange={(e) => setTreatmentForm({...treatmentForm, procedureNotes: e.target.value})} placeholder="Treatment notes..." rows={2} className="rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Prescription</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => startVoiceInput('prescription')}>
                      {recordingField === 'prescription' ? <MicOff className="w-4 h-4 text-red-500" /> : <Mic className="w-4 h-4" />}
                    </Button>
                  </div>
                  <Textarea value={treatmentForm.prescription} onChange={(e) => setTreatmentForm({...treatmentForm, prescription: e.target.value})} placeholder="Prescription details..." rows={2} className="rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Cost (₹)</Label>
                  <Input type="number" value={treatmentForm.cost} onChange={(e) => setTreatmentForm({...treatmentForm, cost: e.target.value})} placeholder="0.00" className="h-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveModal(null)} className="rounded-[10px]">Cancel</Button>
            <Button onClick={handleSubmit} className="bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[10px]">Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QR Scan Modal */}
      <Dialog open={qrModalOpen} onOpenChange={(open) => { setQrModalOpen(open); if (!open) stopQrScanner(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-[18px] font-semibold">
              <QrCode className="w-5 h-5" /> Scan Patient QR
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {!qrScanning && !foundPatient && (
              <div className="flex flex-col items-center py-6">
                <div className="w-40 h-40 rounded-[14px] bg-[#F1F0EA] flex items-center justify-center mb-4 border border-dashed border-[rgba(0,0,0,0.15)]">
                  <QrCode className="h-16 w-16 text-[#3B82F6]" />
                </div>
                <Button onClick={startQrScanner} className="bg-[#2563EB] hover:bg-[#1D4ED8] rounded-[10px]">
                  <Camera className="w-4 h-4 mr-2" /> Enable Camera
                </Button>
                {qrError && <p className="text-red-500 text-sm mt-2">{qrError}</p>}
                <div className="mt-4 w-full">
                  <div className="relative">
                    <Input placeholder="Enter Patient ID (e.g., DF-2026-0001)" id="manual-patient-id" className="h-10 pr-10 rounded-[10px] border-[rgba(0,0,0,0.08)] input-focus" />
                    <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 bg-[#2563EB] rounded-[8px]" onClick={() => { const input = document.getElementById('manual-patient-id') as HTMLInputElement; if (input?.value) handleQrScan(input.value); }}>
                      <Search className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
            {qrScanning && (
              <div className="space-y-4">
                <div className="relative aspect-square rounded-[14px] overflow-hidden bg-[#F1F0EA]">
                  <div id="dashboard-qr-reader" className="w-full h-full" />
                </div>
                <Button variant="outline" className="w-full rounded-[10px]" onClick={stopQrScanner}>Stop Camera</Button>
              </div>
            )}
            {foundPatient && (
              <div className="text-center py-4">
                <div className="w-16 h-16 rounded-full bg-[#DBEAFE] flex items-center justify-center mx-auto mb-3">
                  <Check className="w-8 h-8 text-[#3B82F6]" />
                </div>
                <h3 className="text-lg font-semibold text-[#0D0D0D]">{foundPatient.name}</h3>
                <p className="text-sm text-[#6B7280]">{foundPatient.patientId}</p>
                <div className="flex gap-2 mt-4">
                  <Button className="flex-1 bg-[#2563EB] rounded-[10px]" onClick={() => { setQrModalOpen(false); router.push(`/dashboard/patients/${foundPatient.id}`); }}>View Profile</Button>
                  <Button variant="outline" className="rounded-[10px]" onClick={() => setFoundPatient(null)}>Scan Another</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}