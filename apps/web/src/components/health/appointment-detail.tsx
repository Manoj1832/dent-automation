'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/health/types';
import { StatusBadge } from './status-badge';
import { TimelineList } from './timeline';
import { dummyTimeline } from '@/lib/health/data';
import { Mail, Phone, MapPin, Calendar, Clock, User, FileText, Star } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

const tabs = ['Basic Info', 'Treatment Timeline', 'Note', 'Medical Record', 'Document'] as const;

export function AppointmentDetail({ appointment, onClose }: { appointment: Appointment; onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Basic Info');
  const [showAllTimeline, setShowAllTimeline] = useState(false);

  return (
    <div className="h-full flex flex-col">
      <div className="p-5 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-4">
          <Avatar className="w-12 h-12 border-2 border-[#1A73E8]">
            <AvatarImage src={appointment.patient.avatar} />
            <AvatarFallback className="bg-[#1A73E8] text-white">
              {appointment.patient.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-[#1A1A2E]">{appointment.patient.name}</h3>
              <StatusBadge status={appointment.status} />
            </div>
            <p className="text-xs text-[#6B7280]">{appointment.patient.email}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button size="sm" className="bg-[#22C55E] hover:bg-[#16a34a] text-white">Arrived</Button>
          <Button size="sm" variant="outline" className="text-[#F59E0B] border-[#F59E0B] hover:bg-[#F59E0B]/10">Reschedule</Button>
        </div>
      </div>

      <div className="border-b border-[#E5E7EB] px-5">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-[#1A73E8] text-[#1A73E8]'
                  : 'border-transparent text-[#6B7280] hover:text-[#1A1A2E]'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {activeTab === 'Basic Info' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280]">Email:</span>
                <span className="text-[#1A1A2E]">{appointment.patient.email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280]">Phone:</span>
                <span className="text-[#1A1A2E]">{appointment.patient.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280]">Age:</span>
                <span className="text-[#1A1A2E]">{appointment.patient.age} years</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280]">Date:</span>
                <span className="text-[#1A1A2E]">{format(parseISO(appointment.date), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm col-span-2">
                <Clock className="w-4 h-4 text-[#6B7280]" />
                <span className="text-[#6B7280]">Time:</span>
                <span className="text-[#1A1A2E]">{appointment.startTime} — {appointment.endTime}</span>
              </div>
            </div>

            <div className="bg-[#F4F6F9] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[#6B7280] uppercase mb-3">Treatment Info</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1A73E8]">{appointment.sessionsCount || 0}</p>
                  <p className="text-xs text-[#6B7280]">Sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1A1A2E]">{appointment.totalVisits || 0}</p>
                  <p className="text-xs text-[#6B7280]">Total Visits</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <p className="text-2xl font-bold text-[#1A73E8]">{appointment.rating || 0}</p>
                    <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                  </div>
                  <p className="text-xs text-[#6B7280]">Rating</p>
                </div>
              </div>
            </div>

            <div className="bg-[#F4F6F9] rounded-lg p-4">
              <h4 className="text-xs font-semibold text-[#6B7280] uppercase mb-2">Treatment Type</h4>
              <p className="text-sm font-medium text-[#1A1A2E]">{appointment.treatment}</p>
              <p className="text-xs text-[#6B7280] mt-1">by {appointment.doctor.name}</p>
            </div>
          </div>
        )}

        {activeTab === 'Treatment Timeline' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-[#F4F6F9] rounded-lg">
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1A73E8]">{appointment.sessionsCount || 0}</p>
                <p className="text-xs text-[#6B7280]">Sessions</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-[#1A1A2E]">{appointment.totalVisits || 0}</p>
                <p className="text-xs text-[#6B7280]">Total Visits</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <p className="text-2xl font-bold text-[#1A73E8]">{appointment.rating || 0}</p>
                  <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
                </div>
                <p className="text-xs text-[#6B7280]">Rating</p>
              </div>
            </div>
            <TimelineList entries={dummyTimeline} />
          </div>
        )}

        {activeTab === 'Note' && (
          <div className="text-center py-12 text-[#6B7280]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No notes yet</p>
            <button className="mt-2 text-xs text-[#1A73E8] hover:underline">Add a note</button>
          </div>
        )}

        {activeTab === 'Medical Record' && (
          <div className="text-center py-12 text-[#6B7280]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No medical records</p>
          </div>
        )}

        {activeTab === 'Document' && (
          <div className="text-center py-12 text-[#6B7280]">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No documents uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}