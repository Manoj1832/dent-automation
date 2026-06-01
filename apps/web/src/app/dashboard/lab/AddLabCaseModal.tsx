import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { labApi, patientApi, doctorApi } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export function AddLabCaseModal({ open, onClose }: { open: boolean, onClose: () => void }) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    patientId: '', doctorId: '', labName: '', caseType: '', cost: '', expectedDate: ''
  });

  const { data: patients } = useQuery({ queryKey: ['patients-list'], queryFn: () => patientApi.getAll({ limit: 100 }), select: (res) => res.data.data.patients });
  const { data: doctors } = useQuery({ queryKey: ['doctors'], queryFn: () => doctorApi.getAll(), select: (res) => res.data.data?.doctors || [] });

  const createMutation = useMutation({
    mutationFn: (data: any) => labApi.create(data),
    onSuccess: () => {
      toast.success('Lab case created!');
      onClose();
      queryClient.invalidateQueries({ queryKey: ['lab-cases'] });
    },
    onError: () => toast.error('Failed to create lab case')
  });

  const handleSubmit = () => {
    if (!formData.patientId || !formData.doctorId || !formData.labName || !formData.caseType) {
      toast.error('Fill required fields'); return;
    }
    createMutation.mutate({
      ...formData,
      cost: formData.cost ? parseFloat(formData.cost) : undefined,
      expectedDate: formData.expectedDate ? new Date(formData.expectedDate).toISOString() : undefined
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Add New Lab Case</DialogTitle></DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Patient *</Label>
            <Select value={formData.patientId} onValueChange={(v) => setFormData({...formData, patientId: v || ''})}>
              <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
              <SelectContent>
                {patients?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Doctor *</Label>
            <Select value={formData.doctorId} onValueChange={(v) => setFormData({...formData, doctorId: v || ''})}>
              <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
              <SelectContent>
                {doctors?.map((d: any) => <SelectItem key={d.id} value={d.id}>Dr. {d.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Lab Name *</Label>
              <Input value={formData.labName} onChange={(e) => setFormData({...formData, labName: e.target.value})} placeholder="e.g. DentLab" />
            </div>
            <div className="space-y-2">
              <Label>Case Type *</Label>
              <Input value={formData.caseType} onChange={(e) => setFormData({...formData, caseType: e.target.value})} placeholder="e.g. Crown, Bridge" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expected Date</Label>
              <Input type="date" value={formData.expectedDate} onChange={(e) => setFormData({...formData, expectedDate: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label>Cost (₹)</Label>
              <Input type="number" value={formData.cost} onChange={(e) => setFormData({...formData, cost: e.target.value})} placeholder="0.00" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
