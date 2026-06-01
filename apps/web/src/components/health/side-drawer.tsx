'use client';

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface SideDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: string;
}

export function SideDrawer({ open, onClose, title, children, width = 'w-[480px]' }: SideDrawerProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      document.addEventListener('keydown', handleEsc);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed top-0 right-0 h-full bg-white z-50 shadow-2xl transition-transform duration-300 flex flex-col ${width} ${open ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-5 border-b border-[#E5E7EB]">
          <h2 className="text-lg font-semibold text-[#1A1A2E]">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#F4F6F9] transition-colors"
          >
            <X className="w-5 h-5 text-[#6B7280]" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
}