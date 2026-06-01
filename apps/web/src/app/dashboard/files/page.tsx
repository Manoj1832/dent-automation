'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fileApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Search, FileText, Download, Image, File } from 'lucide-react';

interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  category: string;
  description: string | null;
  createdAt: string;
  patient: { id: string; patientId: string; name: string } | null;
  treatment: { id: string; procedure: string } | null;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  return File;
}

const categoryLabels: Record<string, string> = {
  XRAY: 'X-Ray',
  PRESCRIPTION: 'Prescription',
  INVOICE: 'Invoice',
  TREATMENT_PHOTO: 'Treatment Photo',
  REPORT: 'Report',
  LAB_INSTRUCTION: 'Lab Instruction',
  OTHER: 'Other',
};

export default function FilesPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['files', search, category],
    queryFn: () => fileApi.getAll({ category: category || undefined, page: 1, limit: 20 }),
    select: (res) => res.data.data,
  });

  return (
    <div className="min-h-screen bg-[#F0F4F8] text-slate-700 font-sans">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0EA5E9]/10 border border-[#0EA5E9]/20 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#0EA5E9]" />
            </div>
            Files
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage X-rays, prescriptions, reports and other files
          </p>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search files..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-slate-50 border-slate-200 text-slate-700 h-11"
              />
            </div>
            <Select value={category} onValueChange={(v: string | null) => setCategory(v || '')}>
              <SelectTrigger className="w-full sm:w-44 bg-slate-50 border-slate-200 text-slate-700 h-11">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Categories</SelectItem>
                <SelectItem value="XRAY">X-Ray</SelectItem>
                <SelectItem value="PRESCRIPTION">Prescription</SelectItem>
                <SelectItem value="INVOICE">Invoice</SelectItem>
                <SelectItem value="TREATMENT_PHOTO">Treatment Photo</SelectItem>
                <SelectItem value="REPORT">Report</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-2xl bg-white border border-slate-200 overflow-hidden">
          <div className="p-5 pb-3 border-b border-slate-200">
            <h2 className="text-base font-display font-bold text-slate-700">
              File Records
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
                  <div key={i} className="h-14 rounded-xl bg-slate-200 shimmer" />
                ))}
              </div>
            ) : data?.files && data.files.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200 hover:bg-transparent">
                      <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Name</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Category</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Patient</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Size</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider text-slate-500 font-medium">Uploaded</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.files.map((f: FileRecord) => {
                      const Icon = getFileIcon(f.mimeType);
                      return (
                        <TableRow key={f.id} className="border-slate-200 hover:bg-slate-50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-[#0EA5E9]/10 flex items-center justify-center">
                                <Icon className="h-4 w-4 text-[#0EA5E9]" />
                              </div>
                              <div>
                                <p className="font-medium text-slate-700 text-sm">{f.originalName}</p>
                                {f.description && (
                                  <p className="text-xs text-slate-400">{f.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs bg-slate-100 border-slate-200 text-slate-600">
                              {categoryLabels[f.category] || f.category}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {f.patient ? (
                              <span className="text-sm text-slate-600">{f.patient.name}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {formatBytes(f.size)}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm">
                            {new Date(f.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#0EA5E9]/10 flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 text-[#0EA5E9]" />
                </div>
                <p className="text-base font-semibold text-slate-700">No files found</p>
                <p className="text-sm text-slate-500 mt-1">Upload files to see them here</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}