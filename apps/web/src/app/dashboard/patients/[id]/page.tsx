'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { patientApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  ArrowLeft,
  QrCode,
  Stethoscope,
  CalendarDays,
  FileText,
  Printer,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PatientDetail {
  id: string;
  patientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  emergencyName: string | null;
  emergencyPhone: string | null;
  createdAt: string;
  appointments: Array<{
    id: string;
    date: string;
    startTime: string;
    status: string;
    type: string | null;
    doctor: { name: string };
  }>;
  treatments: Array<{
    id: string;
    procedure: string;
    toothNumbers: number[];
    notes: string | null;
    createdAt: string;
    doctor: { name: string };
  }>;
  _count: { appointments: number; treatments: number; files: number; invoices: number };
}

const statusColors: Record<string, string> = {
  SCHEDULED: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
  IN_PROGRESS: 'bg-amber-400/10 text-amber-400 border-amber-400/30',
  COMPLETED: 'bg-emerald-400/10 text-emerald-400 border-emerald-400/30',
  CANCELLED: 'bg-red-400/10 text-red-400 border-red-400/30',
  MISSED: 'bg-violet-400/10 text-violet-400 border-violet-400/30',
};

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const { data: patient, isLoading } = useQuery({
    queryKey: ['patient', id],
    queryFn: () => patientApi.getOne(id),
    select: (res) => res.data.data,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-48 shimmer rounded-xl" />
        <div className="h-64 shimmer rounded-xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Users className="h-16 w-16 mb-4 text-muted-foreground" />
        <p className="text-lg font-medium">Patient not found</p>
        <Link href="/dashboard/patients">
          <Button variant="link" className="mt-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to patients
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{patient.name}</h1>
          <div className="flex items-center gap-3 mt-1">
            <Badge variant="secondary" className="font-mono">{patient.patientId}</Badge>
            <span className="text-sm text-muted-foreground">
              {patient._count.appointments} visits • {patient._count.treatments} treatments
            </span>
            <span className="text-sm text-muted-foreground">
              Registered {new Date(patient.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
        <div className="hidden sm:flex flex-col items-center gap-2">
          <img loading="lazy"
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${patient.patientId}`}
            alt="Patient QR Code"
            className="w-28 h-28 rounded-xl border-2 border-[#0EA5E9]/20"
          />
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => window.print()}
          >
            <Printer className="h-3 w-3 mr-1" />
            Print QR
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-4">
          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Patient Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {patient.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.address}</span>
                </div>
              )}
              {patient.age && (
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{patient.age} years old</span>
                </div>
              )}
              {patient.gender && (
                <Badge variant="outline">{patient.gender}</Badge>
              )}
            </CardContent>
          </Card>

          

          {patient.emergencyName && (
            <Card className="glass-card border-0">
              <CardHeader>
                <CardTitle className="text-sm font-semibold">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-medium">{patient.emergencyName}</p>
                {patient.emergencyPhone && (
                  <p className="text-xs text-muted-foreground mt-1">{patient.emergencyPhone}</p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="glass-card border-0">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" className="text-xs" onClick={() => router.push('/dashboard/appointments')}>
                <CalendarDays className="h-3 w-3 mr-1" />
                Book Appointment
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => router.push(`/dashboard/treatments?patientId=${patient.id}`)}>
                <Stethoscope className="h-3 w-3 mr-1" />
                Add Treatment
              </Button>
              <Button size="sm" variant="outline" className="text-xs" onClick={() => router.push(`/dashboard/files?patientId=${patient.id}`)}>
                <FileText className="h-3 w-3 mr-1" />
                Upload File
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="appointments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="appointments">Appointments</TabsTrigger>
              <TabsTrigger value="treatments">Treatments</TabsTrigger>
              <TabsTrigger value="files">Files ({patient._count.files})</TabsTrigger>
            </TabsList>

            <TabsContent value="appointments">
              {patient.appointments.length > 0 ? (
                <div className="space-y-3">
                  {patient.appointments.map((apt: PatientDetail['appointments'][number]) => (
                    <Card key={apt.id} className="glass-card border-0">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-sm font-bold text-primary">
                            {new Date(apt.date).getDate()}
                          </div>
                          <div>
                            <p className="font-medium">{apt.type || 'General Checkup'}</p>
                            <p className="text-xs text-muted-foreground">
                              Dr. {apt.doctor.name} • {new Date(apt.startTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className={`text-xs ${statusColors[apt.status] || ''}`}>
                          {apt.status.replace('_', ' ')}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarDays className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No appointments yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="treatments">
              {patient.treatments.length > 0 ? (
                <div className="space-y-3">
                  {patient.treatments.map((t: PatientDetail['treatments'][number]) => (
                    <Card key={t.id} className="glass-card border-0">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{t.procedure}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Dr. {t.doctor.name} • {new Date(t.createdAt).toLocaleDateString()}
                            </p>
                            {t.toothNumbers.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {t.toothNumbers.map((n: number) => (
                                  <Badge key={n} variant="outline" className="text-xs">#{n}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          {t.notes && (
                            <p className="text-xs text-muted-foreground max-w-xs">{t.notes}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-20" />
                  <p>No treatments recorded</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="files">
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>{patient._count.files} files uploaded</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}