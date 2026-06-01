'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import type { Doctor } from '@/lib/health/types';

export function DoctorProfileCard({ doctor, compact = false }: { doctor: Doctor; compact?: boolean }) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F4F6F9]">
        <Avatar className="w-10 h-10">
          <AvatarImage src={doctor.avatar} />
          <AvatarFallback className="bg-[#1A73E8] text-white text-xs">
            {doctor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-semibold text-[#1A1A2E]">{doctor.name}</p>
          <p className="text-xs text-[#6B7280]">{doctor.specialty}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
      <div className="flex items-center gap-4">
        <Avatar className="w-16 h-16 border-2 border-[#1A73E8]">
          <AvatarImage src={doctor.avatar} />
          <AvatarFallback className="bg-[#1A73E8] text-white text-lg">
            {doctor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-semibold text-[#1A1A2E] text-lg">{doctor.name}</h3>
          <p className="text-sm text-[#6B7280]">{doctor.specialty}</p>
          <div className="flex items-center gap-1 mt-1">
            <Star className="w-4 h-4 text-[#F59E0B] fill-[#F59E0B]" />
            <span className="text-sm font-medium text-[#1A1A2E]">{doctor.rating}</span>
            <span className="text-xs text-[#6B7280]">({doctor.totalPatients} patients)</span>
          </div>
        </div>
      </div>
      <div className="mt-4 pt-4 border-t border-[#E5E7EB] space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Clinic</span>
          <span className="font-medium text-[#1A1A2E]">{doctor.clinic}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-[#6B7280]">Location</span>
          <span className="font-medium text-[#1A1A2E]">{doctor.location}</span>
        </div>
      </div>
    </div>
  );
}