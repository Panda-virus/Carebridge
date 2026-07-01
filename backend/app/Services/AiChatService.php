<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiChatService
{
  /**
   * Send a chat completion request to a configured OpenAI-compatible API.
   *
   * Configure in .env:
   *   AI_CHAT_ENABLED=true
   *   AI_CHAT_API_URL=https://api.openai.com/v1/chat/completions
   *   AI_CHAT_API_KEY=sk-...
   *   AI_CHAT_MODEL=gpt-4o-mini
   *
   * For local Ollama:
   *   AI_CHAT_API_URL=http://127.0.0.1:11434/v1/chat/completions
   *   AI_CHAT_API_KEY=ollama
   *   AI_CHAT_MODEL=llama3.2
   */
  public function isEnabled(): bool
  {
    return (bool) config('services.ai_chat.enabled', false)
      && ! empty(config('services.ai_chat.api_key'))
      && ! empty(config('services.ai_chat.api_url'));
  }

  /**
   * @param  array<int, array{role: string, content: string}>  $messages
   * @return array{reply: string, model: string, provider: string}
   */
  public function chat(array $messages, ?string $systemPrompt = null): array
  {
    if (! $this->isEnabled()) {
      throw new RuntimeException('AI chat is not configured. Set AI_CHAT_ENABLED=true and API credentials in .env.');
    }

    $payloadMessages = [];
    if ($systemPrompt) {
      $payloadMessages[] = ['role' => 'system', 'content' => $systemPrompt];
    }
    foreach ($messages as $message) {
      if (! isset($message['role'], $message['content'])) {
        continue;
      }
      $payloadMessages[] = [
        'role' => $message['role'],
        'content' => $message['content'],
      ];
    }

    $response = Http::withToken(config('services.ai_chat.api_key'))
      ->timeout((int) config('services.ai_chat.timeout', 60))
      ->post(config('services.ai_chat.api_url'), [
        'model' => config('services.ai_chat.model', 'gpt-4o-mini'),
        'messages' => $payloadMessages,
        'temperature' => (float) config('services.ai_chat.temperature', 0.4),
      ]);

    if (! $response->successful()) {
      throw new RuntimeException('AI provider error: '.$response->body());
    }

    $json = $response->json();
    $reply = $json['choices'][0]['message']['content'] ?? null;
    if (! is_string($reply) || trim($reply) === '') {
      throw new RuntimeException('AI provider returned an empty response.');
    }

    return [
      'reply' => trim($reply),
      'model' => (string) ($json['model'] ?? config('services.ai_chat.model')),
      'provider' => str_contains((string) config('services.ai_chat.api_url'), '8100')
        ? 'carebridge'
        : 'openai_compatible',
    ];
  }
}
