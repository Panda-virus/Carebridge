<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CareBridgeNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly string $headline,
        public readonly string $body,
        public readonly ?string $actionUrl = null,
        public readonly ?string $actionLabel = null,
        public readonly string $priority = 'normal',
    ) {}

    public function envelope(): Envelope
    {
        $prefix = $this->priority === 'urgent' ? '[URGENT] ' : '';

        return new Envelope(
            subject: $prefix.'CareBridge — '.$this->headline,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.carebridge-notification',
        );
    }
}
