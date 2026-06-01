'use client';

import { Bell, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';

const doctor = {
  name: 'Dr. Sarah Mitchell',
  avatar: 'https://i.pravatar.cc/150?img=47',
};

export default function HealthTopbar({
  title,
  icon: Icon,
  badgeCount = 3,
}: {
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  badgeCount?: number;
}) {
  return (
    <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center justify-between px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        {Icon && <Icon className="w-5 h-5 text-[#1A73E8]" />}
        <h1 className="text-lg font-semibold text-[#1A1A2E]">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
          <Input
            placeholder="Search patient..."
            className="w-64 pl-10 h-9 bg-[#F4F6F9] border-0 text-sm"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-[#F4F6F9] transition-colors">
          <Bell className="w-5 h-5 text-[#6B7280]" />
          {badgeCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-bold flex items-center justify-center">
              {badgeCount}
            </span>
          )}
        </button>

        <Avatar className="w-8 h-8">
          <AvatarImage src={doctor.avatar} />
          <AvatarFallback className="bg-[#1A73E8] text-white text-xs">
            {doctor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}