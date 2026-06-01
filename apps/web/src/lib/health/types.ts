export const healthColors = {
  primary: '#1A73E8',
  navy: '#1B2B5E',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  background: '#F4F6F9',
  card: '#FFFFFF',
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
} as const;

export type AppointmentStatus = 'arrived' | 'pending' | 'review' | 'member' | 'completed' | 'rescheduled';

export interface Patient {
  id: string;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  avatar: string;
}

export interface Appointment {
  id: string;
  patient: Patient;
  doctor: Doctor;
  date: string;
  startTime: string;
  endTime: string;
  type: string;
  treatment: string;
  status: AppointmentStatus;
  notes?: string;
  sessionsCount?: number;
  totalVisits?: number;
  rating?: number;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  avatar: string;
  rating: number;
  totalPatients: number;
  clinic: string;
  location: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  time: string;
  type: string;
  doctorName: string;
  nurseName: string;
  isLatest?: boolean;
}

export interface NotificationItem {
  id: string;
  patient: Patient;
  time: string;
  date: string;
  message?: string;
}

export interface RequestItem {
  id: string;
  patient: Patient;
  specialty: string;
  location: string;
  date: string;
  startTime: string;
  endTime: string;
}