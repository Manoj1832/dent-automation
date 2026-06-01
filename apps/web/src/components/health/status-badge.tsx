'use client';

import { Badge } from '@/components/ui/badge';
import type { AppointmentStatus } from '@/lib/health/types';

const statusConfig: Record<AppointmentStatus, { label: string; bg: string; text: string; dot: string }> = {
  arrived: { label: 'Arrived', bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  pending: { label: 'Pending', bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-500' },
  review: { label: 'Review', bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-500' },
  member: { label: 'Member', bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  completed: { label: 'Completed', bg: 'bg-gray-100', text: 'text-gray-600', dot: 'bg-gray-400' },
  rescheduled: { label: 'Rescheduled', bg: 'bg-orange-100', text: 'text-orange-700', dot: 'bg-orange-500' },
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

const typeColors: Record<string, string> = {
  'Root Canal': 'border-l-blue-500',
  'Consultation': 'border-l-green-500',
  'Open Access': 'border-l-purple-500',
  'Wisdom Teeth': 'border-l-red-500',
  'Bleaching': 'border-l-yellow-500',
  'Scaling': 'border-l-teal-500',
};

export function getTypeColor(type: string): string {
  return typeColors[type] || 'border-l-gray-400';
}

export function StatusBadgeSmall({ status }: { status: AppointmentStatus }) {
  const config = statusConfig[status] || statusConfig.pending;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium ${config.bg} ${config.text}`}>
      {config.label}
    </span>
  );
}