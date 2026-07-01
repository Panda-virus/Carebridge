<?php

namespace App\Services;

use App\Models\CounselingRequest;
use App\Models\CounselorSchedule;
use App\Models\User;
use Carbon\Carbon;

class AppointmentSchedulingService
{
    /**
     * Auto-propose an appointment slot for a new counseling request.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function autoSchedule(array $data): array
    {
        if (! empty($data['proposed_date']) && ! empty($data['proposed_time'])) {
            return $data;
        }

        $counselorId = $data['counselor_id'] ?? $this->defaultCounselorId();
        if (! $counselorId) {
            return $data;
        }

        $schedule = CounselorSchedule::where('counselor_id', $counselorId)
            ->orderByDesc('week_start_date')
            ->first();

        if (! $schedule || empty($schedule->available_slots)) {
            return $data;
        }

        $urgency = $data['urgency_level'] ?? 'medium';
        $preferredTime = $data['preferred_time'] ?? null;
        $slots = $this->generateAvailableSlots($schedule->available_slots);
        $booked = $this->getBookedSlotKeys();
        $available = array_values(array_filter($slots, fn (array $slot) => ! in_array($slot['key'], $booked, true)));

        $chosen = $this->pickSlot($available, $urgency, $preferredTime);
        if (! $chosen) {
            return $data;
        }

        return array_merge($data, [
            'counselor_id' => $counselorId,
            'proposed_date' => $chosen['date'],
            'proposed_time' => $chosen['time'],
            'student_approved' => $data['student_approved'] ?? true,
            'status' => $data['status'] ?? 'pending_approval',
        ]);
    }

    public function defaultCounselorId(): ?int
    {
        $counselor = User::where('role', 'counselor')->orderBy('id')->first();

        return $counselor?->id;
    }

    public function scheduleNextSession(CounselingRequest $request): ?array
    {
        $counselorId = $request->counselor_id ?? $this->defaultCounselorId();
        if (! $counselorId) {
            return null;
        }

        $schedule = CounselorSchedule::where('counselor_id', $counselorId)
            ->orderByDesc('week_start_date')
            ->first();

        if (! $schedule || empty($schedule->available_slots)) {
            return null;
        }

        $conflictingRequests = CounselingRequest::whereIn('status', [
            'pending_review', 'pending_approval', 'student_approved',
            'counselor_approved', 'scheduled', 'in_progress',
        ])->where('id', '!=', $request->id)->get()->toArray();

        return $this->findNextAvailableSlotAfter(
            ['available_slots' => $schedule->available_slots],
            $request->scheduled_date ?? $request->proposed_date ?? Carbon::today()->toDateString(),
            $request->scheduled_time ?? $request->proposed_time,
            $conflictingRequests
        );
    }

    /**
     * @param  array<string, mixed>  $schedule
     * @param  array<int, array<string, mixed>>  $conflictingRequests
     * @return array{date: string, time: string, priority: int, key: string}|null
     */
    public function findNextAvailableSlotAfter(array $schedule, string $fromDate, ?string $fromTime, array $conflictingRequests = []): ?array
    {
        $availableSlots = $this->generateAvailableSlots($schedule['available_slots'] ?? []);
        $bookedKeys = $this->getBookedSlotKeysFromRequests($conflictingRequests);
        $fromDate = Carbon::parse($fromDate)->toDateString();
        $fromTime = $fromTime ? $this->normalizeTime($fromTime) : null;

        foreach ($availableSlots as $slot) {
            if ($slot['date'] < $fromDate) {
                continue;
            }

            if ($slot['date'] === $fromDate && $fromTime && $slot['time'] <= $fromTime) {
                continue;
            }

            if (in_array($slot['key'], $bookedKeys, true)) {
                continue;
            }

            return $slot;
        }

        return null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $availableSlots
     * @return array{date: string, time: string, key: string}|null
     */
    private function pickSlot(array $availableSlots, string $urgency, ?string $preferredTime): ?array
    {
        if ($availableSlots === []) {
            return null;
        }

        usort($availableSlots, fn ($a, $b) => $a['priority'] <=> $b['priority']);

        if (in_array($urgency, ['immediate', 'critical'], true)) {
            return $availableSlots[0];
        }

        $filtered = $availableSlots;
        if ($urgency === 'high') {
            $filtered = array_values(array_filter($filtered, fn ($s) => $s['priority'] <= 3));
            if ($filtered === []) {
                $filtered = $availableSlots;
            }
        }

        if ($preferredTime) {
            $range = $this->timePreferenceRange($preferredTime);
            $preferred = array_values(array_filter($filtered, function ($slot) use ($range) {
                $hour = (int) explode(':', $slot['time'])[0];

                return $hour >= $range['start'] && $hour < $range['end'];
            }));
            if ($preferred !== []) {
                $filtered = $preferred;
            }
        }

        return $filtered[0] ?? null;
    }

    /**
     * @param  array<int, array<string, mixed>>  $daySlots
     * @return array<int, array{date: string, time: string, priority: int, key: string}>
     */
    private function generateAvailableSlots(array $daySlots): array
    {
        $slots = [];
        $start = Carbon::today();

        for ($dayOffset = 0; $dayOffset < 14; $dayOffset++) {
            $checkDate = $start->copy()->addDays($dayOffset);
            $dayOfWeek = $checkDate->dayOfWeek;

            foreach ($daySlots as $daySlot) {
                if ((int) ($daySlot['dayOfWeek'] ?? -1) !== $dayOfWeek) {
                    continue;
                }

                $startParts = explode(':', $daySlot['startTime'] ?? '09:00');
                $endParts = explode(':', $daySlot['endTime'] ?? '17:00');
                $duration = (int) ($daySlot['slotDuration'] ?? 60);

                $startMinutes = ((int) $startParts[0] * 60) + (int) ($startParts[1] ?? 0);
                $endMinutes = ((int) $endParts[0] * 60) + (int) ($endParts[1] ?? 0);

                for ($slotStart = $startMinutes; $slotStart < $endMinutes; $slotStart += $duration) {
                    $hour = intdiv($slotStart, 60);
                    $minute = $slotStart % 60;
                    $time = sprintf('%02d:%02d', $hour, $minute);
                    $date = $checkDate->toDateString();

                    if ($checkDate->isToday()) {
                        $nowMinutes = now()->hour * 60 + now()->minute;
                        if ($slotStart <= $nowMinutes) {
                            continue;
                        }
                    }

                    $slots[] = [
                        'date' => $date,
                        'time' => $time,
                        'priority' => $dayOffset,
                        'key' => "{$date}-{$time}",
                    ];
                }
            }
        }

        return $slots;
    }

    /**
     * @return string[]
     */
    private function getBookedSlotKeys(): array
    {
        $activeStatuses = [
            'pending_review', 'pending_approval', 'student_approved',
            'counselor_approved', 'scheduled', 'in_progress',
        ];

        $requests = CounselingRequest::whereIn('status', $activeStatuses)->get()->toArray();

        return $this->getBookedSlotKeysFromRequests($requests);
    }

    /**
     * @param  array<int, array<string, mixed>>  $requests
     * @return string[]
     */
    private function getBookedSlotKeysFromRequests(array $requests): array
    {
        $keys = [];

        foreach ($requests as $request) {
            $scheduledDate = $request['scheduled_date'] ?? null;
            $scheduledTime = $request['scheduled_time'] ?? null;
            $proposedDate = $request['proposed_date'] ?? null;
            $proposedTime = $request['proposed_time'] ?? null;

            if ($scheduledDate && $scheduledTime) {
                $keys[] = Carbon::parse($scheduledDate)->toDateString().'-'.$this->normalizeTime($scheduledTime);
            }
            if ($proposedDate && $proposedTime) {
                $keys[] = Carbon::parse($proposedDate)->toDateString().'-'.$this->normalizeTime($proposedTime);
            }
        }

        return array_values(array_unique($keys));
    }

    private function normalizeTime(string $time): string
    {
        $parts = explode(':', trim($time));

        return sprintf('%02d:%02d', (int) $parts[0], (int) ($parts[1] ?? 0));
    }

    /**
     * @return array{start: int, end: int}
     */
    private function timePreferenceRange(string $preferredTime): array
    {
        return match (strtolower($preferredTime)) {
            'morning' => ['start' => 8, 'end' => 12],
            'afternoon' => ['start' => 12, 'end' => 17],
            'evening' => ['start' => 17, 'end' => 20],
            default => ['start' => 0, 'end' => 24],
        };
    }
}
