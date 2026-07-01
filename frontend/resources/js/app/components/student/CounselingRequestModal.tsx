import { useEffect, useMemo, useState } from 'react';
import { X, Calendar, Clock, MapPin, User, FileText, Layers } from 'lucide-react';
import { CounselingRequest, CounselorSchedule } from '../../types';
import { categorizeCounselingRequest } from '../../utils/categorization';
import {
  autoScheduleAppointment,
  formatSlotLabel,
  getUpcomingAvailableSlots,
  TimeSlot,
} from '../../utils/scheduling';

const SESSION_LOCATION = "Dean's Office";

interface CounselingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: string;
  userName: string;
  studentEmail: string;
  counselorSchedule: CounselorSchedule;
  existingRequests: CounselingRequest[];
  onSubmit: (request: Omit<CounselingRequest, 'id' | 'status' | 'createdAt'>) => void;
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function deriveSessionCount(description: string): 6 | 8 {
  if (!description.trim()) return 6;
  const analysis = categorizeCounselingRequest(description);
  if (['immediate', 'critical', 'high'].includes(analysis.urgency)) return 8;
  if (['suicide', 'self_harm', 'ptsd', 'depression', 'addiction', 'eating_disorder'].includes(analysis.category)) {
    return 8;
  }
  return 6;
}

export function CounselingRequestModal({
  isOpen,
  onClose,
  studentId,
  userName,
  studentEmail,
  counselorSchedule,
  existingRequests,
  onSubmit,
}: CounselingRequestModalProps) {
  const [description, setDescription] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableSlots = useMemo(
    () => getUpcomingAvailableSlots(counselorSchedule, existingRequests),
    [counselorSchedule, existingRequests]
  );

  const counselorName = counselorSchedule.counselorName || 'University Counsellor';
  const sessionCount = deriveSessionCount(description);
  const categorization = useMemo(
    () => (description.trim() ? categorizeCounselingRequest(description) : null),
    [description]
  );

  useEffect(() => {
    if (!isOpen) return;
    setDescription('');
    setIsRescheduling(false);
    setError(null);
    const suggested = autoScheduleAppointment(availableSlots, 'medium', 'any');
    setSelectedSlot(suggested);
  }, [isOpen, availableSlots]);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (!description.trim()) {
      setError('Please write a short description of what you need support with.');
      return;
    }
    if (!selectedSlot) {
      setError('No available session times right now. Please try again later.');
      return;
    }

    onSubmit({
      studentId,
      studentName: userName,
      studentEmail,
      concern: description.trim(),
      category: categorization?.category,
      urgencyLevel: categorization?.urgency ?? 'medium',
      requiresImmediateAttention: categorization?.requiresImmediateAttention ?? false,
      matchedKeywords: categorization?.matchedKeywords ?? [],
      preferredTime: 'any',
      counselorId: counselorSchedule.counselorId || undefined,
      counselorName,
      totalSessions: sessionCount,
      autoScheduleProposal: {
        proposedDate: selectedSlot.date,
        proposedTime: selectedSlot.time,
        studentApproved: true,
        counselorApproved: false,
      },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-card w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[95dvh] flex flex-col">
        <div className="flex items-start justify-between gap-3 px-4 sm:px-6 py-4 border-b border-border bg-primary/5 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-foreground">Request Counselling</h2>
            <p className="text-sm text-muted-foreground">Review your proposed session and accept or reschedule</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
          {isRescheduling ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Choose a time from the counsellor&apos;s available slots:</p>
              {availableSlots.length === 0 ? (
                <p className="text-sm text-destructive">No open slots are available at the moment.</p>
              ) : (
                <div className="grid gap-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => {
                    const label = formatSlotLabel(slot.date, slot.time);
                    const isSelected =
                      selectedSlot &&
                      selectedSlot.date.toDateString() === slot.date.toDateString() &&
                      selectedSlot.time === slot.time;

                    return (
                      <button
                        key={`${slot.date.toISOString()}-${slot.time}`}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setIsRescheduling(false);
                          setError(null);
                        }}
                        className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-primary bg-primary/10 text-foreground'
                            : 'border-border hover:border-primary/50 hover:bg-accent/50'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              <button
                type="button"
                onClick={() => setIsRescheduling(false)}
                className="text-sm text-primary hover:underline"
              >
                Back to summary
              </button>
            </div>
          ) : (
            <>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    Date
                  </div>
                  <p className="text-foreground font-medium">
                    {selectedSlot ? formatDisplayDate(selectedSlot.date) : '—'}
                  </p>
                </div>
                <div className="rounded-xl border border-border p-4 bg-muted/30">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    Time
                  </div>
                  <p className="text-foreground font-medium">{selectedSlot?.time ?? '—'}</p>
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                  <FileText className="w-4 h-4" />
                  Short description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setError(null);
                  }}
                  rows={4}
                  placeholder="Briefly describe what you need support with (e.g. anxiety, addiction, academic stress)..."
                  className="w-full px-4 py-3 rounded-lg border border-border bg-input-background focus:outline-none focus:ring-2 focus:ring-ring resize-none text-sm"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <User className="w-4 h-4" />
                    Counsellor
                  </div>
                  <p className="text-foreground font-medium">{counselorName}</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Layers className="w-4 h-4" />
                    Number of sessions
                  </div>
                  <p className="text-foreground font-medium">{sessionCount} sessions</p>
                </div>
              </div>

              <div className="rounded-xl border border-border p-4">
                <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                  <MapPin className="w-4 h-4" />
                  Location
                </div>
                <p className="text-foreground font-medium">{SESSION_LOCATION}</p>
              </div>

              {error && (
                <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}
            </>
          )}
        </div>

        {!isRescheduling && (
          <div className="px-4 sm:px-6 py-4 border-t border-border bg-muted/20 flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsRescheduling(true);
                setError(null);
              }}
              className="flex-1 px-4 py-3 rounded-lg border border-border bg-card text-foreground hover:bg-accent transition-colors font-medium"
            >
              Reschedule
            </button>
            <button
              type="button"
              onClick={handleAccept}
              className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium shadow-sm"
            >
              Accept
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
