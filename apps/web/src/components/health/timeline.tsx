'use client';

import type { TimelineEntry } from '@/lib/health/types';
import { format, parseISO } from 'date-fns';

export function TimelineItem({ entry }: { entry: TimelineEntry }) {
  return (
    <div className="flex gap-4 relative">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full border-2 ${entry.isLatest ? 'bg-[#1A73E8] border-[#1A73E8]' : 'border-[#E5E7EB] bg-white'}`} />
        {!entry.isLatest && <div className="w-px flex-1 bg-[#E5E7EB] mt-2" />}
      </div>
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-2 text-xs text-[#6B7280] mb-1">
          <span>{format(parseISO(entry.date), 'MMM d, yyyy')}</span>
          <span>•</span>
          <span>{entry.time}</span>
        </div>
        <div className="bg-[#F4F6F9] rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#1A1A2E]">{entry.type}</span>
            <button className="text-xs text-[#1A73E8] hover:underline">Note</button>
          </div>
          <div className="mt-1 space-y-0.5">
            <p className="text-xs text-[#6B7280]">Doctor: <span className="text-[#1A1A2E]">{entry.doctorName}</span></p>
            <p className="text-xs text-[#6B7280]">Nurse: <span className="text-[#1A1A2E]">{entry.nurseName}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TimelineList({ entries }: { entries: TimelineEntry[] }) {
  return (
    <div className="space-y-0">
      {entries.map((entry) => (
        <TimelineItem key={entry.id} entry={entry} />
      ))}
    </div>
  );
}