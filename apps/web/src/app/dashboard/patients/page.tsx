'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { patientApi } from '@/lib/api';
import { TableSkeleton } from '@/components/ui/skeleton';
import { GooglePlacesAutocomplete } from '@/components/google';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import {
  Users,
  UserPlus,
  Search,
  QrCode,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Phone,
  Mail,
  Calendar,
} from 'lucide-react';

interface Patient {
  id: string;
  patientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  createdAt: string;
  _count: { appointments: number; treatments: number };
}

export default function PatientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [qrDialogOpen, setQrDialogOpen] = useState(false);
  const [createdPatient, setCreatedPatient] = useState<Patient | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    age: '',
    gender: '',
    address: '',
    emergencyName: '',
    emergencyPhone: '',
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['patients', search, page],
    queryFn: () =>
      patientApi.getAll({ query: search || undefined, page, limit: 20 }),
    select: (res) => res.data.data,
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await patientApi.create({
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender || undefined,
        address: formData.address || undefined,
        emergencyName: formData.emergencyName || undefined,
        emergencyPhone: formData.emergencyPhone || undefined,
      });

      const newPatient = res.data.data;
      toast.success('Patient registered successfully!');
      setDialogOpen(false);
      setCreatedPatient(newPatient);
      setQrDialogOpen(true);
      setFormData({
        name: '',
        phone: '',
        email: '',
        age: '',
        gender: '',
        address: '',
        emergencyName: '',
        emergencyPhone: '',
      });
      refetch();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to create patient');
    }
  };

  const handleCopyId = () => {
    if (createdPatient) {
      navigator.clipboard.writeText(createdPatient.patientId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-[24px] font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-[#1D9E75]" />
            Patients
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Manage patient records and profiles
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger>
            <span className="inline-flex items-center justify-center rounded-[10px] h-10 px-4 font-medium bg-[#04342C] hover:bg-[#0F6E56] text-white cursor-pointer transition-all btn-active">
              <UserPlus className="h-4 w-4 mr-2" />
              New Patient
            </span>
          </DialogTrigger>
          <DialogContent className="max-w-lg w-full rounded-[14px] border border-[rgba(0,0,0,0.08)] bg-white max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display text-[18px] font-semibold">
                Register New Patient
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreate} className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>

                <div>
                  <Label htmlFor="age">Age</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) =>
                      setFormData({ ...formData, age: e.target.value })
                    }
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>

                <div>
                  <Label htmlFor="gender">Gender</Label>
                  <Select
                    value={formData.gender}
                    onValueChange={(v) =>
                      setFormData({ ...formData, gender: v || '' })
                    }
                  >
                    <SelectTrigger className="mt-1 bg-slate-100">
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <div className="mt-1">
                  <GooglePlacesAutocomplete
                    value={formData.address}
                    onChange={(address) => setFormData({ ...formData, address })}
                    placeholder="Search for address..."
                    className="bg-white border-slate-200"
                  />
                </div>
              </div>

              

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="emergencyName">Emergency Contact</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyName}
                    onChange={(e) =>
                      setFormData({ ...formData, emergencyName: e.target.value })
                    }
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Emergency Phone</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyPhone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyPhone: e.target.value,
                      })
                    }
                    className="mt-1 bg-white border-slate-200"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              >
                Register Patient
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md glass-card border-0">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Patient Registered!</DialogTitle>
          </DialogHeader>
          {createdPatient && (
            <div className="space-y-6">
               <div className="flex flex-col items-center">
                 <img loading="lazy"
                   src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${createdPatient.patientId}`}
                   alt="Patient QR Code"
                   className="w-48 h-48 rounded-xl border-4 border-[#0EA5E9]/20"
                 />
               </div>
              <div className="bg-[#0EA5E9]/5 border border-[#0EA5E9]/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Patient ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[#0EA5E9]">{createdPatient.patientId}</span>
                    <button
                      onClick={handleCopyId}
                      className="p-1 rounded-md hover:bg-[#0EA5E9]/10 transition-colors"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Name</span>
                  <span className="font-medium">{createdPatient.name}</span>
                </div>
                {createdPatient.phone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</span>
                    <span className="font-medium">{createdPatient.phone}</span>
                  </div>
                )}
                {createdPatient.email && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> Email</span>
                    <span className="font-medium text-xs">{createdPatient.email}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground flex items-center gap-1"><Calendar className="h-3 w-3" /> Registered</span>
                  <span className="font-medium">{new Date(createdPatient.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
              </div>
              <Button
                onClick={() => router.push(`/dashboard/patients/${createdPatient.id}`)}
                className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white"
              >
                View Patient Profile
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="glass-card border-0">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, or patient ID..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="pl-10 bg-slate-100 border-slate-200 h-11"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass-card border-0 overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">
            Patient Records
            {data?.pagination && (
              <span className="text-muted-foreground font-normal ml-2 text-sm">
                ({data.pagination.total} total)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <TableSkeleton rows={5} cols={7} />
          ) : data?.patients && data.patients.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/50 hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Patient ID
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Name
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Phone
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Age
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Gender
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        Visits
                      </TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-muted-foreground">
                        QR
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.patients.map((patient: Patient) => (
                      <TableRow
                        key={patient.id}
                        className="border-border/30 hover:bg-accent/30 cursor-pointer transition-colors"
                        onClick={() => router.push(`/dashboard/patients/${patient.id}`)}
                      >
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className="font-mono text-xs"
                          >
                            {patient.patientId}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {patient.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient.phone || '—'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient.age || '—'}
                        </TableCell>
                        <TableCell>
                          {patient.gender ? (
                            <Badge variant="outline" className="text-xs">
                              {patient.gender}
                            </Badge>
                          ) : (
                            '—'
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {patient._count.appointments}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border/30">
                  <p className="text-xs text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Users className="h-16 w-16 mb-4 opacity-20" />
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-sm mt-1 opacity-60">
                {search
                  ? 'Try a different search term'
                  : 'Register your first patient to get started'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}