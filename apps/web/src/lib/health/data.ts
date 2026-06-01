import type { Appointment, Patient, Doctor, TimelineEntry, NotificationItem, RequestItem } from './types';

export const dummyDoctor: Doctor = {
  id: 'doc-1',
  name: 'Dr. Sarah Mitchell',
  specialty: 'Dental Specialist',
  avatar: 'https://i.pravatar.cc/150?img=47',
  rating: 4.9,
  totalPatients: 1240,
  clinic: 'Zendenta Clinic',
  location: '123 Healthcare Ave, Medical District',
};

export const dummyPatients: Patient[] = [
  { id: 'p1', name: 'James Wilson', email: 'james.wilson@email.com', phone: '+1 555-0101', age: 34, gender: 'Male', avatar: 'https://i.pravatar.cc/150?img=11' },
  { id: 'p2', name: 'Emma Thompson', email: 'emma.t@email.com', phone: '+1 555-0102', age: 28, gender: 'Female', avatar: 'https://i.pravatar.cc/150?img=5' },
  { id: 'p3', name: 'Michael Chen', email: 'm.chen@email.com', phone: '+1 555-0103', age: 45, gender: 'Male', avatar: 'https://i.pravatar.cc/150?img=12' },
  { id: 'p4', name: 'Sophia Martinez', email: 'sophia.m@email.com', phone: '+1 555-0104', age: 31, gender: 'Female', avatar: 'https://i.pravatar.cc/150?img=9' },
  { id: 'p5', name: 'Robert Brown', email: 'r.brown@email.com', phone: '+1 555-0105', age: 52, gender: 'Male', avatar: 'https://i.pravatar.cc/150?img=3' },
  { id: 'p6', name: 'Olivia Davis', email: 'olivia.d@email.com', phone: '+1 555-0106', age: 29, gender: 'Female', avatar: 'https://i.pravatar.cc/150?img=16' },
  { id: 'p7', name: 'William Johnson', email: 'w.johnson@email.com', phone: '+1 555-0107', age: 38, gender: 'Male', avatar: 'https://i.pravatar.cc/150?img=8' },
  { id: 'p8', name: 'Ava Garcia', email: 'ava.g@email.com', phone: '+1 555-0108', age: 25, gender: 'Female', avatar: 'https://i.pravatar.cc/150?img=20' },
];

const today = new Date();
const getDateStr = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
};

export const dummyAppointments: Appointment[] = [
  { id: 'a1', patient: dummyPatients[0], doctor: dummyDoctor, date: getDateStr(0), startTime: '08:30', endTime: '09:30', type: 'Root Canal', treatment: 'Root Canal Treatment', status: 'arrived', sessionsCount: 3, totalVisits: 8, rating: 4.8 },
  { id: 'a2', patient: dummyPatients[1], doctor: dummyDoctor, date: getDateStr(0), startTime: '10:00', endTime: '11:00', type: 'Consultation', treatment: 'General Consultation', status: 'pending', sessionsCount: 1, totalVisits: 3, rating: 4.5 },
  { id: 'a3', patient: dummyPatients[2], doctor: dummyDoctor, date: getDateStr(0), startTime: '11:30', endTime: '12:30', type: 'Open Access', treatment: 'Open Access Appointment', status: 'review', sessionsCount: 2, totalVisits: 5, rating: 4.2 },
  { id: 'a4', patient: dummyPatients[3], doctor: dummyDoctor, date: getDateStr(0), startTime: '14:00', endTime: '15:00', type: 'Wisdom Teeth', treatment: 'Wisdom Teeth Removal', status: 'member', sessionsCount: 4, totalVisits: 12, rating: 4.9 },
  { id: 'a5', patient: dummyPatients[4], doctor: dummyDoctor, date: getDateStr(1), startTime: '09:00', endTime: '10:00', type: 'Bleaching', treatment: 'Teeth Bleaching', status: 'completed', sessionsCount: 2, totalVisits: 6, rating: 4.7 },
  { id: 'a6', patient: dummyPatients[5], doctor: dummyDoctor, date: getDateStr(1), startTime: '11:00', endTime: '12:00', type: 'Scaling', treatment: 'Dental Scaling', status: 'pending', sessionsCount: 1, totalVisits: 2, rating: 4.3 },
  { id: 'a7', patient: dummyPatients[6], doctor: dummyDoctor, date: getDateStr(-1), startTime: '08:00', endTime: '09:00', type: 'Root Canal', treatment: 'Root Canal Treatment', status: 'completed', sessionsCount: 3, totalVisits: 9, rating: 4.6 },
  { id: 'a8', patient: dummyPatients[7], doctor: dummyDoctor, date: getDateStr(-1), startTime: '10:30', endTime: '11:30', type: 'Consultation', treatment: 'Second Opinion Consultation', status: 'rescheduled', sessionsCount: 1, totalVisits: 1, rating: 4.4 },
];

export const dummyNotifications: NotificationItem[] = [
  { id: 'n1', patient: dummyPatients[0], time: '08:30 AM', date: getDateStr(0), message: 'Appointment confirmed' },
  { id: 'n2', patient: dummyPatients[1], time: '10:00 AM', date: getDateStr(0), message: 'Waiting in lobby' },
  { id: 'n3', patient: dummyPatients[3], time: '2:00 PM', date: getDateStr(0), message: 'Lab results ready' },
  { id: 'n4', patient: dummyPatients[5], time: '11:00 AM', date: getDateStr(1), message: 'Reminder for tomorrow' },
  { id: 'n5', patient: dummyPatients[2], time: '11:30 AM', date: getDateStr(0), message: 'Needs pre-authorization' },
];

export const dummyRequests: RequestItem[] = [
  { id: 'r1', patient: dummyPatients[0], specialty: 'Dental Specialist', location: 'Zendenta Clinic', date: getDateStr(0), startTime: '08:30', endTime: '09:30' },
  { id: 'r2', patient: dummyPatients[1], specialty: 'Orthodontist', location: 'Main Branch', date: getDateStr(0), startTime: '10:00', endTime: '11:00' },
  { id: 'r3', patient: dummyPatients[3], specialty: 'Oral Surgeon', location: 'Zendenta Clinic', date: getDateStr(1), startTime: '09:00', endTime: '10:00' },
  { id: 'r4', patient: dummyPatients[5], specialty: 'Dental Specialist', location: 'Downtown Branch', date: getDateStr(0), startTime: '14:00', endTime: '15:00' },
];

export const dummyTimeline: TimelineEntry[] = [
  { id: 't1', date: getDateStr(0), time: '10:30 AM', type: 'Consultation', doctorName: 'Dr. Sarah Mitchell', nurseName: 'Linda K.', isLatest: true },
  { id: 't2', date: getDateStr(-7), time: '2:00 PM', type: 'Open Access', doctorName: 'Dr. Sarah Mitchell', nurseName: 'Mark T.' },
  { id: 't3', date: getDateStr(-14), time: '11:00 AM', type: 'Root Canal', doctorName: 'Dr. James Lee', nurseName: 'Linda K.' },
  { id: 't4', date: getDateStr(-21), time: '9:00 AM', type: 'Consultation', doctorName: 'Dr. Sarah Mitchell', nurseName: 'Mark T.' },
];

export const treatmentTypes = [
  'Root Canal',
  'Consultation',
  'Open Access',
  'Wisdom Teeth Removal',
  'Bleaching',
  'Scaling',
  'Crown Fitting',
  'Filling',
];