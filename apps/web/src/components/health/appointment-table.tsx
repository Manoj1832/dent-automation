'use client';

import type { Appointment } from '@/lib/health/types';
import { StatusBadge } from './status-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { MoreHorizontal, MessageSquare, Video, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';

function getDateLabel(dateStr: string): string {
  const d = parseISO(dateStr);
  if (isToday(d)) return 'Today';
  if (isTomorrow(d)) return 'Tomorrow';
  return format(d, 'EEE, MMM d');
}

interface AppointmentTableProps {
  appointments: Appointment[];
  title: string;
  upcoming?: boolean;
  showActions?: boolean;
}

export function AppointmentTable({ appointments, title, upcoming = true, showActions = true }: AppointmentTableProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[#1A1A2E]">{title}</h3>
          <span className="px-2 py-0.5 rounded-full bg-[#1A73E8]/10 text-[#1A73E8] text-xs font-medium">
            {appointments.length}
          </span>
        </div>
        <div className="flex gap-1">
          <button className="px-3 py-1 rounded-lg text-xs font-medium bg-[#1A73E8] text-white">Upcoming</button>
          <button className="px-3 py-1 rounded-lg text-xs font-medium text-[#6B7280] hover:bg-[#F4F6F9]">Past</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E5E7EB]">
              <th className="text-left text-xs font-medium text-[#6B7280] p-3 pl-4">Patient Name</th>
              <th className="text-left text-xs font-medium text-[#6B7280] p-3">Age</th>
              <th className="text-left text-xs font-medium text-[#6B7280] p-3">Date</th>
              <th className="text-left text-xs font-medium text-[#6B7280] p-3">Doctor</th>
              <th className="text-left text-xs font-medium text-[#6B7280] p-3">Status</th>
              {showActions && <th className="text-right text-xs font-medium text-[#6B7280] p-3 pr-4">Action</th>}
            </tr>
          </thead>
          <tbody>
            {appointments.map((apt) => (
              <tr key={apt.id} className="border-b border-[#E5E7EB]/50 hover:bg-[#F4F6F9]/50 transition-colors">
                <td className="p-3 pl-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={apt.patient.avatar} />
                      <AvatarFallback className="bg-[#1A73E8]/10 text-[#1A73E8] text-[10px]">
                        {apt.patient.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-[#1A1A2E]">{apt.patient.name}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-[#6B7280]">{apt.patient.age}</td>
                <td className="p-3 text-sm text-[#6B7280]">{getDateLabel(apt.date)}</td>
                <td className="p-3 text-sm text-[#6B7280]">{apt.doctor.name}</td>
                <td className="p-3"><StatusBadge status={apt.status} /></td>
                {showActions && (
                  <td className="p-3 pr-4">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-[#F4F6F9] text-[#6B7280]"><MessageSquare className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#F4F6F9] text-[#6B7280]"><Video className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#F4F6F9] text-[#6B7280]"><Phone className="w-4 h-4" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-[#F4F6F9] text-[#6B7280]"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {appointments.length === 0 && (
        <div className="text-center py-12">
          <p className="text-sm text-[#9CA3AF]">No appointments</p>
        </div>
      )}
    </div>
  );
}

interface MyRequestsTableProps {
  requests: Array<{ id: string; patient: { name: string; avatar: string; age: number }; specialty: string; date: string; time: string; status: string }>;
}

export function MyRequestsTable({ requests }: MyRequestsTableProps) {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
        <h3 className="text-sm font-semibold text-[#1A1A2E]">My requests</h3>
        <span className="px-2 py-0.5 rounded-full bg-[#F59E0B]/10 text-[#F59E0B] text-xs font-medium">
          {requests.length}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {requests.map((req) => (
          <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-[#F4F6F9]">
            <div className="flex items-center gap-3">
              <Avatar className="w-8 h-8">
                <AvatarImage src={req.patient.avatar} />
                <AvatarFallback className="bg-[#1A73E8]/10 text-[#1A73E8] text-[10px]">
                  {req.patient.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-[#1A1A2E]">{req.patient.name}</p>
                <p className="text-xs text-[#6B7280]">{req.specialty} • {req.date} at {req.time}</p>
              </div>
            </div>
            <a href="#" className="text-xs text-[#1A73E8] hover:underline">View</a>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CTACard() {
  return (
    <div className="rounded-xl p-5 bg-gradient-to-br from-[#1A73E8] to-[#1B2B5E] text-white relative overflow-hidden">
      <div className="relative z-10">
        <h3 className="font-semibold text-base">Need a second opinion?</h3>
        <p className="text-sm text-white/80 mt-1">
          Get expert consultation from our specialists
        </p>
        <Button size="sm" className="mt-4 bg-white text-[#1A73E8] hover:bg-white/90">
          Request Consultation
        </Button>
      </div>
      <div className="absolute right-0 bottom-0 w-32 h-32 opacity-10">
        <svg viewBox="0 0 100 100" className="w-full h-full">
          <circle cx="80" cy="80" r="40" fill="white" />
          <path d="M60 60 L80 80 M80 60 L60 80" stroke="white" strokeWidth="4" fill="none" />
        </svg>
      </div>
    </div>
  );
}