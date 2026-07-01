<?php

namespace App\Services;

use App\Models\ChatConversation;

class ChatFollowUpService
{
    public function saveProgress(array $data): ChatConversation
    {
        $token = $data['session_token'];
        $conversation = ChatConversation::firstOrNew(['session_token' => $token]);

        $conversation->fill([
            'user_id' => $data['user_id'] ?? $conversation->user_id,
            'stage' => $data['stage'] ?? $conversation->stage ?? 'welcome',
            'collected_data' => $data['collected_data'] ?? $conversation->collected_data,
            'messages' => $data['messages'] ?? $conversation->messages,
            'service_type' => $data['service_type'] ?? $conversation->service_type,
            'submitted' => $data['submitted'] ?? $conversation->submitted ?? false,
            'last_activity_at' => now(),
        ]);

        if (! $conversation->follow_up_due_at && ! $conversation->submitted) {
            $conversation->follow_up_due_at = now()->addHours((int) config('carebridge.chat_follow_up_hours', 24));
        }

        if ($conversation->submitted) {
            $conversation->follow_up_due_at = null;
            $conversation->follow_up_sent = false;
        }

        $conversation->save();

        return $conversation;
    }

    public function sendDueFollowUps(): int
    {
        $sent = 0;

        ChatConversation::with('user')
            ->where('submitted', false)
            ->where('follow_up_sent', false)
            ->whereNotNull('follow_up_due_at')
            ->where('follow_up_due_at', '<=', now())
            ->whereNotNull('user_id')
            ->chunkById(50, function ($conversations) use (&$sent) {
                foreach ($conversations as $conversation) {
                    if (! $conversation->user?->email) {
                        continue;
                    }

                    NotificationService::notifyChatFollowUp($conversation);
                    $conversation->update(['follow_up_sent' => true]);
                    $sent++;
                }
            });

        return $sent;
    }
}
