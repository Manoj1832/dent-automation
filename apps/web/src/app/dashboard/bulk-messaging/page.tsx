'use client';

import { useState } from 'react';
import { Send, Users, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';

// For demo purposes, predefined groups
const PATIENT_GROUPS = [
  { id: 'all', name: 'All Patients', count: 450, description: 'Every registered patient' },
  { id: 'recent', name: 'Recent Visitors (30 days)', count: 120, description: 'Patients who visited recently' },
  { id: 'due_cleaning', name: 'Due for Cleaning', count: 85, description: 'Patients whose last scaling was > 6 months ago' },
  { id: 'ortho', name: 'Ortho Patients', count: 42, description: 'Active orthodontic treatment plans' },
];

const TEMPLATES = [
  { id: 'clinic_announcement', name: 'General Announcement', preview: 'Dear Patient, we are excited to announce...' },
  { id: 'cleaning_reminder', name: 'Dental Cleaning Reminder', preview: 'Hi there! It has been 6 months since your last...' },
  { id: 'festival_greeting', name: 'Festival Greeting', preview: 'Wishing you and your family a very happy...' },
];

export default function BulkMessaging() {
  const [selectedGroup, setSelectedGroup] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const handleSend = async () => {
    if (!selectedGroup || !selectedTemplate) {
      setStatus({ type: 'error', message: 'Please select a patient group and a template.' });
      return;
    }

    setLoading(true);
    setStatus({ type: null, message: '' });

    try {
      // In a real app, the group ID would be sent to the backend, which resolves the phones.
      // For this implementation, we simulate fetching the phones and sending them to our bulk-send endpoint.
      // Since it's a dev demo, we'll send a dummy list of numbers.
      const dummyRecipients = ['9876543210', '9988776655', '9444455555'];

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/whatsapp/admin/bulk-send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer \${localStorage.getItem('token') || 'dummy-token'}`
        },
        body: JSON.stringify({
          recipients: dummyRecipients,
          templateName: selectedTemplate
        })
      });

      if (!res.ok) {
        throw new Error('Failed to queue bulk messages');
      }

      const result = await res.json();
      
      setStatus({ 
        type: 'success', 
        message: `Campaign started! Sent to \${result.result.successful.length} patients successfully. \${result.result.failed.length} failed.` 
      });
      setSelectedGroup('');
      setSelectedTemplate('');
    } catch (err: any) {
      setStatus({ type: 'error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MessageSquare className="w-8 h-8 mr-3 text-green-600" />
            WhatsApp Bulk Messaging
          </h1>
          <p className="text-gray-500 mt-2">Send targeted campaigns and announcements to specific patient groups.</p>
        </div>

        {status.type && (
          <div className={`p-4 rounded-xl mb-8 flex items-center space-x-3 \${
            status.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            <span className="font-medium">{status.message}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          
          {/* Step 1: Select Group */}
          <div className="p-8 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">1</span>
              Select Target Audience
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PATIENT_GROUPS.map(group => (
                <div 
                  key={group.id}
                  onClick={() => setSelectedGroup(group.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all \${
                    selectedGroup === group.id 
                      ? 'border-green-500 bg-green-50' 
                      : 'border-gray-100 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{group.name}</h3>
                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md font-semibold flex items-center">
                      <Users className="w-3 h-3 mr-1" />
                      {group.count}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Select Template */}
          <div className="p-8 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <span className="bg-green-100 text-green-800 w-6 h-6 rounded-full flex items-center justify-center text-sm mr-2">2</span>
              Choose Message Template
            </h2>
            <div className="space-y-3">
              {TEMPLATES.map(template => (
                <div 
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center space-x-4 \${
                    selectedTemplate === template.id 
                      ? 'border-green-500 bg-white shadow-sm' 
                      : 'border-transparent bg-white hover:border-gray-300 shadow-sm'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center \${
                    selectedTemplate === template.id ? 'border-green-500' : 'border-gray-300'
                  }`}>
                    {selectedTemplate === template.id && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{template.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 italic">"{template.preview}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Step 3: Send */}
          <div className="p-8 bg-gray-900 text-white flex justify-between items-center">
            <div>
              <p className="text-gray-400 text-sm">Ready to send campaign?</p>
              <p className="font-medium mt-1">
                {selectedGroup && selectedTemplate 
                  ? `Sending "\${TEMPLATES.find(t=>t.id===selectedTemplate)?.name}" to \${PATIENT_GROUPS.find(g=>g.id===selectedGroup)?.name}`
                  : 'Complete steps 1 and 2'}
              </p>
            </div>
            <button
              onClick={handleSend}
              disabled={loading || !selectedGroup || !selectedTemplate}
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-700 disabled:text-gray-500 disabled:cursor-not-allowed text-white px-8 py-4 rounded-xl font-bold flex items-center space-x-2 transition-colors"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Send Campaign</span>
                  <Send className="w-5 h-5" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
