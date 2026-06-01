'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Stethoscope,
  UserPlus,
  Search,
  Edit,
  Archive,
} from 'lucide-react';
import { toast } from 'sonner';
import { doctorApi } from '@/lib/api';

interface Doctor {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'DOCTOR' | 'RECEPTIONIST';
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  _count: { patients: number };
}

const roleBadge: Record<string, string> = {
  DOCTOR: 'bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20',
  RECEPTIONIST: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
};

const statusBadge: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  INACTIVE: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  ARCHIVED: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
};

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'DOCTOR',
    status: 'ACTIVE',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['doctors', search, page],
    queryFn: () => doctorApi.getAll({ query: search || undefined, page, limit: 20 }),
    select: (res) => res.data.data,
  });

  const doctors = (data?.doctors || []) as Doctor[];

  const handleOpenDialog = (doctor?: Doctor) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setFormData({
        name: doctor.name,
        email: doctor.email,
        phone: doctor.phone || '',
        role: doctor.role,
        status: doctor.status,
      });
    } else {
      setEditingDoctor(null);
      setFormData({ name: '', email: '', phone: '', role: 'DOCTOR', status: 'ACTIVE' });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Please fill in required fields');
      return;
    }
    try {
      if (editingDoctor) {
        await doctorApi.update(editingDoctor.id, formData);
        toast.success('Doctor updated successfully!');
      } else {
        await doctorApi.create(formData);
        toast.success('Doctor added successfully!');
      }
      setDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to save doctor');
    }
  };

  const handleArchive = async (doctor: Doctor) => {
    try {
      await doctorApi.archive(doctor.id);
      toast.success(`${doctor.name} archived successfully`);
      queryClient.invalidateQueries({ queryKey: ['doctors'] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to archive doctor');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#0D0D0D] font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-[24px] font-bold flex items-center gap-2">
              <Stethoscope className="h-6 w-6 text-[#1D9E75]" />
              Doctors & Staff
            </h1>
            <p className="text-sm text-[#6B7280] mt-1">
              Manage doctors and clinic staff
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger>
              <span className="inline-flex items-center justify-center rounded-[10px] h-10 px-4 font-medium bg-[#04342C] hover:bg-[#0F6E56] text-white cursor-pointer transition-all btn-active">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Staff
              </span>
            </DialogTrigger>
            <DialogContent className="max-w-md w-full rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white">
              <DialogHeader>
                <DialogTitle className="font-display text-[18px] font-semibold">
                  {editingDoctor ? 'Edit Staff Member' : 'Add Staff Member'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(v: string | null) => setFormData({ ...formData, role: v || 'DOCTOR' })}
                    >
                      <SelectTrigger className="mt-1 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DOCTOR">Doctor</SelectItem>
                        <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(v: string | null) => setFormData({ ...formData, status: v || 'ACTIVE' })}
                    >
                      <SelectTrigger className="mt-1 bg-white border-slate-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
                >
                  {editingDoctor ? 'Update' : 'Add Staff Member'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card border-0">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10 bg-white border-slate-200 h-11"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">
              Staff List
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                ({doctors.length} total)
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 shimmer rounded-lg" />
                ))}
              </div>
            ) : doctors.length > 0 ? (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 hover:bg-transparent">
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Name</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Email</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Phone</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Role</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Patients</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Status</TableHead>
                        <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctors.map((doctor) => (
                        <TableRow key={doctor.id} className="border-border/30 hover:bg-accent/30 transition-colors">
                          <TableCell className="font-medium">{doctor.name}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{doctor.email}</TableCell>
                          <TableCell className="text-muted-foreground text-sm">{doctor.phone || '—'}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border ${roleBadge[doctor.role] || ''}`}>
                              {doctor.role === 'DOCTOR' ? 'Doctor' : 'Receptionist'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{doctor._count.patients}</TableCell>
                          <TableCell>
                            <Badge className={`text-xs border ${statusBadge[doctor.status] || ''}`}>
                              {doctor.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-[#0EA5E9]"
                                onClick={() => handleOpenDialog(doctor)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-500"
                                onClick={() => handleArchive(doctor)}
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Stethoscope className="h-16 w-16 mb-4 opacity-20" />
                <p className="text-lg font-medium">No staff found</p>
                <p className="text-sm mt-1 opacity-60">
                  {search ? 'Try a different search term' : 'Add your first staff member to get started'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}