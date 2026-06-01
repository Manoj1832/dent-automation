'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, User, Phone, CheckCircle2, ChevronRight, MapPin, Clock } from 'lucide-react';

interface Doctor {
  id: string;
  name: string;
}

interface Slot {
  id: string;
  label: string;
  startTime: string;
  date: string;
}

export default function BookingPage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);
  
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  
  const [patientData, setPatientData] = useState({ name: '', phone: '' });
  const [patientId, setPatientId] = useState<string | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [bookingResult, setBookingResult] = useState<any>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (selectedDoctor) {
      fetchSlots(selectedDoctor);
    }
  }, [selectedDoctor]);

  const fetchDoctors = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/public/booking/doctors');
      if (!res.ok) throw new Error('Failed to fetch doctors');
      const data = await res.json();
      setDoctors(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSlots = async (doctorId: string) => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/public/booking/slots/${doctorId}?days=7`);
      if (!res.ok) throw new Error('Failed to fetch slots');
      const data = await res.json();
      setSlots(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIdentifyPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientData.phone) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/public/booking/patient', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patientData)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to identify patient');
      
      setPatientId(data.id);
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookAppointment = async () => {
    if (!patientId || !selectedDoctor || !selectedSlot) return;
    
    try {
      setIsLoading(true);
      setError(null);
      const res = await fetch('/api/public/booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId,
          doctorId: selectedDoctor,
          slotId: selectedSlot.id
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to book appointment');
      
      setBookingResult(data);
    } catch (err: any) {
      setError(err.message);
      // If lock failed, refresh slots
      if (err.message.includes('slot is currently being booked') || err.message.includes('taken')) {
        fetchSlots(selectedDoctor);
        setStep(2);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Group slots by date
  const slotsByDate = slots.reduce((acc, slot) => {
    if (!acc[slot.date]) acc[slot.date] = [];
    acc[slot.date].push(slot);
    return acc;
  }, {} as Record<string, Slot[]>);

  if (bookingResult) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center border border-gray-100"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-500 mb-8">Your appointment has been successfully scheduled.</p>
          
          <div className="bg-gray-50 rounded-2xl p-6 text-left space-y-4 mb-8">
            <div>
              <p className="text-sm text-gray-500">Queue Number</p>
              <p className="text-4xl font-bold text-[#1a1a2e]">#{bookingResult.queueNumber}</p>
            </div>
            
            <div className="border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500 mb-1">Doctor</p>
              <p className="font-semibold text-gray-900">Dr. {bookingResult.doctorName}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-gray-200 pt-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Date</p>
                <p className="font-semibold text-gray-900">{bookingResult.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Time</p>
                <p className="font-semibold text-gray-900">{bookingResult.time}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-[#1a1a2e] text-white rounded-xl py-4 font-semibold hover:bg-gray-800 transition-colors"
          >
            Book Another Appointment
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 tracking-tight">SREE ARUMUGAVADIVU</h1>
          <p className="mt-2 text-lg text-gray-500">Dental Clinic Appointment Booking</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((num) => (
              <div key={num} className={`flex items-center \${num < 4 ? 'flex-1' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 \${
                  step >= num ? 'bg-[#1a1a2e] text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {num}
                </div>
                {num < 4 && (
                  <div className={`flex-1 h-1 mx-2 rounded transition-colors duration-300 \${
                    step > num ? 'bg-[#1a1a2e]' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs font-medium text-gray-400">
            <span>Doctor</span>
            <span>Slot</span>
            <span>Details</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
          {error && (
            <div className="bg-red-50 text-red-500 p-4 text-center font-medium border-b border-red-100">
              {error}
            </div>
          )}
          
          <div className="p-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <h2 className="text-2xl font-bold text-gray-900">Select a Doctor</h2>
                  {isLoading ? (
                    <div className="animate-pulse space-y-4">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-2xl w-full" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {doctors.map(doctor => (
                        <button
                          key={doctor.id}
                          onClick={() => {
                            setSelectedDoctor(doctor.id);
                            setStep(2);
                          }}
                          className="flex items-center justify-between p-5 rounded-2xl border-2 border-gray-100 hover:border-[#1a1a2e] hover:bg-gray-50 transition-all group text-left"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-[#1a1a2e]/5 rounded-full flex items-center justify-center text-[#1a1a2e]">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="font-bold text-lg text-gray-900">Dr. {doctor.name}</p>
                              <p className="text-sm text-gray-500">General Dentistry</p>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#1a1a2e]" />
                        </button>
                      ))}
                      {doctors.length === 0 && !isLoading && (
                        <p className="text-center text-gray-500 py-8">No doctors currently available.</p>
                      )}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center mb-6">
                    <button 
                      onClick={() => setStep(1)}
                      className="text-gray-400 hover:text-gray-600 transition-colors mr-4"
                    >
                      ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Select a Time</h2>
                  </div>

                  {isLoading ? (
                    <div className="animate-pulse space-y-6">
                      <div className="h-6 w-32 bg-gray-100 rounded" />
                      <div className="grid grid-cols-3 gap-3">
                        {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}
                      </div>
                    </div>
                  ) : Object.keys(slotsByDate).length > 0 ? (
                    <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      {Object.entries(slotsByDate).map(([date, daySlots]) => {
                        const dateObj = new Date(date);
                        const isToday = dateObj.toDateString() === new Date().toDateString();
                        const isTomorrow = dateObj.toDateString() === new Date(Date.now() + 86400000).toDateString();
                        
                        let dateHeader = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                        if (isToday) dateHeader = `Today, ${dateHeader}`;
                        else if (isTomorrow) dateHeader = `Tomorrow, ${dateHeader}`;

                        return (
                          <div key={date}>
                            <h3 className="font-semibold text-gray-700 mb-4 sticky top-0 bg-white py-2 flex items-center z-10">
                              <Calendar className="w-4 h-4 mr-2" />
                              {dateHeader}
                            </h3>
                            <div className="grid grid-cols-3 gap-3">
                              {daySlots.map(slot => (
                                <button
                                  key={slot.id}
                                  onClick={() => {
                                    setSelectedSlot(slot);
                                    setStep(3);
                                  }}
                                  className="py-3 px-2 text-sm font-medium rounded-xl border border-gray-200 hover:border-[#1a1a2e] hover:bg-[#1a1a2e] hover:text-white transition-all text-center"
                                >
                                  {slot.startTime}
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 font-medium">No available slots for the next 7 days.</p>
                      <button 
                        onClick={() => setStep(1)}
                        className="mt-4 text-[#1a1a2e] font-semibold hover:underline"
                      >
                        Choose a different doctor
                      </button>
                    </div>
                  )}
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center mb-6">
                    <button 
                      onClick={() => setStep(2)}
                      className="text-gray-400 hover:text-gray-600 transition-colors mr-4"
                    >
                      ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Your Details</h2>
                  </div>

                  <form onSubmit={handleIdentifyPatient} className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-gray-500 sm:text-sm">+91</span>
                        </div>
                        <input
                          type="tel"
                          required
                          pattern="[0-9]{10}"
                          value={patientData.phone}
                          onChange={(e) => setPatientData({ ...patientData, phone: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                          className="pl-12 block w-full rounded-xl border-gray-200 bg-gray-50 py-3 text-gray-900 focus:border-[#1a1a2e] focus:bg-white focus:ring-[#1a1a2e] transition-colors"
                          placeholder="98765 43210"
                        />
                      </div>
                      <p className="mt-1 text-xs text-gray-500">Used for booking confirmation</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name (Optional for existing patients)
                      </label>
                      <input
                        type="text"
                        value={patientData.name}
                        onChange={(e) => setPatientData({ ...patientData, name: e.target.value })}
                        className="block w-full rounded-xl border-gray-200 bg-gray-50 py-3 text-gray-900 focus:border-[#1a1a2e] focus:bg-white focus:ring-[#1a1a2e] transition-colors"
                        placeholder="John Doe"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading || patientData.phone.length !== 10}
                      className="w-full bg-[#1a1a2e] text-white rounded-xl py-4 font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center mt-8"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        'Continue to Confirmation'
                      )}
                    </button>
                  </form>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center mb-6">
                    <button 
                      onClick={() => setStep(3)}
                      className="text-gray-400 hover:text-gray-600 transition-colors mr-4"
                    >
                      ← Back
                    </button>
                    <h2 className="text-2xl font-bold text-gray-900">Review & Confirm</h2>
                  </div>

                  <div className="bg-gray-50 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Doctor</p>
                        <p className="font-semibold text-gray-900">
                          Dr. {doctors.find(d => d.id === selectedDoctor)?.name}
                        </p>
                      </div>
                      <button onClick={() => setStep(1)} className="text-sm text-[#1a1a2e] font-medium hover:underline">Edit</button>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Time</p>
                        <p className="font-semibold text-gray-900">
                          {selectedSlot?.label}
                        </p>
                      </div>
                      <button onClick={() => setStep(2)} className="text-sm text-[#1a1a2e] font-medium hover:underline">Edit</button>
                    </div>

                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Contact</p>
                        <p className="font-semibold text-gray-900">
                          +91 {patientData.phone.replace(/(\d{5})(\d{5})/, '$1 $2')}
                        </p>
                      </div>
                      <button onClick={() => setStep(3)} className="text-sm text-[#1a1a2e] font-medium hover:underline">Edit</button>
                    </div>
                  </div>

                  <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm flex items-start">
                    <MapPin className="w-5 h-5 mr-3 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>Clinic Location:</strong> Sree Arumugavadivu Dental Clinic, Main Road, Erode. Please arrive 10 minutes before your scheduled time.
                    </p>
                  </div>

                  <button
                    onClick={handleBookAppointment}
                    disabled={isLoading}
                    className="w-full bg-[#1a1a2e] text-white rounded-xl py-4 font-bold text-lg hover:bg-gray-800 transition-colors shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center mt-8"
                  >
                    {isLoading ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Securing your slot...</span>
                      </div>
                    ) : (
                      'Confirm Appointment'
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      
      {/* Global styles for scrollbar */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #d1d5db; 
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #9ca3af; 
        }
      `}} />
    </div>
  );
}
