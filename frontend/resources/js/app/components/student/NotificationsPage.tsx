import React from 'react';
import { CaseReport } from '../../types';

export function NotificationsPage({ caseReports }: { caseReports: CaseReport[] }) {
  // derive simple notifications from caseReports
  const notifications = [] as { id: string; title: string; body: string }[];

  caseReports.forEach((r) => {
    if (r.meetingDate || r.meetingNotice) {
      notifications.push({ id: `meeting-${r.id}`, title: `Meeting scheduled for ${r.ticketNumber ?? r.id}`, body: `${r.meetingNotice ?? 'Meeting scheduled.'} Date: ${r.meetingDate ?? 'TBD'}` });
    }
    if (r.verdict) {
      notifications.push({ id: `verdict-${r.id}`, title: `Verdict for ${r.ticketNumber ?? r.id}`, body: r.verdict });
    }
    if (r.status === 'referred_to_disciplinary_hearing') {
      notifications.push({ id: `referred-${r.id}`, title: `Case referred to disciplinary committee (${r.ticketNumber ?? r.id})`, body: r.responseNotes ?? 'Forwarded for review' });
    }
  });

  // Add a generic system notification example
  notifications.unshift({ id: 'sys-1', title: 'CareBridge Update', body: 'We have updated the platform with improved notifications.' });

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Notifications</h2>
          <p className="text-sm text-muted-foreground">Important updates, meeting notices, and verdicts appear here.</p>
        </div>
        <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {notifications.length} {notifications.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {notifications.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-border bg-background/50 p-4 text-sm text-muted-foreground">
          No notifications yet.
        </div>
      ) : (
        <div className="mt-4 divide-y divide-border/50">
          {notifications.map((n, index) => (
            <div key={n.id} className={index === 0 ? 'py-4' : 'py-4'}>
              <p className="font-semibold text-foreground">{n.title}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground whitespace-pre-wrap">{n.body}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
