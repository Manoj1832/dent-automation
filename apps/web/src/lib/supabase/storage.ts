import { createClient } from './client';

type FileCategory = 'XRAY' | 'PRESCRIPTION' | 'INVOICE' | 'TREATMENT_PHOTO' | 'REPORT' | 'LAB_INSTRUCTION' | 'OTHER';

const supabase = createClient();

export interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
  type: string;
}

export async function uploadPatientFile(
  file: File,
  patientId: string,
  category: FileCategory
): Promise<UploadResult> {
  const ext = file.name.split('.').pop();
  const path = `${patientId}/${category}/${Date.now()}.${ext}`;

  const { data, error } = await supabase.storage
    .from('patient-files')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw new Error(error.message);

  const { data: urlData } = supabase.storage
    .from('patient-files')
    .getPublicUrl(path);

  return {
    url: urlData.publicUrl,
    path: data.path,
    name: file.name,
    size: file.size,
    type: file.type,
  };
}

export async function deletePatientFile(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from('patient-files')
    .remove([path]);
  if (error) throw new Error(error.message);
}

export async function listPatientFiles(patientId: string) {
  const { data, error } = await supabase.storage
    .from('patient-files')
    .list(`${patientId}/`, { limit: 100 });

  if (error) throw new Error(error.message);
  return data;
}

export function getPublicUrl(path: string): string {
  const { data } = supabase.storage
    .from('patient-files')
    .getPublicUrl(path);
  return data.publicUrl;
}