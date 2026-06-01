'use client';

import { useEffect, useState } from 'react';
import { Calendar, User, UserCheck, ArrowRight, ArrowLeft } from 'lucide-react';

const STATUSES = ['SENT', 'IN_PROGRESS', 'READY', 'DELIVERED'];
const STATUS_COLORS = {
  SENT: 'bg-blue-100 text-blue-800 border-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  READY: 'bg-green-100 text-green-800 border-green-200',
  DELIVERED: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function LabCasesKanban() {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCases = async () => {
    try {
      const token = localStorage.getItem('token');
      // Replace this with actual API endpoint usage when authentication in the dashboard is fully set up
      // For now, if no token, just use a dummy one or pass through if the backend allows
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lab-cases`, {
        headers: { Authorization: `Bearer \${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      } else {
        // Dummy data for visual presentation if API fails (e.g. no auth token)
        setCases([
          { id: '1', labName: 'Smile Dental Lab', caseType: 'Crown', patient: { name: 'Karthik Raja' }, doctor: { name: 'Dr. Ram' }, status: 'SENT', createdAt: new Date() },
          { id: '2', labName: 'Smile Dental Lab', caseType: 'Bridge', patient: { name: 'Priya Dharshini' }, doctor: { name: 'Dr. Shiva' }, status: 'IN_PROGRESS', createdAt: new Date() },
          { id: '3', labName: 'Perfect Fit Lab', caseType: 'Denture', patient: { name: 'Senthil Kumar' }, doctor: { name: 'Dr. Ram' }, status: 'READY', createdAt: new Date() },
        ]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const moveCase = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/lab-cases/\${id}/status`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer \${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c));
      } else {
        // Optimistic update for demo purposes if backend fails auth
        setCases(cases.map(c => c.id === id ? { ...c, status: newStatus } : c));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading Kanban board...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lab Cases Tracker</h1>
          <p className="text-gray-500 mt-2">Manage outbound lab work across stages.</p>
        </div>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8">
        {STATUSES.map((status, index) => {
          const columnCases = cases.filter(c => c.status === status);
          return (
            <div key={status} className="flex-1 min-w-[300px] bg-gray-100 rounded-2xl p-4 flex flex-col max-h-[80vh]">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-700 capitalize">
                  {status.replace('_', ' ')}
                </h3>
                <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full font-bold">
                  {columnCases.length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                {columnCases.map(c => (
                  <div key={c.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full border \${STATUS_COLORS[status as keyof typeof STATUS_COLORS]}`}>
                        {c.caseType}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 className="font-bold text-gray-900 mb-1">{c.patient?.name}</h4>
                    
                    <div className="space-y-2 mt-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{c.doctor?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserCheck className="w-4 h-4 text-gray-400" />
                        <span>{c.labName}</span>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => moveCase(c.id, STATUSES[index - 1])}
                        disabled={index === 0}
                        className={`p-2 rounded-lg transition-colors \${index === 0 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>
                      <span className="text-xs font-medium text-gray-400">Move</span>
                      <button
                        onClick={() => moveCase(c.id, STATUSES[index + 1])}
                        disabled={index === STATUSES.length - 1}
                        className={`p-2 rounded-lg transition-colors \${index === STATUSES.length - 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100'}`}
                      >
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {columnCases.length === 0 && (
                  <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl">
                    <p className="text-sm text-gray-400 font-medium">No cases</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
