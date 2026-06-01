'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth-store';
import { patientApi, appointmentApi } from '@/lib/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import AiChatBot from '@/components/AiChatBot';
import {
  LayoutDashboard,
  Calendar,
  Users,
  FlaskConical,
  FolderOpen,
  BarChart3,
  ScanLine,
  Settings,
  LogOut,
  Menu,
  X,
  Search,
  Bell,
  ChevronDown,
  Activity,
  Loader2,
  MessageSquare,
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTIONIST';
}

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
  { href: '/dashboard/patients', label: 'Patients', icon: Users },
  { href: '/dashboard/doctors', label: 'Doctors', icon: Activity },
  { href: '/dashboard/treatments', label: 'Treatments', icon: Activity },
  { href: '/dashboard/lab', label: 'Lab Cases', icon: FlaskConical },
  { href: '/dashboard/bulk-messaging', label: 'Bulk Messages', icon: MessageSquare },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, hydrate, logout } = useAuthStore();
  const [hydrated, setHydrated] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [patients, setPatients] = useState<Array<{ id: string; name: string; patientId: string; phone: string | null }>>([]);
  const [appointments, setAppointments] = useState<Array<{ id: string; patientName: string; doctorName: string; date: string }>>([]);
  const [searchResults, setSearchResults] = useState<{ patients: typeof patients; appointments: typeof appointments }>({ patients: [], appointments: [] });
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    hydrate();
    setHydrated(true)
  }, [hydrate])

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setSearchResults({ patients: [], appointments: [] });
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const [patientsRes, appointmentsRes] = await Promise.all([
          patientApi.getAll({ query, limit: 5 }),
          appointmentApi.getAll({ limit: 5 }),
        ]);

        const patientsList = patientsRes.data?.data?.patients || [];
        const appointmentsList = appointmentsRes.data?.data?.appointments || [];

        setSearchResults({
          patients: patientsList,
          appointments: appointmentsList.map((apt: any) => ({
            id: apt.id,
            patientName: apt.patient?.name || 'Unknown',
            doctorName: apt.doctor?.name || 'Unknown',
            date: new Date(apt.date).toLocaleDateString(),
          })),
        });
      } catch (error) {
        console.error('Failed to search data:', error);
      } finally {
        setLoading(false);
      }
    }, 400);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const navigateToPatient = (id: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/dashboard/patients/${id}`);
  };

  const navigateToAppointment = (id: string) => {
    setShowDropdown(false);
    setSearchQuery('');
    router.push(`/dashboard/appointments/${id}`);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#1D9E75] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const firstName = user?.name?.split(' ')[0] || 'Admin';

  return (
    <div className="flex h-screen overflow-hidden bg-[#F8F9FA] font-sans text-[#0D0D0D]">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar - Blue */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-60 flex flex-col transition-transform duration-300 ease-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ backgroundColor: '#1E40AF' }}
      >
        <div className="h-14 px-5 flex items-center gap-2.5 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-[#2563EB] font-bold text-xs font-display">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[13px] font-bold text-white tracking-tight font-display leading-tight">SREE</span>
              <span className="text-[10px] text-white/60 font-display leading-tight">ARUMUGAVADIVU</span>
            </div>
          </Link>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 ml-auto text-white/50">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-[13px] transition-all duration-150 nav-item-hover ${
                  isActive
                    ? 'bg-white/15 text-white border-l-2 border-white'
                    : 'text-white/70 hover:text-white hover:bg-white/05'
                }`}
              >
                <item.icon className="h-4 w-4" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 px-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-[13px] font-medium text-white/50 hover:text-white transition-colors w-full py-2"
          >
            <LogOut className="w-4 h-4" strokeWidth={2} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Navbar - White with border */}
        <header className="h-14 flex items-center px-6 bg-white border-b border-[rgba(0,0,0,0.08)] flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden mr-3 p-2 rounded-lg hover:bg-[#F1F0EA] text-[#6B7280]"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 max-w-md">
            <div className="relative flex items-center w-full" ref={searchRef}>
              <Search className="absolute left-3.5 h-4 w-4 text-[#9CA3AF]" />
              <input
                type="text"
                placeholder="Search patients, appointments..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full h-9 pl-10 pr-4 rounded-full bg-[#F8F9FA] border border-[rgba(0,0,0,0.08)] text-[13px] font-normal text-[#0D0D0D] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#1D9E75] focus:ring-0 transition-all"
              />
              {loading && (
                <Loader2 className="absolute right-3.5 h-4 w-4 text-[#9CA3AF] animate-spin" />
              )}
              {showDropdown && (
                <div className="absolute top-full mt-2 w-full bg-white rounded-[14px] shadow-lg border border-[rgba(0,0,0,0.08)] overflow-hidden z-50">
                  {searchResults.patients.length === 0 && searchResults.appointments.length === 0 ? (
                    <div className="p-4 text-center text-[#6B7280] text-sm">No results found</div>
                  ) : (
                    <>
                      {searchResults.patients.length > 0 && (
                        <div className="p-2">
                          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Patients</div>
                          {searchResults.patients.map((patient) => (
                            <button
                              key={patient.id}
                              onClick={() => navigateToPatient(patient.id)}
                              className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-[#F1F0EA] transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="text-sm font-medium text-[#0D0D0D]">{patient.name}</div>
                                <div className="text-xs text-[#9CA3AF]">{patient.patientId} • {patient.phone || 'No phone'}</div>
                              </div>
                              <Users className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#1D9E75]" />
                            </button>
                          ))}
                        </div>
                      )}
                      {searchResults.appointments.length > 0 && (
                        <div className="p-2 border-t border-[rgba(0,0,0,0.08)]">
                          <div className="px-3 py-1.5 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Appointments</div>
                          {searchResults.appointments.map((apt) => (
                            <button
                              key={apt.id}
                              onClick={() => navigateToAppointment(apt.id)}
                              className="w-full text-left px-3 py-2 rounded-[10px] hover:bg-[#F1F0EA] transition-colors flex items-center justify-between group"
                            >
                              <div>
                                <div className="text-sm font-medium text-[#0D0D0D]">{apt.patientName}</div>
                                <div className="text-xs text-[#9CA3AF]">Dr. {apt.doctorName} • {apt.date}</div>
                              </div>
                              <Calendar className="w-4 h-4 text-[#9CA3AF] group-hover:text-[#1D9E75]" />
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            <button className="relative w-9 h-9 rounded-full hover:bg-[#F1F0EA] flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-[#6B7280]" />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#BA7517]" />
            </button>
            <div className="flex items-center gap-2 pl-2 cursor-pointer group">
              <Avatar className="w-8 h-8">
                <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" />
                <AvatarFallback className="bg-[#E1F5EE] text-[#0F6E56] text-xs font-bold">
                  {firstName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center gap-1">
                <span className="text-[14px] font-medium text-[#0D0D0D]">Dr. {firstName}</span>
                <ChevronDown className="w-3.5 h-3.5 text-[#9CA3AF]" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </main>
      <AiChatBot />
    </div>
  );
}