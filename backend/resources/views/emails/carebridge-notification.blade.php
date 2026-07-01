<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $headline }}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f8;font-family:Segoe UI,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;">
    <tr>
        <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <tr>
                    <td style="background:#1e40af;padding:20px 28px;">
                        <h1 style="margin:0;color:#ffffff;font-size:20px;">CareBridge</h1>
                        <p style="margin:4px 0 0;color:#bfdbfe;font-size:13px;">Mzuzu University Counseling &amp; Support</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:28px;">
                        @if($priority === 'urgent')
                            <p style="margin:0 0 16px;padding:10px 14px;background:#fef2f2;border-left:4px solid #dc2626;color:#991b1b;font-size:14px;font-weight:600;">
                                Urgent — immediate attention required
                            </p>
                        @endif
                        <h2 style="margin:0 0 16px;color:#111827;font-size:18px;">{{ $headline }}</h2>
                        <div style="color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">{{ $body }}</div>
                        @if($actionUrl)
                            <p style="margin:24px 0 0;">
                                <a href="{{ $actionUrl }}" style="display:inline-block;background:#1e40af;color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:6px;font-size:14px;font-weight:600;">
                                    {{ $actionLabel ?? 'Open CareBridge' }}
                                </a>
                            </p>
                        @endif
                    </td>
                </tr>
                <tr>
                    <td style="padding:16px 28px;background:#f9fafb;border-top:1px solid #e5e7eb;">
                        <p style="margin:0;color:#6b7280;font-size:12px;">
                            This is an automated message from the CareBridge System. Do not reply to this email.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
