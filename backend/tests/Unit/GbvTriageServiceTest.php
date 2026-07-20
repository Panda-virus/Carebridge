<?php

namespace Tests\Unit;

use App\Services\GbvTriageService;
use PHPUnit\Framework\TestCase;

class GbvTriageServiceTest extends TestCase
{
    public function test_sexually_harassed_phrase_is_classified_as_sexual_harassment(): void
    {
        $service = new GbvTriageService();

        $result = $service->triage([
            'description' => 'Someone sexually harassed me in class.',
            'category' => 'general',
            'urgency_level' => 'medium',
        ]);

        $this->assertSame('sexual_harassment_gbv', $result['category']);
        $this->assertSame('sexual_harassment', $result['detailed_category']);
    }
}
