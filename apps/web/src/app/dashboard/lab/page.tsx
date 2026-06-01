'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { labApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { FlaskConical, Plus, Search, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { AddLabCaseModal } from './AddLabCaseModal';

const statusColors: Record<string, { dot: string; label: string; bg: string; text: string; border: string }> = {
  SENT: { dot: 'bg-amber-400', label: 'Sent', bg: 'bg-amber-400/10', text: 'text-amber-400', border: 'border-amber-400/30' },
  IN_PROGRESS: { dot: 'bg-cyan-400', label: 'In Progress', bg: 'bg-cyan-400/10', text: 'text-cyan-400', border: 'border-cyan-400/30' },
  READY: { dot: 'bg-emerald-400', label: 'Ready', bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30' },
  DELIVERED: { dot: 'bg-violet-400', label: 'Delivered', bg: 'bg-violet-400/10', text: 'text-violet-400', border: 'border-violet-400/30' },
};

interface LabCase {
  id: string;
  labName: string;
  caseType: string;
  toothNumbers: number[];
  status: string;
  sentDate: string;
  expectedDate: string | null;
  cost: number | null;
  patient: { id: string; patientId: string; name: string };
  doctor: { id: string; name: string };
}

export default function LabPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['lab-cases', search, statusFilter, page],
    queryFn: () => labApi.getAll({ status: statusFilter || undefined, page, limit: 20 }),
    select: (res) => res.data.data,
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
                <FlaskConical className="h-5 w-5 text-[#0EA5E9]" />
              </div>
              Lab Cases
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Manage dental lab work orders
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
            <Plus className="h-4 w-4 mr-2" />
            New Lab Case
          </Button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search lab name or case type..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <Select value={statusFilter} onValueChange={(v: string | null) => { setStatusFilter(v || ''); setPage(1); }}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 border-slate-200 text-slate-700 h-11">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="SENT">Sent</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="READY">Ready</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200">
            <h2 className="text-base font-display font-bold text-slate-700">
              Lab Work Orders
              {data?.pagination && (
                <span className="text-slate-500 font-normal ml-2 text-sm">
                  ({data.pagination.total} total)
                </span>
              )}
            </h2>
          </div>
          <div className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-20 rounded-2xl bg-slate-200 shimmer" />
                ))}
              </div>
            ) : data?.labCases && data.labCases.length > 0 ? (
              <>
                <div className="space-y-3 p-4">
                  {data.labCases.map((lc: LabCase) => {
                    const colorKey = Object.keys(statusColors).includes(lc.status) ? lc.status : 'SENT';
                    const colors = statusColors[colorKey];
                    return (
                      <div key={lc.id} className="rounded-2xl bg-slate-50 border border-slate-200 p-4 group">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
                              <FlaskConical className="h-5 w-5 text-[#0EA5E9]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold text-slate-700">{lc.caseType}</p>
                                <Badge variant="secondary" className="text-xs bg-slate-100 border-slate-200 text-slate-500">{lc.labName}</Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                                <span>{lc.patient.name} <span className="text-slate-400">({lc.patient.patientId})</span></span>
                                <span>Dr. {lc.doctor.name}</span>
                                {lc.toothNumbers.length > 0 && (
                                  <span>Teeth: {lc.toothNumbers.join(', ')}</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              {lc.expectedDate && (
                                <p className="text-xs text-slate-400">
                                  Expected: {new Date(lc.expectedDate).toLocaleDateString()}
                                </p>
                              )}
                              {lc.cost && <p className="text-sm font-medium text-[#0EA5E9]">₹{lc.cost.toLocaleString()}</p>}
                            </div>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${colors.bg} ${colors.text} border ${colors.border}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                              {colors.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                  <FlaskConical className="h-8 w-8 text-[#0EA5E9]" />
                </div>
                <p className="text-base font-semibold text-slate-700">No lab cases found</p>
                <p className="text-sm text-slate-500 mt-1">Lab work orders will appear here</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <AddLabCaseModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}