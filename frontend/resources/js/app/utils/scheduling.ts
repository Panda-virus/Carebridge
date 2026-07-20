import { CounselingRequest, CounselorSchedule, UrgencyLevel } from '../types';

export interface TimeSlot {
  date: Date;
  time: string;
  priority: number;
}

/** Normalize time strings like "9:00 AM" to "09:00" for comparison */
function normalizeTime(time: string): string {
  const trimmed = time.trim();
  const ampm = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampm) {
    let hour = parseInt(ampm[1], 10);
    const minute = ampm[2];
    if (ampm[3].toUpperCase() === 'PM' && hour < 12) hour += 12;
    if (ampm[3].toUpperCase() === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }
  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
  }
  return trimmed;
}

export function slotKey(date: Date, time: string): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return `${d.toISOString().split('T')[0]}-${normalizeTime(time)}`;
}

function isLunchBreak(time: string): boolean {
  const [hour, minute] = time.split(':').map(Number);
  return hour >= 12 && hour < 14;
}

/** A request holds a slot unless declined/rejected — freed slots become available again */
function requestHoldsSlot(request: CounselingRequest): boolean {
  if (['rejected', 'approval_rejected', 'completed', 'referred'].includes(request.status)) {
    return false;
  }
  if (request.autoScheduleProposal?.studentRejectedAt || request.autoScheduleProposal?.counselorRejectedAt) {
    return false;
  }
  return ['pending_approval', 'student_approved', 'counselor_approved', 'scheduled', 'in_progress', 'pending_review'].includes(
    request.status
  );
}

