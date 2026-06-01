'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/health/types';
import { StatusBadgeSmall, getTypeColor } from './status-badge';
import { CalendarDays, Clock, User, FileText } from 'lucide-react';
import { format, parseISO, isToday, addDays, startOfWeek, isSameDay } from 'date-fns';

const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'];
const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getDateNumber(date: Date): number {
  return date.getDate();
}

interface AppointmentBlockProps {
  appointment: Appointment;
  onClick: () => void;
  compact?: boolean;
}

function AppointmentBlock({ appointment, onClick, compact }: AppointmentBlockProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-2 rounded-lg bg-white border-l-4 ${getTypeColor(appointment.type)} shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
    >
      <p className="text-xs font-semibold text-[#1A1A2E] truncate">{appointment.patient.name}</p>
      <p className="text-[10px] text-[#6B7280] truncate">{appointment.type}</p>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-[#6B7280]">{appointment.startTime}</span>
        <StatusBadgeSmall status={appointment.status} />
      </div>
    </button>
  );
}

interface CalendarGridProps {
  appointments: Appointment[];
  onSelectAppointment: (appointment: Appointment) => void;
  selectedAppointment?: Appointment | null;
}

export function CalendarGrid({ appointments, onSelectAppointment, selectedAppointment }: CalendarGridProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i));

  const prevWeek = () => setCurrentWeekStart(d => addDays(d, -7));
  const nextWeek = () => setCurrentWeekStart(d => addDays(d, 7));
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const getAppointmentsForSlot = (day: Date, time: string) => {
    return appointments.filter(apt => {
      const aptDate = parseISO(apt.date);
      return isSameDay(aptDate, day) && apt.startTime === time;
    });
  };

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const todayIndex = weekDays.findIndex(d => isSameDay(d, now));

  const rangeStart = format(weekDays[0], 'MMM d');
  const rangeEnd = format(weekDays[6], 'MMM d, yyyy');

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB] bg-[#F4F6F9]">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-semibold text-[#1A1A2E]">{rangeStart} — {rangeEnd}</h2>
          <div className="flex items-center gap-1">
            <button onClick={prevWeek} className="p-1.5 rounded-lg hover:bg-white transition-colors text-[#6B7280]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={goToToday} className="px-3 py-1 rounded-lg bg-[#1A73E8] text-white text-xs font-medium hover:bg-[#1557b0] transition-colors">
              Today
            </button>
            <button onClick={nextWeek} className="p-1.5 rounded-lg hover:bg-white transition-colors text-[#6B7280]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {weekDays.map((day, i) => (
            <div
              key={i}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-medium transition-colors
                ${isSameDay(day, now)
                  ? 'bg-[#1A73E8] text-white'
                  : i === 5
                    ? 'text-[#9CA3AF]'
                    : i === 6
                      ? 'text-[#EF4444]'
                      : 'text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
            >
              {getDateNumber(day)}
            </div>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E5E7EB]">
            <div className="p-2" />
            {weekDays.map((day, i) => (
              <div
                key={i}
                className={`p-2 text-center text-xs font-medium border-l border-[#E5E7EB] ${i === 5 ? 'text-[#9CA3AF]' : i === 6 ? 'text-[#EF4444]' : 'text-[#6B7280]'}`}
              >
                {days[i]}
              </div>
            ))}
          </div>

          <div className="relative">
            {timeSlots.map((time) => {
              const hour = parseInt(time.split(':')[0]);
              return (
                <div key={time} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-[#E5E7EB]/50 min-h-[60px]">
                  <div className="p-2 text-[10px] text-[#9CA3AF] text-right pr-3">{time}</div>
                  {weekDays.map((day, dayIdx) => {
                    const slotAppointments = getAppointmentsForSlot(day, time);
                    return (
                      <div
                        key={dayIdx}
                        className={`border-l border-[#E5E7EB]/50 p-1 relative ${
                          dayIdx === 5 ? 'bg-gray-50/30' : dayIdx === 6 ? 'bg-red-50/20' : ''
                        }`}
                      >
                        {slotAppointments.map(apt => (
                          <AppointmentBlock
                            key={apt.id}
                            appointment={apt}
                            onClick={() => onSelectAppointment(apt)}
                            compact
                          />
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {todayIndex >= 0 && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-[#1A73E8] z-10"
                style={{
                  top: `calc(45px + ${(currentHour - 8) * 60 + currentMinute}px)`,
                  left: `calc(60px + ${todayIndex * (100 / 7)}% + ${todayIndex * 1}px)`,
                }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-[#1A73E8] -mt-1.25 -ml-1.25 absolute" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}