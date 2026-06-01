'use client';

import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { appointmentApi, patientApi, doctorApi } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  CalendarDays,
  Clock,
  Plus,
  User,
  Stethoscope,
  Search,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Users,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  date: string;
  startTime: string;
  status: string;
  type: string | null;
  queueNumber: number | null;
  patient: { id: string; patientId: string; name: string; phone: string | null };
  doctor: { id: string; name: string };
}

interface Doctor {
  id: string;
  name: string;
  specialization: string | null;
}

interface PatientResult {
  id: string;
  patientId: string;
  name: string;
  phone: string | null;
}

// ─── STATUS CONFIG ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { dot: string; label: string; bg: string; text: string; border: string }> = {
  SCHEDULED:   { dot: '#00B4A6', label: 'Scheduled',   bg: '#E0F9F7', text: '#065F46', border: '#A7F3D0' },
  IN_PROGRESS: { dot: '#F59E0B', label: 'In Progress', bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
  COMPLETED:   { dot: '#10B981', label: 'Completed',   bg: '#D1FAE5', text: '#065F46', border: '#6EE7B7' },
  CANCELLED:   { dot: '#EF4444', label: 'Cancelled',   bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  MISSED:      { dot: '#8B5CF6', label: 'Missed',      bg: '#EDE9FE', text: '#5B21B6', border: '#C4B5FD' },
};

const QUEUE_ACCENTS = ['#0EA5E9', '#F59E0B', '#A78BFA', '#10B981'];

// ─── INLINE STYLES ────────────────────────────────────────────────────────────

const S = {
  page: {
    minHeight: '100vh',
    background: '#F4F6F9',
    fontFamily: "'DM Sans', system-ui, sans-serif",
    color: '#334155',
  } as React.CSSProperties,

  container: {
    maxWidth: 900,
    margin: '0 auto',
    padding: '32px 24px 64px',
  } as React.CSSProperties,

  // Header
  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
    gap: 16,
    flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  headerLeft: { display: 'flex', alignItems: 'center', gap: 14 } as React.CSSProperties,

  headerIconBox: {
    width: 48, height: 48, borderRadius: 14,
    background: '#0F2D6B',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  h1: {
    fontSize: 24, fontWeight: 800, color: '#0F2D6B',
    letterSpacing: '-0.5px', lineHeight: 1.2, margin: 0,
  } as React.CSSProperties,

  subtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 } as React.CSSProperties,

  newApptBtn: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: '#0F2D6B', color: '#fff',
    border: 'none', borderRadius: 12,
    padding: '10px 20px', fontSize: 14, fontWeight: 700,
    cursor: 'pointer', whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  // Date filter
  dateFilterBar: {
    display: 'flex', alignItems: 'center', gap: 0,
    background: '#fff', borderRadius: 14,
    border: '1px solid #E8EDF2',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    overflow: 'hidden', marginBottom: 24,
    width: 'fit-content',
  } as React.CSSProperties,

  dateNavBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 14px', color: '#64748B',
    display: 'flex', alignItems: 'center',
    transition: 'background 0.12s',
  } as React.CSSProperties,

  dateCenterBtn: {
    background: 'none', border: 'none', cursor: 'pointer',
    padding: '10px 18px', color: '#0F2D6B',
    fontWeight: 600, fontSize: 14,
    display: 'flex', alignItems: 'center', gap: 8,
    borderLeft: '1px solid #F0F0F0',
    borderRight: '1px solid #F0F0F0',
  } as React.CSSProperties,

  todayChip: {
    fontSize: 10, fontWeight: 700,
    background: '#E0F9F7', color: '#00B4A6',
    borderRadius: 999, padding: '2px 7px',
  } as React.CSSProperties,

  // Tabs
  tabList: {
    display: 'flex', gap: 4,
    background: '#fff',
    border: '1px solid #E8EDF2',
    borderRadius: 14, padding: 6,
    marginBottom: 20,
    width: 'fit-content',
  } as React.CSSProperties,

  tab: (active: boolean): React.CSSProperties => ({
    background: active ? '#0F2D6B' : 'transparent',
    color: active ? '#fff' : '#64748B',
    border: 'none', borderRadius: 10,
    padding: '8px 20px', fontSize: 13, fontWeight: active ? 700 : 500,
    cursor: 'pointer', transition: 'all 0.15s',
  }),

  // Cards
  queueCard: {
    background: '#fff', borderRadius: 16,
    boxShadow: '0 2px 10px rgba(0,0,0,0.055)',
    padding: '16px 20px', marginBottom: 10,
    display: 'flex', alignItems: 'center', gap: 16,
    border: '1px solid #F0F4F8',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'pointer',
    overflow: 'hidden',
    position: 'relative' as const,
  } as React.CSSProperties,

  queueNum: {
    width: 48, height: 48, borderRadius: '50%',
    background: '#0F2D6B',
    color: '#fff', fontWeight: 800, fontSize: 18,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  patientName: {
    fontWeight: 700, fontSize: 15, color: '#1E293B', margin: 0,
  } as React.CSSProperties,

  patientIdBadge: {
    background: '#F1F5F9', color: '#64748B',
    borderRadius: 999, padding: '2px 8px',
    fontSize: 10, fontWeight: 600, fontFamily: 'monospace',
    border: '1px solid #E2E8F0',
  } as React.CSSProperties,

  metaRow: {
    display: 'flex', alignItems: 'center', gap: 14,
    marginTop: 4, fontSize: 12, color: '#64748B', flexWrap: 'wrap' as const,
  } as React.CSSProperties,

  metaItem: {
    display: 'flex', alignItems: 'center', gap: 4,
  } as React.CSSProperties,

  statusBadge: (cfg: typeof STATUS_CONFIG[string]): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '4px 12px', borderRadius: 999,
    fontSize: 11, fontWeight: 700,
    background: cfg.bg, color: cfg.text,
    border: `1px solid ${cfg.border}`,
    whiteSpace: 'nowrap' as const,
    flexShrink: 0,
  }),

  statusDot: (cfg: typeof STATUS_CONFIG[string]): React.CSSProperties => ({
    width: 6, height: 6, borderRadius: '50%', background: cfg.dot,
  }),

  // All appointments compact card
  allCard: {
    background: '#fff', borderRadius: 14,
    boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
    padding: '14px 18px', marginBottom: 8,
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: 12,
    border: '1px solid #F0F4F8',
    transition: 'box-shadow 0.15s',
  } as React.CSSProperties,

  allCardLeft: { display: 'flex', alignItems: 'center', gap: 12 } as React.CSSProperties,

  qBadge: {
    width: 40, height: 40, borderRadius: 10,
    background: '#EEF6FE', color: '#0EA5E9',
    fontWeight: 800, fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid #BAE6FD',
    flexShrink: 0,
  } as React.CSSProperties,

  allCardRight: { display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 } as React.CSSProperties,

  timeText: { fontSize: 13, color: '#64748B', fontWeight: 600 } as React.CSSProperties,

  // Empty state
  emptyCard: {
    background: '#fff', borderRadius: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    padding: '56px 24px', textAlign: 'center' as const,
  } as React.CSSProperties,

  emptyIconBox: {
    width: 64, height: 64, borderRadius: 16,
    background: '#EEF2F9', margin: '0 auto 16px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  } as React.CSSProperties,

  emptyTitle: { fontSize: 16, fontWeight: 700, color: '#1E293B', margin: '0 0 6px' } as React.CSSProperties,
  emptySub: { fontSize: 13, color: '#94A3B8', margin: 0 } as React.CSSProperties,

  // Skeleton
  skeleton: {
    background: 'linear-gradient(90deg, #F1F5F9 25%, #E8EDF2 50%, #F1F5F9 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.4s infinite',
    borderRadius: 16,
    height: 80,
    marginBottom: 10,
  } as React.CSSProperties,

  // ── Wizard ──────────────────────────────────────────────────────────────────

  wizardDialog: {
    background: '#fff', borderRadius: 24,
    maxWidth: 420, width: '100%',
    padding: '28px 28px 24px',
    boxShadow: '0 24px 64px rgba(0,0,0,0.14)',
  } as React.CSSProperties,

  wizardHeaderRow: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20,
  } as React.CSSProperties,

  backBtn: {
    background: '#F1F5F9', border: 'none', borderRadius: 10,
    width: 32, height: 32, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  } as React.CSSProperties,

  wizardTitle: {
    fontSize: 18, fontWeight: 800, color: '#0F2D6B', margin: 0,
  } as React.CSSProperties,

  // Step indicator
  stepRow: {
    display: 'flex', gap: 6, marginBottom: 24, alignItems: 'center',
  } as React.CSSProperties,

  stepPill: (state: 'done' | 'active' | 'todo'): React.CSSProperties => ({
    height: 5, borderRadius: 999, transition: 'all 0.3s',
    flex: state === 'active' ? 2 : 1,
    background: state === 'done' ? '#0F2D6B' : state === 'active' ? '#0EA5E9' : '#E2E8F0',
  }),

  // Step 0 choice cards
  choiceGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 } as React.CSSProperties,

  choiceCard: (hover?: boolean): React.CSSProperties => ({
    border: `2px solid ${hover ? '#0EA5E9' : '#E8EDF2'}`,
    borderRadius: 16, padding: '20px 12px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    cursor: 'pointer', transition: 'all 0.15s',
    background: '#fff',
  }),

  choiceIconBox: (bg: string): React.CSSProperties => ({
    width: 52, height: 52, borderRadius: 14,
    background: bg,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }),

  choiceLabel: { fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 } as React.CSSProperties,
  choiceSub: { fontSize: 11, color: '#94A3B8', margin: 0 } as React.CSSProperties,

  // Search input
  searchWrap: { position: 'relative' as const, marginBottom: 10 } as React.CSSProperties,

  searchIcon: {
    position: 'absolute' as const, left: 12, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none' as const, zIndex: 2,
  } as React.CSSProperties,

  searchInput: {
    width: '100%', paddingLeft: 38, paddingRight: 12,
    height: 42, borderRadius: 12, fontSize: 14,
    border: '1.5px solid #E2E8F0', outline: 'none',
    fontFamily: 'inherit', color: '#1E293B', boxSizing: 'border-box' as const,
    background: '#FAFBFC',
  } as React.CSSProperties,

  // Patient selected card
  selectedPatientCard: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 12,
    background: '#F0FDF4', border: '1.5px solid #86EFAC',
    marginBottom: 4,
  } as React.CSSProperties,

  // Autocomplete results
  resultsBox: {
    background: '#fff', borderRadius: 12, border: '1.5px solid #E2E8F0',
    overflow: 'hidden', maxHeight: 210, overflowY: 'auto' as const,
    marginBottom: 4,
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  } as React.CSSProperties,

  resultRow: {
    width: '100%', padding: '10px 14px', background: 'none', border: 'none',
    textAlign: 'left' as const, cursor: 'pointer',
    borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s',
    fontFamily: 'inherit',
  } as React.CSSProperties,

  // Labels
  formLabel: {
    display: 'block', fontSize: 12, fontWeight: 700,
    color: '#475569', marginBottom: 6, letterSpacing: '0.3px',
  } as React.CSSProperties,

  // Field inputs
  fieldInput: {
    width: '100%', height: 42, borderRadius: 12, fontSize: 14,
    border: '1.5px solid #E2E8F0', outline: 'none',
    fontFamily: 'inherit', color: '#1E293B',
    padding: '0 12px', boxSizing: 'border-box' as const,
    background: '#fff',
  } as React.CSSProperties,

  grid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 } as React.CSSProperties,

  // Date/Time picker buttons
  pickerBtn: {
    width: '100%', height: 42, borderRadius: 12,
    border: '1.5px solid #E2E8F0', background: '#fff',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '0 12px', fontSize: 14, cursor: 'pointer',
    fontFamily: 'inherit', color: '#1E293B', boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  } as React.CSSProperties,

  pickerPlaceholder: { color: '#94A3B8', fontSize: 14 } as React.CSSProperties,

  // Primary action button
  primaryBtn: (disabled?: boolean): React.CSSProperties => ({
    width: '100%', height: 46, borderRadius: 12,
    background: disabled ? '#CBD5E1' : '#0F2D6B',
    color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'background 0.15s',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  }),

  tealBtn: (disabled?: boolean): React.CSSProperties => ({
    width: '100%', height: 46, borderRadius: 12,
    background: disabled ? '#CBD5E1' : '#00B4A6',
    color: '#fff', border: 'none', fontSize: 14, fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit', transition: 'background 0.15s',
  }),

  // Patient info chip in step 2
  patientChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 10,
    background: '#F8FAFC', border: '1px solid #E2E8F0',
    marginBottom: 4,
  } as React.CSSProperties,

  newPatientChip: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', borderRadius: 10,
    background: '#F0FDF4', border: '1px solid #86EFAC',
    marginBottom: 4,
  } as React.CSSProperties,

  // Section spacing
  fieldGroup: { marginBottom: 14 } as React.CSSProperties,
  spaceY4: { display: 'flex', flexDirection: 'column' as const, gap: 14 } as React.CSSProperties,
};