export function formatSlotLabel(date: Date, time: string): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const d = new Date(date);
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} at ${time}`;
}

export function getDefaultCounselorSchedule(
  counselorId = '',
  counselorName = 'University Counseling Team'
): CounselorSchedule {
  const normalizedName = (counselorName || '').toLowerCase();
  const weekStart = getNextScheduleUpdate(new Date());
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const slots = normalizedName.includes('chaplain')
    ? [
        { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
        { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
      ]
    : normalizedName.includes('psychotherapist') || normalizedName.includes('nurse')
      ? [
          { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
        ]
      : [
          { dayOfWeek: 1, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 2, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 3, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 4, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
          { dayOfWeek: 5, startTime: '08:00', endTime: '16:00', slotDuration: 60 },
        ];

  return {
    counselorId,
    counselorName,
    weekStartDate: weekStart,
    weekEndDate: weekEnd,
    availableSlots: slots,
    createdAt: new Date(),
  };
}

export function filterBookedSlots(
  slots: TimeSlot[],
  requests: CounselingRequest[]
): TimeSlot[] {
  const booked = new Set<string>();

  for (const request of requests) {
    if (!requestHoldsSlot(request)) continue;

    if (request.scheduledDate && request.scheduledTime) {
      booked.add(slotKey(request.scheduledDate, request.scheduledTime));
    }
    if (request.autoScheduleProposal?.proposedDate && request.autoScheduleProposal?.proposedTime) {
      booked.add(
        slotKey(
          request.autoScheduleProposal.proposedDate,
          request.autoScheduleProposal.proposedTime
        )
      );
    }
  }

  return slots.filter((slot) => !booked.has(slotKey(slot.date, slot.time)));
}

export function getUpcomingAvailableSlots(
  schedule: CounselorSchedule,
  existingRequests: CounselingRequest[]
): TimeSlot[] {
  const all = generateAvailableSlots(schedule);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date();

  return filterBookedSlots(all, existingRequests).filter((slot) => {
    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() < today.getTime()) {
      return false;
    }

    if (slotDate.getTime() === today.getTime()) {
      const [hour, minute] = slot.time.split(':').map(Number);
      return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
    }

    return true;
  });
}

export function getNextAvailableSlotAfter(
  schedule: CounselorSchedule,
  existingRequests: CounselingRequest[],
  afterDate: Date,
  afterTime: string,
  excludeRequestId?: string
): TimeSlot | null {
  const all = generateAvailableSlots(schedule);
  const booked = new Set<string>();

  for (const request of existingRequests) {
    if (excludeRequestId && request.id === excludeRequestId) {
      continue;
    }

    if (!requestHoldsSlot(request)) {
      continue;
    }

    if (request.scheduledDate && request.scheduledTime) {
      booked.add(slotKey(request.scheduledDate, request.scheduledTime));
    }
    if (request.autoScheduleProposal?.proposedDate && request.autoScheduleProposal?.proposedTime) {
      booked.add(slotKey(request.autoScheduleProposal.proposedDate, request.autoScheduleProposal.proposedTime));
    }
  }

  const targetDate = new Date(afterDate);
  targetDate.setHours(0, 0, 0, 0);
  const targetTime = normalizeTime(afterTime);

  const candidates = all.filter((slot) => {
    const key = slotKey(slot.date, slot.time);
    if (booked.has(key)) {
      return false;
    }

    const slotDate = new Date(slot.date);
    slotDate.setHours(0, 0, 0, 0);

    if (slotDate.getTime() < targetDate.getTime()) {
      return false;
    }

    if (slotDate.getTime() === targetDate.getTime()) {
      return normalizeTime(slot.time) > targetTime;
    }

    return true;
  });

  return candidates.sort((a, b) => {
    if (a.date.getTime() !== b.date.getTime()) {
      return a.date.getTime() - b.date.getTime();
    }
    return normalizeTime(a.time).localeCompare(normalizeTime(b.time));
  })[0] ?? null;
}

/**
 * Generate available time slots from counselor schedule
 */
export function generateAvailableSlots(
  schedule: CounselorSchedule,
  startDate: Date = new Date()
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const currentDate = new Date(startDate);
  currentDate.setHours(0, 0, 0, 0);

  // Generate slots for next 14 days
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const checkDate = new Date(currentDate);
    checkDate.setDate(checkDate.getDate() + dayOffset);
    const dayOfWeek = checkDate.getDay();

    // Find matching schedule slots for this day
    const daySlots = schedule.availableSlots.filter(
      slot => slot.dayOfWeek === dayOfWeek
    );

    for (const daySlot of daySlots) {
      const [startHour, startMin] = daySlot.startTime.split(':').map(Number);
      const [endHour, endMin] = daySlot.endTime.split(':').map(Number);

      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      // Generate slots based on duration
      for (let slotStart = startMinutes; slotStart < endMinutes; slotStart += daySlot.slotDuration) {
        const slotHour = Math.floor(slotStart / 60);
        const slotMin = slotStart % 60;
        const timeString = `${slotHour.toString().padStart(2, '0')}:${slotMin.toString().padStart(2, '0')}`;

        if (isLunchBreak(timeString)) {
          continue;
        }

        slots.push({
          date: new Date(checkDate),
          time: timeString,
          priority: dayOffset // Earlier dates have lower priority number (higher actual priority)
        });
      }
    }
  }

  return slots;
}

/**
 * Auto-schedule based on urgency and available slots
 */
export function autoScheduleAppointment(
  availableSlots: TimeSlot[],
  urgencyLevel: UrgencyLevel,
  preferredTime?: string
): TimeSlot | null {
  const safeSlots = availableSlots.filter(slot => !isLunchBreak(slot.time));
  if (safeSlots.length === 0) return null;
  
  let filteredSlots = [...safeSlots];

  // For immediate/critical urgency, get earliest available slot
  if (urgencyLevel === 'immediate' || urgencyLevel === 'critical') {
    return filteredSlots.sort((a, b) => a.priority - b.priority)[0];
  }

  // For high urgency, get slot within next 3 days
  if (urgencyLevel === 'high') {
    filteredSlots = filteredSlots.filter(slot => slot.priority <= 3);
  }

  // Apply preferred time filter if specified
  if (preferredTime) {
    const timePreference = getTimePreference(preferredTime);
    const preferredSlots = filteredSlots.filter(slot => {
      const hour = parseInt(slot.time.split(':')[0]);
      return hour >= timePreference.start && hour < timePreference.end;
    });

    if (preferredSlots.length > 0) {
      filteredSlots = preferredSlots;
    }
  }

  // Return earliest available from filtered slots
  return filteredSlots.sort((a, b) => a.priority - b.priority)[0];
}

/**
 * Re-schedule by moving other appointments when urgent case comes in
 */
export function rescheduleForUrgent(
  urgentSlot: TimeSlot,
  existingAppointments: Array<{ id: string; date: Date; time: string; urgency: UrgencyLevel }>,
  availableSlots: TimeSlot[]
): Map<string, TimeSlot> {
  const rescheduledMap = new Map<string, TimeSlot>();

  // Find appointments that conflict with urgent slot
  const conflictingAppointments = existingAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    aptDate.setHours(0, 0, 0, 0);
    const urgentDate = new Date(urgentSlot.date);
    urgentDate.setHours(0, 0, 0, 0);

    return (
      aptDate.getTime() === urgentDate.getTime() &&
      apt.time === urgentSlot.time &&
      apt.urgency !== 'immediate' &&
      apt.urgency !== 'critical'
    );
  });

  // Re-assign each conflicting appointment to next available slot
  const usedSlots = new Set<string>();
  usedSlots.add(`${urgentSlot.date.toISOString()}-${urgentSlot.time}`);

  for (const apt of conflictingAppointments) {
    const nextSlot = availableSlots.find(slot => {
      const slotKey = `${slot.date.toISOString()}-${slot.time}`;
      return !usedSlots.has(slotKey);
    });

    if (nextSlot) {
      rescheduledMap.set(apt.id, nextSlot);
      usedSlots.add(`${nextSlot.date.toISOString()}-${nextSlot.time}`);
    }
  }

  return rescheduledMap;
}

/**
 * Get time preference range from string
 */
function getTimePreference(preferredTime: string): { start: number; end: number } {
  switch (preferredTime.toLowerCase()) {
    case 'morning':
      return { start: 8, end: 12 };
    case 'afternoon':
      return { start: 12, end: 17 };
    case 'evening':
      return { start: 17, end: 20 };
    default:
      return { start: 0, end: 24 };
  }
}

/**
 * Check if it's time to update schedule (every 6 days, on Monday)
 */
export function shouldUpdateSchedule(lastUpdate: Date): boolean {
  const now = new Date();
  const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));

  // Check if 6 days have passed AND today is Monday (1)
  return daysSinceUpdate >= 6 && now.getDay() === 1;
}

/**
 * Get next Monday for schedule update
 */
export function getNextScheduleUpdate(currentDate: Date = new Date()): Date {
  const next = new Date(currentDate);
  const daysUntilMonday = (8 - next.getDay()) % 7 || 7;
  next.setDate(next.getDate() + daysUntilMonday);
  next.setHours(0, 0, 0, 0);
  return next;
}
