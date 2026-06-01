'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MessageSquare,
  CreditCard,
  Settings,
  HelpCircle,
  ChevronRight,
  Activity,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
  { href: '/calendar', label: 'Calendar', icon: Calendar },
  { href: '/patients', label: 'Patient List', icon: Users },
  { href: '/messages', label: 'Messages', icon: MessageSquare },
  { href: '/payments', label: 'Payment Information', icon: CreditCard },
  { href: '/settings', label: 'Settings', icon: Settings },
];

const doctor = {
  name: 'Dr. Sarah Mitchell',
  role: 'Dental Specialist',
  avatar: 'https://i.pravatar.cc/150?img=47',
};

export default function HealthSidebar() {
  const pathname = usePathname();
  const [collapsed] = useState(false);

  return (
    <aside className="w-[220px] min-h-screen bg-[#1B2B5E] flex flex-col flex-shrink-0">
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Zendenta</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                ${isActive
                  ? 'bg-[#1A73E8] text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
            >
              <item.icon className="w-4.5 h-4.5 flex-shrink-0" />
              <span className={collapsed ? 'hidden' : ''}>{item.label}</span>
              {collapsed && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 space-y-1 border-t border-white/10">
        <Link
          href="/help"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/50 hover:text-white hover:bg-white/10 transition-all"
        >
          <HelpCircle className="w-4.5 h-4.5" />
          <span>Help?</span>
        </Link>
      </div>

      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <Avatar className="w-9 h-9 border-2 border-[#1A73E8]">
            <AvatarImage src={doctor.avatar} />
            <AvatarFallback className="bg-[#1A73E8] text-white text-xs">
              {doctor.name.split(' ').map(n => n[0]).join('')}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{doctor.name}</p>
            <p className="text-white/50 text-[10px] truncate">{doctor.role}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}