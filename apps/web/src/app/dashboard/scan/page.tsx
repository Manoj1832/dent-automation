'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { patientApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { QrCode, Camera, ArrowRight, AlertCircle, MapPin, Phone, Mail, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { Html5Qrcode } from 'html5-qrcode';

interface FoundPatient {
  id: string;
  patientId: string;
  name: string;
  phone: string | null;
  email: string | null;
  age: number | null;
  gender: string | null;
  address: string | null;
}

export default function ScanPage() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState('');
  const [scanError, setScanError] = useState('');
  const [showPermissions, setShowPermissions] = useState(false);
  const [foundPatient, setFoundPatient] = useState<FoundPatient | null>(null);
  const [showResult, setShowResult] = useState(false);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);

  const handleScan = async (patientId: string) => {
    try {
      const { data } = await patientApi.scan(patientId);
      const p = data.data;
      const patientData = p.patient || p;
      const found: FoundPatient = {
        id: patientData.id,
        patientId: patientData.patientId,
        name: patientData.name,
        phone: patientData.phone,
        email: patientData.email,
        age: patientData.age,
        gender: patientData.gender,
        address: patientData.address,
      };
      setFoundPatient(found);
      setShowResult(true);
    } catch {
      toast.error('Patient not found');
    }
  };

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      stream.getTracks().forEach(t => t.stop());
      setShowPermissions(false);
      setScanning(true); // Mount the #qr-reader div
      setTimeout(() => startCamera(), 100); // Wait for DOM
    } catch {
      setShowPermissions(true);
    }
  };

  const startCamera = async () => {
    try {
      setScanError('');
      const html5Qrcode = new Html5Qrcode('qr-reader');
      html5QrcodeRef.current = html5Qrcode;

      await html5Qrcode.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          html5Qrcode.stop().then(() => {
            setScanning(false);
            handleScan(decodedText);
          });
        },
        (errorMessage) => {
          if (!errorMessage.includes('No MultiFormat') && !errorMessage.includes('NotFoundException')) {
            setScanError(errorMessage);
          }
        }
      );
    } catch (err: any) {
      setScanning(false);
      setShowPermissions(true);
      toast.error('Camera initialization failed: ' + (err?.message || 'Unknown error'));
    }
  };

  const stopCamera = async () => {
    if (html5QrcodeRef.current) {
      try {
        await html5QrcodeRef.current.stop();
        html5QrcodeRef.current.clear();
      } catch { }
      html5QrcodeRef.current = null;
    }
    setScanning(false);
    setScanError('');
  };

  useEffect(() => {
    let html5QrcodeInstance = html5QrcodeRef.current;
    return () => {
      if (html5QrcodeInstance) {
        html5QrcodeInstance.stop().catch(() => {});
        html5QrcodeInstance = null;
      }
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualId.trim()) handleScan(manualId.trim());
  };

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-[#0EA5E9]" />
            </div>
            QR Scan
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Scan patient QR code or enter ID manually
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="p-5 pb-0 flex items-center gap-2">
              <Camera className="h-4 w-4 text-[#0EA5E9]" />
              <h2 className="text-base font-display font-bold text-slate-700">Camera Scanner</h2>
            </div>
            <div className="p-5">
              {!scanning ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="w-48 h-48 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center mb-6">
                    <QrCode className="h-16 w-16 text-slate-400" />
                  </div>
                  <Button onClick={requestCameraPermission} className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold">
                    <Camera className="h-4 w-4 mr-2" />
                    Enable Camera & Scan
                  </Button>
                  <p className="text-xs text-slate-500 mt-4">
                    Point camera at patient QR code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 border border-slate-200">
                    <div id="qr-reader" className="w-full h-full" />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-48 h-48 border-2 border-[#0EA5E9] rounded-2xl" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700" onClick={stopCamera}>
                    Stop Camera
                  </Button>
                  {scanError && (
                    <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 text-center">
                      <AlertCircle className="h-5 w-5 text-amber-400 mx-auto mb-2" />
                      <p className="text-sm text-amber-600">{scanError}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
            <div className="p-5 pb-3 border-b border-slate-200">
              <h2 className="text-base font-display font-bold text-slate-700">Manual Entry</h2>
            </div>
            <div className="p-5">
              <form onSubmit={handleManualSubmit} className="space-y-4">
                <div>
                  <label className="text-sm text-slate-500 font-medium">Patient ID / Name</label>
                  <Input
                    type="text"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value)}
                    placeholder="e.g., DF-2026-0001 or John Doe"
                    className="mt-1.5 bg-white border-slate-200 text-slate-700 h-11"
                  />
                </div>
                <Button type="submit" className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Find Patient
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showPermissions} onOpenChange={setShowPermissions}>
        <DialogContent className="max-w-sm glass-card border-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-slate-800">Camera Permission Required</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Clinic needs camera access to scan QR codes. Please allow camera access in your browser settings.</p>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="border-slate-200 text-slate-600" onClick={() => setShowPermissions(false)}>
                Cancel
              </Button>
              <Button className="bg-[#0EA5E9] hover:bg-[#0284C7] text-white" onClick={() => {
                setShowPermissions(false);
                startCamera();
              }}>
                Try Again
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showResult} onOpenChange={setShowResult}>
        <DialogContent className="max-w-md glass-card border-0">
          <DialogHeader>
            <DialogTitle className="gradient-text text-xl">Patient Found</DialogTitle>
          </DialogHeader>
          {foundPatient && (
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-4">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(JSON.stringify({ id: foundPatient.id, patientId: foundPatient.patientId }))}`}
                  alt="Patient QR"
                  className="w-28 h-28 rounded-xl border border-slate-200"
                />
                <div>
                  <h3 className="text-lg font-bold text-slate-800">{foundPatient.name}</h3>
                  <p className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded mt-1 inline-block">{foundPatient.patientId}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {foundPatient.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="h-4 w-4 text-sky-500" />
                    {foundPatient.phone}
                  </div>
                )}
                {foundPatient.email && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail className="h-4 w-4 text-sky-500" />
                    {foundPatient.email}
                  </div>
                )}
                {foundPatient.age && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="h-4 w-4 text-sky-500" />
                    {foundPatient.age} years
                  </div>
                )}
                {foundPatient.address && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="h-4 w-4 text-sky-500" />
                    {foundPatient.address}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-[#0EA5E9] hover:bg-[#0284C7] text-white" onClick={() => {
                  setShowResult(false);
                  router.push(`/dashboard/patients/${foundPatient.id}`);
                }}>
                  View Full Profile
                </Button>
                <Button variant="outline" className="border-slate-200" onClick={() => setShowResult(false)}>
                  Scan Another
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}