// ─── STEP INDICATOR ───────────────────────────────────────────────────────────

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={S.stepRow}>
      {Array.from({ length: total }).map((_, i) => {
        const state = i < step ? 'done' : i === step ? 'active' : 'todo';
        return <div key={i} style={S.stepPill(state)} />;
      })}
    </div>
  );
}

// ─── DATE PICKER MODAL ────────────────────────────────────────────────────────

function DatePickerModal({
  open, onOpenChange, selectedDate, onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate: string;
  onSelect: (date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDate) {
      const d = new Date(selectedDate);
      return new Date(d.getFullYear(), d.getMonth(), 1);
    }
    return new Date();
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const days = getDaysInMonth(currentMonth);
  const selectedDateObj = selectedDate ? new Date(selectedDate) : null;

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onSelect(newDate.toISOString().split('T')[0]);
    onOpenChange(false);
  };

  const cellStyle = (day: number | null, isPast: boolean, isSelected: boolean, isToday: boolean): React.CSSProperties => ({
    width: 36, height: 36, borderRadius: 8, border: 'none',
    fontFamily: 'inherit', fontSize: 13, fontWeight: 600,
    cursor: day === null || isPast ? 'default' : 'pointer',
    background: isSelected ? '#0F2D6B' : isToday ? '#EEF6FE' : 'transparent',
    color: isSelected ? '#fff' : isPast ? '#CBD5E1' : isToday ? '#0EA5E9' : '#334155',
    opacity: isPast && day !== null ? 0.45 : 1,
    transition: 'background 0.1s',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] p-0 gap-0 rounded-2xl overflow-hidden">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F4F8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: '#64748B' }}>
            <ChevronLeft size={18} />
          </button>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0F2D6B' }}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </span>
          <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8, color: '#64748B' }}>
            <ChevronRight size={18} />
          </button>
        </div>
        <div style={{ padding: '12px 14px 16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
            {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#94A3B8', padding: '2px 0' }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
            {days.map((day, idx) => {
              if (day === null) return <div key={`e-${idx}`} style={{ height: 36 }} />;
              const dateObj = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isPast = dateObj.getTime() < today.getTime();
              const isToday = dateObj.getTime() === today.getTime();
              const isSelected = !!(selectedDateObj &&
                dateObj.getFullYear() === selectedDateObj.getFullYear() &&
                dateObj.getMonth() === selectedDateObj.getMonth() &&
                dateObj.getDate() === selectedDateObj.getDate());
              return (
                <button key={day} onClick={() => !isPast && handleDateClick(day)} disabled={isPast}
                  style={cellStyle(day, isPast, isSelected, isToday)}>
                  {day}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── TIME PICKER MODAL ────────────────────────────────────────────────────────

function TimePickerModal({
  open, onOpenChange, selectedTime, onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTime: string;
  onSelect: (time: string) => void;
}) {
  const timeSlots: string[] = [];
  for (let h = 8; h <= 20; h++) {
    for (let m = 0; m < 60; m += 15) {
      timeSlots.push(`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    }
  }

  const fmt12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${p}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[320px] p-0 gap-0 rounded-2xl overflow-hidden">
        <div style={{ padding: '14px 16px', borderBottom: '1px solid #F0F4F8' }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0F2D6B' }}>Select Time</span>
        </div>
        <div style={{ maxHeight: 300, overflowY: 'auto', padding: '10px 12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {timeSlots.map(t => (
              <button key={t} onClick={() => { onSelect(t); onOpenChange(false); }}
                style={{
                  padding: '8px 4px', borderRadius: 10, border: 'none',
                  background: selectedTime === t ? '#0F2D6B' : '#F8FAFC',
                  color: selectedTime === t ? '#fff' : '#334155',
                  fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  fontFamily: 'inherit', transition: 'all 0.1s',
                }}>
                {fmt12(t)}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── SKELETON ─────────────────────────────────────────────────────────────────

function SkeletonCards() {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
      {[...Array(4)].map((_, i) => (
        <div key={i} style={S.skeleton} />
      ))}
    </>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'queue' | 'all'>('queue');

  // Wizard state
  const [bookingOpen, setBookingOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [patientType, setPatientType] = useState<'existing' | 'new' | null>(null);
  const [patientSearch, setPatientSearch] = useState('');
  const [ghostResults, setGhostResults] = useState<PatientResult[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<PatientResult | null>(null);
  const [newPatientData, setNewPatientData] = useState({ name: '', phone: '', age: '', gender: '' });
  const [apptDetails, setApptDetails] = useState({ doctorId: '', date: '', startTime: '', type: '' });
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [filterDatePickerOpen, setFilterDatePickerOpen] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);

  // Hover states
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [hoveredChoice, setHoveredChoice] = useState<string | null>(null);

  const openWizard = () => {
    setWizardStep(0); setPatientType(null); setSelectedPatient(null);
    setPatientSearch(''); setGhostResults([]);
    setNewPatientData({ name: '', phone: '', age: '', gender: '' });
    setApptDetails({ doctorId: '', date: '', startTime: '', type: '' });
    setBookingOpen(true);
  };

  const handleSearchChange = useCallback((val: string) => {
    setPatientSearch(val);
    setSelectedPatient(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.length < 1) { setGhostResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await patientApi.autocomplete(val);
        setGhostResults(res.data.data?.results || []);
      } catch { setGhostResults([]); }
    }, 220);
  }, []);

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['appointments-queue', dateFilter],
    queryFn: () => appointmentApi.getQueue(undefined, dateFilter),
    select: (res) => res.data.data || [],
  });

  const { data: allData, isLoading: allLoading } = useQuery({
    queryKey: ['appointments', dateFilter],
    queryFn: () => appointmentApi.getAll({ date: dateFilter }),
    select: (res) => res.data.data?.appointments || res.data.data || [],
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorApi.getAll({ limit: 20 }),
    select: (res) => res.data.data?.doctors || res.data.data || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => appointmentApi.create(data),
    onSuccess: () => {
      toast.success('Appointment booked!');
      setBookingOpen(false);
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['appointments-queue'] });
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed to book appointment');
    },
  });

  const handleFinalSubmit = async () => {
    if (!apptDetails.doctorId || !apptDetails.date || !apptDetails.startTime) {
      toast.error('Please fill doctor, date and time'); return;
    }
    const startDateTime = new Date(`${apptDetails.date}T${apptDetails.startTime}:00`).toISOString();
    const dateISO = new Date(apptDetails.date).toISOString();
    try {
      let pid = selectedPatient?.id || '';
      if (patientType === 'new') {
        if (!newPatientData.name) { toast.error('Patient name is required'); return; }
        const res = await patientApi.create({
          name: newPatientData.name,
          phone: newPatientData.phone || undefined,
          age: newPatientData.age ? parseInt(newPatientData.age) : undefined,
          gender: newPatientData.gender || undefined,
        });
        pid = res.data.data.id;
      }
      if (!pid) { toast.error('Please select a patient'); return; }
      createMutation.mutate({
        patientId: pid, doctorId: apptDetails.doctorId,
        date: dateISO, startTime: startDateTime,
        type: apptDetails.type || undefined,
      });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      toast.error(e.response?.data?.message || 'Failed');
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isToday = (dateStr: string) =>
    dateStr === new Date().toISOString().split('T')[0];

  const shiftDate = (delta: number) => {
    const d = new Date(dateFilter);
    d.setDate(d.getDate() + delta);
    setDateFilter(d.toISOString().split('T')[0]);
  };

  const fmt12 = (t: string) => {
    const [h, m] = t.split(':').map(Number);
    const p = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2,'0')} ${p}`;
  };

  const getStatusCfg = (status: string) =>
    STATUS_CONFIG[status] || STATUS_CONFIG.SCHEDULED;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={S.page}>
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        * { box-sizing: border-box; }
      `}</style>

      <div style={S.container}>

        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={S.headerRow}>
          <div style={S.headerLeft}>
            <div style={S.headerIconBox}>
              <CalendarDays size={22} color="#fff" strokeWidth={2} />
            </div>
            <div>
              <h1 style={S.h1}>Appointments</h1>
              <p style={S.subtitle}>Manage appointments and patient queue</p>
            </div>
          </div>
          <button
            style={S.newApptBtn}
            onClick={openWizard}
            onMouseEnter={e => (e.currentTarget.style.background = '#0A1F4D')}
            onMouseLeave={e => (e.currentTarget.style.background = '#0F2D6B')}
          >
            <Plus size={16} strokeWidth={2.5} />
            New Appointment
          </button>
        </div>

        {/* ── Date Filter ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <div style={S.dateFilterBar}>
            <button style={S.dateNavBtn} onClick={() => shiftDate(-1)}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <ChevronLeft size={16} />
            </button>
            <button style={S.dateCenterBtn} onClick={() => setFilterDatePickerOpen(true)}>
              <CalendarDays size={15} color="#0EA5E9" />
              <span>{formatDisplayDate(dateFilter)}</span>
              {isToday(dateFilter) && <span style={S.todayChip}>Today</span>}
            </button>
            <button style={S.dateNavBtn} onClick={() => shiftDate(1)}
              onMouseEnter={e => (e.currentTarget.style.background = '#F8FAFC')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <ChevronRight size={16} />
            </button>
          </div>
          <DatePickerModal
            open={filterDatePickerOpen}
            onOpenChange={setFilterDatePickerOpen}
            selectedDate={dateFilter}
            onSelect={setDateFilter}
          />
        </div>

        {/* ── Tabs ───────────────────────────────────────────────────────────── */}
        <div style={S.tabList}>
          {(['queue', 'all'] as const).map(t => (
            <button
              key={t}
              style={S.tab(activeTab === t)}
              onClick={() => setActiveTab(t)}
            >
              {t === 'queue' ? "Today's Queue" : 'All Appointments'}
            </button>
          ))}
        </div>

        {/* ── Tab: Queue ─────────────────────────────────────────────────────── */}
        {activeTab === 'queue' && (
          <>
            {queueLoading ? <SkeletonCards /> :
            Array.isArray(queueData) && queueData.length > 0 ? (
              queueData.map((apt: Appointment, idx: number) => {
                const cfg = getStatusCfg(apt.status);
                const accent = QUEUE_ACCENTS[Math.min(idx, QUEUE_ACCENTS.length - 1)];
                const isHovered = hoveredCard === apt.id;
                return (
                  <div
                    key={apt.id}
                    style={{
                      ...S.queueCard,
                      borderLeft: `4px solid ${accent}`,
                      transform: isHovered ? 'translateY(-2px)' : 'none',
                      boxShadow: isHovered
                        ? '0 8px 24px rgba(0,0,0,0.10)'
                        : '0 2px 10px rgba(0,0,0,0.055)',
                    }}
                    onMouseEnter={() => setHoveredCard(apt.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Queue number */}
                    <div style={{ ...S.queueNum, background: accent }}>
                      {apt.queueNumber ?? '—'}
                    </div>

                    {/* Patient info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={S.patientName}>{apt.patient.name}</span>
                        <span style={S.patientIdBadge}>{apt.patient.patientId}</span>
                      </div>
                      <div style={S.metaRow}>
                        <span style={S.metaItem}>
                          <Stethoscope size={12} color="#94A3B8" />
                          Dr. {apt.doctor.name}
                        </span>
                        <span style={S.metaItem}>
                          <Clock size={12} color="#94A3B8" />
                          {new Date(apt.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {apt.type && (
                          <span style={S.metaItem}>
                            <User size={12} color="#94A3B8" />
                            {apt.type.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Status */}
                    <span style={S.statusBadge(cfg)}>
                      <span style={S.statusDot(cfg)} />
                      {cfg.label}
                    </span>
                  </div>
                );
              })
            ) : (
              <div style={S.emptyCard}>
                <div style={S.emptyIconBox}>
                  <CalendarDays size={28} color="#0F2D6B" />
                </div>
                <p style={S.emptyTitle}>No appointments today</p>
                <p style={S.emptySub}>Create an appointment to see the queue</p>
                <button
                  onClick={openWizard}
                  style={{ ...S.primaryBtn(), marginTop: 20, width: 'auto', padding: '0 24px' }}
                >
                  <Plus size={16} />
                  Schedule Now
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Tab: All ───────────────────────────────────────────────────────── */}
        {activeTab === 'all' && (
          <>
            {allLoading ? <SkeletonCards /> :
            Array.isArray(allData) && allData.length > 0 ? (
              allData.map((apt: Appointment) => {
                const cfg = getStatusCfg(apt.status);
                return (
                  <div
                    key={apt.id}
                    style={{
                      ...S.allCard,
                      boxShadow: hoveredCard === apt.id
                        ? '0 4px 16px rgba(0,0,0,0.09)'
                        : '0 1px 6px rgba(0,0,0,0.05)',
                    }}
                    onMouseEnter={() => setHoveredCard(apt.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    <div style={S.allCardLeft}>
                      <div style={S.qBadge}>Q{apt.queueNumber}</div>
                      <div>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                          {apt.patient.name}
                        </p>
                        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginTop: 2 }}>
                          Dr. {apt.doctor.name} · {apt.type?.replace(/_/g,' ') || 'General'}
                        </p>
                      </div>
                    </div>
                    <div style={S.allCardRight}>
                      <span style={S.timeText}>
                        {new Date(apt.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={S.statusBadge(cfg)}>
                        <span style={S.statusDot(cfg)} />
                        {cfg.label}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={S.emptyCard}>
                <div style={S.emptyIconBox}>
                  <CalendarDays size={28} color="#0F2D6B" />
                </div>
                <p style={S.emptyTitle}>No appointments for this date</p>
                <p style={S.emptySub}>Tap + New Appointment to schedule one</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Booking Wizard Dialog ─────────────────────────────────────────────── */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent
          className="p-0 gap-0 border-0 shadow-2xl"
          style={{ borderRadius: 24, maxWidth: 420, overflow: 'hidden' }}
        >
          <div style={{ padding: '28px 28px 24px' }}>

            {/* Dialog header */}
            <DialogHeader>
              <div style={S.wizardHeaderRow}>
                {wizardStep > 0 && (
                  <button
                    type="button"
                    style={S.backBtn}
                    onClick={() => setWizardStep(s => s - 1)}
                  >
                    <ArrowLeft size={16} color="#475569" />
                  </button>
                )}
                <DialogTitle style={S.wizardTitle}>
                  {wizardStep === 0
                    ? 'New Appointment'
                    : wizardStep === 1
                      ? patientType === 'new' ? 'Register Patient' : 'Find Patient'
                      : 'Appointment Details'}
                </DialogTitle>
              </div>
            </DialogHeader>

            <StepIndicator step={wizardStep} total={3} />

            {/* ── Step 0: Choose type ── */}
            {wizardStep === 0 && (
              <div style={S.choiceGrid}>
                {/* Existing patient */}
                <button
                  type="button"
                  style={{
                    ...S.choiceCard(),
                    border: `2px solid ${hoveredChoice === 'existing' ? '#0EA5E9' : '#E8EDF2'}`,
                    background: hoveredChoice === 'existing' ? '#F0F7FF' : '#fff',
                  }}
                  onClick={() => { setPatientType('existing'); setWizardStep(1); }}
                  onMouseEnter={() => setHoveredChoice('existing')}
                  onMouseLeave={() => setHoveredChoice(null)}
                >
                  <div style={S.choiceIconBox(hoveredChoice === 'existing' ? '#DBEAFE' : '#F1F5F9')}>
                    <Users size={24} color={hoveredChoice === 'existing' ? '#0EA5E9' : '#64748B'} />
                  </div>
                  <p style={S.choiceLabel}>Existing Patient</p>
                  <p style={S.choiceSub}>Search & select</p>
                </button>

                {/* New patient */}
                <button
                  type="button"
                  style={{
                    ...S.choiceCard(),
                    border: `2px solid ${hoveredChoice === 'new' ? '#00B4A6' : '#E8EDF2'}`,
                    background: hoveredChoice === 'new' ? '#F0FDFB' : '#fff',
                  }}
                  onClick={() => { setPatientType('new'); setWizardStep(1); }}
                  onMouseEnter={() => setHoveredChoice('new')}
                  onMouseLeave={() => setHoveredChoice(null)}
                >
                  <div style={S.choiceIconBox(hoveredChoice === 'new' ? '#CCFBF1' : '#F1F5F9')}>
                    <UserPlus size={24} color={hoveredChoice === 'new' ? '#00B4A6' : '#64748B'} />
                  </div>
                  <p style={S.choiceLabel}>New Patient</p>
                  <p style={S.choiceSub}>Register & book</p>
                </button>
              </div>
            )}

            {/* ── Step 1a: Existing patient search ── */}
            {wizardStep === 1 && patientType === 'existing' && (
              <div>
                <div style={S.searchWrap}>
                  <span style={S.searchIcon}>
                    <Search size={16} color="#94A3B8" />
                  </span>
                  <input
                    style={S.searchInput}
                    placeholder="Type name, phone, or patient ID…"
                    value={patientSearch}
                    autoFocus
                    onChange={e => handleSearchChange(e.target.value)}
                    onKeyDown={e => {
                      if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghostResults.length > 0) {
                        const top = ghostResults[0].name;
                        if (top.toLowerCase().startsWith(patientSearch.toLowerCase())) {
                          e.preventDefault();
                          handleSearchChange(top);
                        }
                      }
                    }}
                  />
                </div>

                {selectedPatient ? (
                  <div style={S.selectedPatientCard}>
                    <CheckCircle2 size={18} color="#16A34A" />
                    <div style={{ flex: 1 }}>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        {selectedPatient.name}
                      </p>
                      <p style={{ margin: 0, fontSize: 11, color: '#64748B', fontFamily: 'monospace', marginTop: 2 }}>
                        {selectedPatient.patientId}{selectedPatient.phone && ` · ${selectedPatient.phone}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedPatient(null); setPatientSearch(''); }}
                      style={{ background: 'none', border: 'none', fontSize: 11, color: '#94A3B8', cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                      Change
                    </button>
                  </div>
                ) : ghostResults.length > 0 && (
                  <div style={{ ...S.resultsBox, marginBottom: 12 }}>
                    {ghostResults.map(p => (
                      <button
                        key={p.id}
                        type="button"
                        style={S.resultRow}
                        onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); setGhostResults([]); }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#F4F6F9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#1E293B' }}>{p.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: '#94A3B8', fontFamily: 'monospace', marginTop: 2 }}>
                          {p.patientId}{p.phone && ` · ${p.phone}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <button
                  style={S.primaryBtn(!selectedPatient)}
                  disabled={!selectedPatient}
                  onClick={() => setWizardStep(2)}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ── Step 1b: New patient form ── */}
            {wizardStep === 1 && patientType === 'new' && (
              <div style={S.spaceY4}>
                <div>
                  <label style={S.formLabel}>Full Name *</label>
                  <input
                    style={S.fieldInput}
                    placeholder="Patient's full name"
                    value={newPatientData.name}
                    autoFocus
                    onChange={e => setNewPatientData(d => ({ ...d, name: e.target.value }))}
                  />
                </div>
                <div style={S.grid2}>
                  <div>
                    <label style={S.formLabel}>Phone</label>
                    <input
                      style={S.fieldInput}
                      placeholder="Mobile number"
                      value={newPatientData.phone}
                      onChange={e => setNewPatientData(d => ({ ...d, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={S.formLabel}>Age</label>
                    <input
                      type="number"
                      style={S.fieldInput}
                      placeholder="Age"
                      value={newPatientData.age}
                      onChange={e => setNewPatientData(d => ({ ...d, age: e.target.value }))}
                    />
                  </div>
                </div>
                <button
                  style={S.tealBtn(!newPatientData.name)}
                  disabled={!newPatientData.name}
                  onClick={() => setWizardStep(2)}
                >
                  Continue →
                </button>
              </div>
            )}

            {/* ── Step 2: Appointment details ── */}
            {wizardStep === 2 && (
              <div style={S.spaceY4}>
                {/* Patient chip */}
                {selectedPatient && (
                  <div style={S.patientChip}>
                    <User size={15} color="#64748B" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', flex: 1 }}>
                      {selectedPatient.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'monospace' }}>
                      {selectedPatient.patientId}
                    </span>
                  </div>
                )}
                {patientType === 'new' && newPatientData.name && (
                  <div style={S.newPatientChip}>
                    <UserPlus size={15} color="#00B4A6" />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', flex: 1 }}>
                      {newPatientData.name}
                    </span>
                    <span style={{ fontSize: 11, color: '#00B4A6', fontWeight: 600 }}>New patient</span>
                  </div>
                )}

                {/* Doctor select — keep shadcn Select for API integration */}
                <div>
                  <label style={S.formLabel}>Doctor *</label>
                  <Select
                    value={apptDetails.doctorId}
                    onValueChange={v => setApptDetails(d => ({ ...d, doctorId: v ?? '' }))}
                  >
                    <SelectTrigger className="mt-1 h-[42px] rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-1 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {doctorsData?.map((doc: Doctor) => (
                        <SelectItem key={doc.id} value={doc.id} className="text-sm">
                          {doc.name}{doc.specialization ? ` — ${doc.specialization}` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date & Time */}
                <div style={S.grid2}>
                  <div>
                    <label style={S.formLabel}>Date *</label>
                    <button
                      type="button"
                      style={S.pickerBtn}
                      onClick={() => setDatePickerOpen(true)}
                    >
                      {apptDetails.date
                        ? <span style={{ fontSize: 13, fontWeight: 600 }}>{formatDisplayDate(apptDetails.date)}</span>
                        : <span style={S.pickerPlaceholder}>Select date</span>
                      }
                      <CalendarDays size={15} color="#94A3B8" />
                    </button>
                  </div>
                  <div>
                    <label style={S.formLabel}>Time *</label>
                    <button
                      type="button"
                      style={S.pickerBtn}
                      onClick={() => setTimePickerOpen(true)}
                    >
                      {apptDetails.startTime
                        ? <span style={{ fontSize: 13, fontWeight: 600 }}>{fmt12(apptDetails.startTime)}</span>
                        : <span style={S.pickerPlaceholder}>Select time</span>
                      }
                      <Clock size={15} color="#94A3B8" />
                    </button>
                  </div>
                </div>

                {/* Type select */}
                <div>
                  <label style={S.formLabel}>Type</label>
                  <Select
                    value={apptDetails.type}
                    onValueChange={v => setApptDetails(d => ({ ...d, type: v ?? '' }))}
                  >
                    <SelectTrigger className="mt-1 h-[42px] rounded-xl border-slate-200 bg-white text-sm font-medium focus:ring-1 focus:ring-[#0EA5E9] focus:border-[#0EA5E9]">
                      <SelectValue placeholder="Appointment type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      {['CHECKUP','CLEANING','ROOT_CANAL','EXTRACTION','FILLING','CROWN','IMPLANT','ORTHODONTICS','OTHER'].map(t => (
                        <SelectItem key={t} value={t} className="text-sm">
                          {t.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Confirm */}
                <button
                  style={S.primaryBtn(createMutation.isPending)}
                  onClick={handleFinalSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Booking…' : '✓ Confirm Appointment'}
                </button>
              </div>
            )}

            {/* Nested modals */}
            <DatePickerModal
              open={datePickerOpen}
              onOpenChange={setDatePickerOpen}
              selectedDate={apptDetails.date}
              onSelect={date => setApptDetails(d => ({ ...d, date }))}
            />
            <TimePickerModal
              open={timePickerOpen}
              onOpenChange={setTimePickerOpen}
              selectedTime={apptDetails.startTime}
              onSelect={time => setApptDetails(d => ({ ...d, startTime: time }))}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}