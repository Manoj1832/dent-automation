'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Building2, Bell, Shield, Save, User, Phone, Mail, MapPin, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [clinicName, setClinicName] = useState('SREE ARUMUGAVADIVU MULTISPECIALITY DENTAL & IMPLANT CLINIC');
  const [website, setWebsite] = useState('www.Arungandudental.com');
  const [phone1, setPhone1] = useState('8300693295');
  const [phone2, setPhone2] = useState('8300692978');
  const [phone3, setPhone3] = useState('9843454814');
  const [email, setEmail] = useState('dr.hariparandent@gmail.com');
  const [address, setAddress] = useState('VMK Complex, First Floor, 129, Sathy Road, Veerappanchatiram, Erode');
  
  const [doctorName, setDoctorName] = useState('Dr. Ar. Hariparasudan');
  const [qualification, setQualification] = useState('BDS, MISH, CERP (American Dental Association)');
  const [specialization, setSpecialization] = useState('Dental Surgeon & Implant Consultant');

  const handleSave = () => {
    toast.success('Clinic settings saved successfully');
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
              <Settings className="h-5 w-5 text-[#0EA5E9]" />
            </div>
            Clinic Settings
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your clinic and doctor profile details
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Building2 className="h-4 w-4 text-[#0EA5E9]" />
            <h2 className="text-base font-display font-bold text-slate-700">Clinic Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label htmlFor="clinicName" className="text-slate-500 text-sm">Clinic Name</Label>
              <Input
                id="clinicName"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <div>
              <Label htmlFor="website" className="text-slate-500 text-sm">Website</Label>
              <Input
                id="website"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="phone1" className="text-slate-500 text-sm">Phone 1</Label>
                <Input
                  id="phone1"
                  value={phone1}
                  onChange={(e) => setPhone1(e.target.value)}
                  className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
                />
              </div>
              <div>
                <Label htmlFor="phone2" className="text-slate-500 text-sm">Phone 2</Label>
                <Input
                  id="phone2"
                  value={phone2}
                  onChange={(e) => setPhone2(e.target.value)}
                  className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
                />
              </div>
              <div>
                <Label htmlFor="phone3" className="text-slate-500 text-sm">Phone 3</Label>
                <Input
                  id="phone3"
                  value={phone3}
                  onChange={(e) => setPhone3(e.target.value)}
                  className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="email" className="text-slate-500 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <div>
              <Label htmlFor="address" className="text-slate-500 text-sm">Address</Label>
              <Textarea
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200 flex items-center gap-2">
            <User className="h-4 w-4 text-[#0EA5E9]" />
            <h2 className="text-base font-display font-bold text-slate-700">Doctor Information</h2>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <Label htmlFor="doctorName" className="text-slate-500 text-sm">Doctor Name</Label>
              <Input
                id="doctorName"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <div>
              <Label htmlFor="qualification" className="text-slate-500 text-sm">Qualification</Label>
              <Input
                id="qualification"
                value={qualification}
                onChange={(e) => setQualification(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <div>
              <Label htmlFor="specialization" className="text-slate-500 text-sm">Specialization</Label>
              <Input
                id="specialization"
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="mt-1.5 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Bell className="h-4 w-4 text-[#0EA5E9]" />
            <h2 className="text-base font-display font-bold text-slate-700">Notifications</h2>
          </div>
          <div className="p-5">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Appointment Reminders</p>
                  <p className="text-xs text-slate-400 mt-0.5">Send reminders 30 min before appointments</p>
                </div>
                <Badge variant="secondary" className="bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Missed Appointment Alerts</p>
                  <p className="text-xs text-slate-400 mt-0.5">Notify patients when they miss appointments</p>
                </div>
                <Badge variant="secondary" className="bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-700">Recall Reminders</p>
                  <p className="text-xs text-slate-400 mt-0.5">6-month dental checkup reminders</p>
                </div>
                <Badge variant="secondary" className="bg-[#0EA5E9]/10 text-[#0EA5E9] border-[#0EA5E9]/20">Enabled</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold">
            <Save className="h-4 w-4 mr-2" />
            Save All Changes
          </Button>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200 flex items-center gap-2">
            <Shield className="h-4 w-4 text-[#0EA5E9]" />
            <h2 className="text-base font-display font-bold text-slate-700">System Info</h2>
          </div>
          <div className="p-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs">Version</p>
                <p className="font-mono font-medium text-slate-700 mt-0.5">v1.0.0</p>
              </div>
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-400 text-xs">Environment</p>
                <p className="font-medium text-slate-700 mt-0.5">Production Ready</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}