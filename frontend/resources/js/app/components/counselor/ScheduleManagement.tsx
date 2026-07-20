import { useEffect, useState } from 'react';
import { Calendar, Clock, Plus, Trash2, Save, Repeat2 } from 'lucide-react';
import { CounselorSchedule } from '../../types';
import { getDefaultCounselorSchedule, getNextScheduleUpdate } from '../../utils/scheduling';

interface ScheduleManagementProps {
  counselorId: string;
  counselorName: string;
  currentSchedule?: CounselorSchedule;
  onSaveSchedule: (schedule: CounselorSchedule) => void;
  compact?: boolean;
  saving?: boolean;
}

interface TimeSlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

export function ScheduleManagement({
  counselorId,
  counselorName,
  currentSchedule,
  onSaveSchedule,
  compact = false,
  saving = false,
}: ScheduleManagementProps) {
  const [slots, setSlots] = useState<TimeSlot[]>(() => {
    if (currentSchedule?.availableSlots?.length) {
      return currentSchedule.availableSlots;
    }
    return getDefaultCounselorSchedule(counselorId, counselorName).availableSlots;
  });

  const [newSlot, setNewSlot] = useState<TimeSlot>({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 60,
  });

  useEffect(() => {
    if (currentSchedule?.availableSlots?.length) {
      setSlots(currentSchedule.availableSlots);
      return;
    }

    setSlots(getDefaultCounselorSchedule(counselorId, counselorName).availableSlots);
  }, [counselorId, counselorName, currentSchedule?.availableSlots]);

  const handleAddSlot = () => {
    setSlots([...slots, { ...newSlot }]);
  };

  const handleRemoveSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleApplyDefaultSchedule = () => {
    setSlots(getDefaultCounselorSchedule(counselorId, counselorName).availableSlots);
  };

  const handleSave = () => {
    const today = new Date();
    const nextUpdate = getNextScheduleUpdate(today);
    const weekEnd = new Date(nextUpdate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const schedule: CounselorSchedule = {
      counselorId,
      counselorName,
      weekStartDate: nextUpdate,
      weekEndDate: weekEnd,
      availableSlots: slots,
      createdAt: new Date(),
    };

    onSaveSchedule(schedule);
  };

  const nextUpdate = getNextScheduleUpdate();

  return (
    <div className={compact ? '' : 'bg-card rounded-xl p-6 border border-border'}>
      {!compact && (
      <div className="mb-6">
        <h2 className="text-foreground mb-2">Schedule Management</h2>
        <p className="text-muted-foreground">
          Set your available time slots. Schedules are updated every 6 days on Monday.
        </p>
        <div className="mt-3 flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-primary" />
          <span className="text-foreground">
            Next schedule update: <strong>{nextUpdate.toLocaleDateString()}</strong>
          </span>
        </div>
      </div>
      )}

      {/* Add New Slot */}
      <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
        <h3 className="text-foreground mb-4">Add Time Slot</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Day</label>
            <select
              value={newSlot.dayOfWeek}
              onChange={(e) => setNewSlot({ ...newSlot, dayOfWeek: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
            >
              {DAYS_OF_WEEK.map(day => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Start Time</label>
            <input
              type="time"
              value={newSlot.startTime}
              onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">End Time</label>
            <input
              type="time"
              value={newSlot.endTime}
              onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
            />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Session Duration (min)</label>
            <select
              value={newSlot.slotDuration}
              onChange={(e) => setNewSlot({ ...newSlot, slotDuration: Number(e.target.value) })}
              className="w-full px-3 py-2 rounded-lg border border-border bg-input-background"
            >
              <option value={30}>30 minutes</option>
              <option value={45}>45 minutes</option>
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
            </select>
          </div>
        </div>

        <button
          onClick={handleAddSlot}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Slot
        </button>
      </div>

      {/* Current Slots */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h3 className="text-foreground">Current Schedule</h3>
          <button
            onClick={handleApplyDefaultSchedule}
            className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-border bg-background hover:bg-accent/30 transition-all"
          >
            <Repeat2 className="w-4 h-4" />
            Use default office hours
          </button>
        </div>
        {slots.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No time slots added yet. Add your first slot above.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/20 text-muted-foreground">
                <tr>
                  <th className="px-3 py-3 text-left">Day</th>
                  <th className="px-3 py-3 text-left">Hours</th>
                  <th className="px-3 py-3 text-left">Session Length</th>
                  <th className="px-3 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {slots
                  .slice()
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((slot, index) => (
                    <tr key={`${slot.dayOfWeek}-${slot.startTime}-${slot.endTime}-${index}`} className="border-t border-border bg-background/50">
                      <td className="px-3 py-3 text-foreground font-medium">
                        {DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 shrink-0" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-muted-foreground">{slot.slotDuration} min</td>
                      <td className="px-3 py-3 text-right">
                        <button
                          onClick={() => handleRemoveSlot(index)}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={slots.length === 0 || saving}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save Schedule'}
        </button>
      </div>
    </div>
  );
}
