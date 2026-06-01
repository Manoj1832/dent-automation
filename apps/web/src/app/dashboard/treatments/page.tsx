'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { treatmentApi, patientApi, doctorApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Stethoscope,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Loader2,
  Mic,
  MicOff,
} from 'lucide-react';
import { Odontogram } from '@/components/odontogram/Odontogram';

interface Treatment {
  id: string;
  procedure: string;
  toothNumbers: number[];
  notes: string | null;
  prescription: string | null;
  cost: number | null;
  createdAt: string;
  patient: { id: string; patientId: string; name: string };
  doctor: { id: string; name: string };
  _count: { files: number };
}

interface Patient {
  id: string;
  name: string;
  patientId: string;
}

interface Doctor {
  id: string;
  name: string;
}

export default function TreatmentsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [recordingField, setRecordingField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    patientId: '',
    doctorId: '',
    procedure: '',
    toothNumbers: [] as number[],
    procedureNotes: '',
    prescription: '',
    cost: '',
    visitDate: new Date().toISOString().split('T')[0],
  });

  const processDentalText = (text: string): string => {
    let processed = text;

    const dentalTerms: Record<string, string> = {
      'tooth': 'Tooth',
      'teeth': 'Teeth',
      'teeths': 'Teeth',
      'rct': 'Root Canal Treatment (RCT)',
      'root canal': 'Root Canal Treatment',
      'filling': 'Dental Filling',
      'extraction': 'Tooth Extraction',
      'scaling': 'Scaling & Polishing',
      'cleaning': 'Teeth Cleaning',
      'crown': 'Dental Crown',
      'cap': 'Dental Crown/Cap',
      'bridge': 'Dental Bridge',
      'implant': 'Dental Implant',
      'bleaching': 'Teeth Whitening',
      'whitening': 'Teeth Whitening',
      'veneer': 'Dental Veneer',
      'amalgam': 'Amalgam Filling',
      'gum': 'Gum',
      'gums': 'Gums',
      'periodontal': 'Periodontal',
      'wisdom': 'Wisdom Tooth',
      'molar': 'Molar',
      'premolar': 'Premolar',
      'incisor': 'Incisor',
      'canine': 'Canine',
      'anterior': 'Anterior Teeth',
      'posterior': 'Posterior Teeth',
      'upper': 'Upper',
      'lower': 'Lower',
      'right': 'Right',
      'left': 'Left',
    };

    Object.entries(dentalTerms).forEach(([key, value]) => {
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      processed = processed.replace(regex, value);
    });

    processed = processed.replace(/\s+/g, ' ').trim();
    processed = processed.charAt(0).toUpperCase() + processed.slice(1);

    return processed;
  };

  const startVoiceInput = (field: string) => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast.error('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN';

    setRecordingField(field);

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      
      const processed = processDentalText(transcript);
      
      setFormData((prev: any) => ({
        ...prev,
        [field]: prev[field] ? prev[field] + ' ' + processed : processed,
      }));
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setRecordingField(null);
      toast.error('Voice input error. Please try again.');
    };

    recognition.onend = () => {
      setRecordingField(null);
    };

    (recognition as any).start();

    setTimeout(() => {
      (recognition as any).stop();
      setRecordingField(null);
    }, 10000);

    toast.info('Listening... Speak your treatment notes');
  };

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['treatments', search, page],
    queryFn: () => treatmentApi.getAll({ search: search || undefined, page, limit: 20 }),
    select: (res) => res.data.data,
  });

  const { data: patientsData } = useQuery({
    queryKey: ['patients-list'],
    queryFn: () => patientApi.getAll({ limit: 100 }),
    select: (res) => res.data.data.patients,
  });

  const { data: doctorsData } = useQuery({
    queryKey: ['doctors'],
    queryFn: () => doctorApi.getAll(),
    select: (res) => res.data.data?.doctors || [],
  });

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => treatmentApi.create(data),
    onSuccess: () => {
      toast.success('Treatment added successfully');
      setDialogOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['treatments'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add treatment');
    },
  });

  const resetForm = () => {
    setFormData({
      patientId: '',
      doctorId: '',
      procedure: '',
      toothNumbers: [],
      procedureNotes: '',
      prescription: '',
      cost: '',
      visitDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      patientId: formData.patientId,
      doctorId: formData.doctorId,
      procedure: formData.procedure,
      toothNumbers: formData.toothNumbers,
      procedureNotes: formData.procedureNotes || null,
      prescription: formData.prescription || null,
      cost: formData.cost ? parseFloat(formData.cost) : null,
      visitDate: formData.visitDate,
    });
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-[#0EA5E9]" />
              </div>
              Treatments
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Track and manage dental treatments
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
            <Plus className="h-4 w-4 mr-2" />
            Add Treatment
          </Button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Search treatments..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10 bg-slate-50 border-slate-200 text-slate-700 h-11"
            />
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200">
            <h2 className="text-base font-display font-bold text-slate-700">
              Treatment Records
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
                  <div key={i} className="h-16 rounded-xl bg-slate-200 shimmer" />
                ))}
              </div>
            ) : data?.treatments && data.treatments.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200 hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Procedure</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Patient</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Doctor</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Teeth</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Cost</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.treatments.map((t: Treatment) => (
                        <TableRow key={t.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-700">{t.procedure}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-600">{t.patient.name}</span>
                              <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 border-slate-200 text-slate-500">
                                {t.patient.patientId}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-500">Dr. {t.doctor.name}</TableCell>
                          <TableCell>
                            {t.toothNumbers.length > 0 ? (
                              <div className="flex gap-1 flex-wrap">
                                {t.toothNumbers.map((n) => (
                                  <Badge key={n} variant="outline" className="text-xs bg-slate-100 border-slate-200 text-slate-600">{n}</Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {t.cost ? (
                              <span className="text-[#0EA5E9] font-medium">₹{t.cost.toLocaleString()}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(t.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {data.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500">
                      Page {data.pagination.page} of {data.pagination.totalPages}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= data.pagination.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-[#0EA5E9]" />
                </div>
                <p className="text-base font-semibold text-slate-700">No treatments found</p>
                <p className="text-sm text-slate-500 mt-1">Treatments will appear here once recorded</p>
                <Button onClick={() => setDialogOpen(true)} variant="outline" className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Treatment
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Treatment</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="patient">Patient</Label>
                <Select value={formData.patientId} onValueChange={(v) => setFormData({ ...formData, patientId: v ?? '' })}>
                  <SelectTrigger className="h-10 rounded-md border-slate-200">
                    <SelectValue placeholder="Select patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patientsData?.map((p: Patient) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} ({p.patientId || 'N/A'})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doctor">Doctor</Label>
                <Select value={formData.doctorId} onValueChange={(v) => setFormData({ ...formData, doctorId: v ?? '' })}>
                  <SelectTrigger className="h-10 rounded-md border-slate-200">
                    <SelectValue placeholder="Select doctor" />
                  </SelectTrigger>
                  <SelectContent>
                    {doctorsData?.map((d: Doctor) => (
                      <SelectItem key={d.id} value={d.id}>
                        Dr. {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="procedure">Procedure</Label>
                <div className="flex flex-wrap gap-1 mb-2">
                  {['Root Canal', 'Extraction', 'Filling', 'Scaling', 'Crown', 'Implant'].map((proc) => (
                    <Button
                      key={proc}
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-xs h-6 px-2"
                      onClick={() => setFormData({ ...formData, procedure: proc })}
                    >
                      {proc}
                    </Button>
                  ))}
                </div>
                <Input
                  id="procedure"
                  placeholder="e.g., Root Canal, Extraction, Filling"
                  value={formData.procedure}
                  onChange={(e) => setFormData({ ...formData, procedure: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Teeth Selection</Label>
                  <div className="border border-slate-200 rounded-xl p-2 bg-slate-50 flex justify-center">
                    <Odontogram
                      theme="light"
                      layout="circle"
                      showTooltip={true}
                      onChange={(selected) => {
                        const teeth = selected.map(t => parseInt(t.notations.fdi)).filter(n => !isNaN(n));
                        setFormData({ ...formData, toothNumbers: teeth });
                      }}
                      styles={{ maxWidth: '180px', maxHeight: '300px' }}
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="cost">Cost (₹)</Label>
                  <Input
                    id="cost"
                    type="number"
                    placeholder="0.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="visitDate">Visit Date</Label>
                <Input
                  id="visitDate"
                  type="date"
                  value={formData.visitDate}
                  onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="notes">Notes</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => startVoiceInput('procedureNotes')}
                  >
                    {recordingField === 'procedureNotes' ? (
                      <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    <span className="ml-1">{recordingField === 'procedureNotes' ? 'Recording...' : 'Voice'}</span>
                  </Button>
                </div>
                <Textarea
                  id="notes"
                  placeholder="Treatment notes... (or use voice input)"
                  value={formData.procedureNotes}
                  onChange={(e) => setFormData({ ...formData, procedureNotes: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="prescription">Prescription</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => startVoiceInput('prescription')}
                  >
                    {recordingField === 'prescription' ? (
                      <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                    ) : (
                      <Mic className="h-4 w-4" />
                    )}
                    <span className="ml-1">{recordingField === 'prescription' ? 'Recording...' : 'Voice'}</span>
                  </Button>
                </div>
                <Textarea
                  id="prescription"
                  placeholder="Prescription details... (or use voice input)"
                  value={formData.prescription}
                  onChange={(e) => setFormData({ ...formData, prescription: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="bg-[#0EA5E9] hover:bg-[#0284C7]">
                {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Treatment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}