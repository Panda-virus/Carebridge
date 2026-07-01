<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class CareBridgeAiService
{
    public function baseUrl(): string
    {
        return rtrim((string) config('services.carebridge_ai.url', 'http://127.0.0.1:8100'), '/');
    }

    public function isAvailable(): bool
    {
        if (! config('services.carebridge_ai.enabled', true)) {
            return false;
        }

        try {
            $response = Http::timeout(3)->get($this->baseUrl().'/health');

            return $response->successful();
        } catch (\Throwable) {
            return false;
        }
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<string, mixed>
     */
    public function analyze(array $messages, ?string $serviceType = null): array
    {
        $payload = ['messages' => $messages];
        if ($serviceType) {
            $payload['service_type'] = $serviceType;
        }

        $response = Http::timeout((int) config('services.carebridge_ai.timeout', 30))
            ->post($this->baseUrl().'/analyze', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('CareBridge AI analyze error: '.$response->body());
        }

        return $response->json();
    }

    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     * @return array<string, mixed>
     */
    public function conversation(array $messages, ?array $context = null): array
    {
        $payload = ['messages' => $messages];
        if ($context) {
            $payload['context'] = $context;
        }

        $response = Http::timeout((int) config('services.carebridge_ai.timeout', 30))
            ->post($this->baseUrl().'/conversation', $payload);

        if (! $response->successful()) {
            throw new RuntimeException('CareBridge AI conversation error: '.$response->body());
        }

        return $response->json();
    }
}
