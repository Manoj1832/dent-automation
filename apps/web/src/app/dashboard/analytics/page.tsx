'use client';

import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, Stethoscope, IndianRupee, Activity, CalendarDays } from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

const MOCK_GROWTH = [
  { date: 'May 1', patients: 3 }, { date: 'May 3', patients: 5 },
  { date: 'May 5', patients: 4 }, { date: 'May 7', patients: 7 },
  { date: 'May 9', patients: 6 }, { date: 'May 11', patients: 8 },
  { date: 'May 13', patients: 9 }, { date: 'May 15', patients: 11 },
  { date: 'May 17', patients: 10 }, { date: 'May 19', patients: 13 },
  { date: 'May 21', patients: 12 }, { date: 'May 23', patients: 15 },
  { date: 'May 25', patients: 14 }, { date: 'May 27', patients: 16 },
  { date: 'May 29', patients: 18 },
];

export default function AnalyticsPage() {
  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['analytics-dashboard'],
    queryFn: () => analyticsApi.getDashboard(),
    select: (res) => res.data.data,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 rounded-2xl bg-slate-200 shimmer" />)}
          </div>
          <div className="h-64 rounded-2xl bg-slate-200 shimmer" />
        </div>
      </div>
    );
  }

  const stats = dashboard?.patients || {};
  const apptStats = dashboard?.appointments || {};
  const treatStats = dashboard?.treatments || {};
  const revStats = dashboard?.revenue || {};

  const pieData = [
    { name: 'Scheduled', value: apptStats.scheduled || 0 },
    { name: 'Completed', value: apptStats.completed || 0 },
    { name: 'Cancelled', value: apptStats.cancelled || 0 },
    { name: 'Missed', value: apptStats.missed || 0 },
  ].filter(d => d.value > 0);

  return (
<div className="min-h-screen bg-[#F8F9FA] text-[#0D0D0D] font-sans">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
          <div>
            <h1 className="font-display text-[24px] font-bold text-[#0D0D0D] flex items-center gap-3">
              <div className="w-10 h-10 rounded-[14px] bg-[#DBEAFE] border border-[rgba(0,0,0,0.08)] flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-[#3B82F6]" />
              </div>
              Analytics
            </h1>
            <p className="text-[#6B7280] text-sm mt-1">Clinic performance insights and metrics</p>
          </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Patients', value: stats.total || 0, sub: `${stats.growthRate?.toFixed(1) || 0}% growth`, icon: Users, bg: 'bg-[#E1F5EE]', text: 'text-[#1D9E75]' },
            { label: 'Appointments', value: apptStats.total || 0, sub: `${apptStats.completionRate?.toFixed(0) || 0}% done`, icon: CalendarDays, bg: 'bg-[#E6F1FB]', text: 'text-[#185FA5]' },
            { label: 'Treatments', value: treatStats.total || 0, sub: `Avg ₹${treatStats.avgCost?.toFixed(0) || 0}`, icon: Stethoscope, bg: 'bg-[#EEEDFE]', text: 'text-[#534AB7]' },
            { label: 'Revenue', value: `₹${(treatStats.totalRevenue || 0).toLocaleString()}`, sub: `Pending ₹${(revStats.pendingPayments || 0).toLocaleString()}`, icon: IndianRupee, bg: 'bg-[#FAEEDA]', text: 'text-[#BA7517]' },
          ].map((s, i) => (
            <div key={i} className="relative rounded-[14px] bg-white border border-[rgba(0,0,0,0.08)] p-5 overflow-hidden card-hover">
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">{s.label}</p>
                  <p className="font-display text-[28px] font-bold text-[#0D0D0D] mt-1">{s.value}</p>
                  <p className="text-[12px] text-[#9CA3AF] mt-1">{s.sub}</p>
                </div>
                <div className={`w-11 h-11 rounded-[10px] ${s.bg} flex items-center justify-center`}>
                  <s.icon className={`h-5 w-5 ${s.text}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#1D9E75]" />
                Patient Growth (30 Days)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ minHeight: '220px' }}>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={MOCK_GROWTH}>
                    <defs>
                      <linearGradient id="gTeal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1D9E75" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#1D9E75" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="patients" stroke="#1D9E75" strokeWidth={2} fill="url(#gTeal)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-[15px] font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#1D9E75]" />
                Appointment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4" style={{ minHeight: '200px' }}>
                <div style={{ width: '50%', minWidth: 0 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                        {pieData.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex-1 space-y-2">
                  {pieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                        <span className="text-slate-600">{item.name}</span>
                      </div>
                      <span className="font-medium text-slate-700">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Top Procedures</CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ minHeight: '220px' }}>
                {treatStats.topProcedures?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={treatStats.topProcedures} layout="vertical">
                      <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="procedure" type="category" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={100} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Bar dataKey="count" fill="#0EA5E9" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-52 flex items-center justify-center text-sm text-slate-400">No treatment data yet</div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Users className="h-4 w-4 text-[#0EA5E9]" />
                Patient Statistics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Active', value: stats.active || 0, color: '#0EA5E9' },
                  { label: 'New This Week', value: stats.newThisWeek || 0, color: '#10B981' },
                  { label: 'New This Month', value: stats.newThisMonth || 0, color: '#8B5CF6' },
                  { label: 'Archived', value: stats.archived || 0, color: '#94A3B8' },
                ].map((s, i) => (
                  <div key={i} className="text-center p-4 rounded-xl border border-slate-200">
                    <p className="text-2xl font-display font-bold" style={{ color: s.color }}>{s.value}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}