'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import type { NotificationItem } from '@/lib/health/types';

export function AppointmentNotification({ item, onAddNote }: { item: NotificationItem; onAddNote?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-[#F4F6F9] hover:bg-[#EEF2FF] cursor-pointer transition-colors">
      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
        <img src={item.patient.avatar} alt={item.patient.name} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A2E]">{item.patient.name}</p>
        <p className="text-xs text-[#6B7280]">{item.time}</p>
      </div>
      {onAddNote && (
        <button
          onClick={(e) => { e.stopPropagation(); onAddNote(); }}
          className="text-xs text-[#1A73E8] hover:underline whitespace-nowrap"
        >
          Add Note
        </button>
      )}
    </div>
  );
}