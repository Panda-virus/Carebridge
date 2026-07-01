<?php

namespace Tests\Unit;

use App\Services\AppointmentSchedulingService;
use PHPUnit\Framework\TestCase;

class AppointmentSchedulingServiceTest extends TestCase
{
    public function test_it_finds_the_next_available_slot_after_the_current_session(): void
    {
        $service = new AppointmentSchedulingService();

        $schedule = [
            'available_slots' => [
                ['dayOfWeek' => 3, 'startTime' => '09:00', 'endTime' => '10:00', 'slotDuration' => 60],
                ['dayOfWeek' => 5, 'startTime' => '09:00', 'endTime' => '10:00', 'slotDuration' => 60],
            ],
        ];

        $conflictingRequests = [[
            'scheduled_date' => '2026-07-03',
            'scheduled_time' => '09:00',
        ]];

        $nextSlot = $service->findNextAvailableSlotAfter(
            $schedule,
            '2026-07-01',
            '09:00',
            $conflictingRequests
        );

        $this->assertNotNull($nextSlot);
        $this->assertSame('2026-07-08', $nextSlot['date']);
        $this->assertSame('09:00', $nextSlot['time']);
    }
}
