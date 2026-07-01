import { useEffect, useState } from 'react';
import { CalendarClock, X } from 'lucide-react';
import { CounselorSchedule } from '../../types';
import { ScheduleManagement } from '../counselor/ScheduleManagement';

interface FirstLoginScheduleModalProps {
  counselorId: string;
  counselorName: string;
  currentSchedule?: CounselorSchedule & { id?: number };
  onSaveSchedule: (schedule: CounselorSchedule & { id?: number }) => Promise<void> | void;
  onComplete: () => void;
  required?: boolean;
}

export function FirstLoginScheduleModal({
  counselorId,
  counselorName,
  currentSchedule,
  onSaveSchedule,
  onComplete,
  required = true,
}: FirstLoginScheduleModalProps) {
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = async (schedule: CounselorSchedule) => {
    setSaving(true);
    await onSaveSchedule({ ...schedule, id: currentSchedule?.id });
    setSaving(false);
    onComplete();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <CalendarClock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-foreground font-medium">Set Your Working Schedule</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Welcome! Before students can book counselling, please provide your available days and times.
              </p>
            </div>
          </div>
          {!required && (
            <button onClick={onComplete} className="text-muted-foreground hover:text-foreground p-1">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-6 text-sm text-muted-foreground">
            Students will only see time slots you define here. Once a student books a slot, it is hidden from others
            unless that student declines the proposed schedule.
          </div>

          <ScheduleManagement
            counselorId={counselorId}
            counselorName={counselorName}
            currentSchedule={currentSchedule}
            onSaveSchedule={handleSave}
            saving={saving}
            compact
          />
        </div>
      </div>
    </div>
  );
}
