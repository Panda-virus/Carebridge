import React, { useState } from 'react';
import { EmailListInput } from '../EmailListInput';
import { CaseReport, UserRole } from '../../types';
import { WorkflowAction, WORKFLOW_STAGE_LABELS, WORKFLOW_ACTION_LABELS } from '../../utils/caseWorkflow';

export interface WorkflowActionPayload {
  permissionRequest?: string;
  findingsReport?: string;
  findingsFiles?: File[];
  meetingNotice?: string;
  meetingDate?: string;
  meetingEmails?: string[];
  meetingFiles?: File[];
  verdict?: string;
  verdictEmails?: string[];
  verdictFiles?: File[];
  responseNotes?: string;
  reason?: string;
}

interface CaseWorkflowPanelProps {
  report: CaseReport;
  role: UserRole;
  onWorkflowAction: (reportId: string, action: WorkflowAction, payload: WorkflowActionPayload) => void;
  saving: boolean;
}

const ROLE_WORKFLOW_ACTIONS: Record<UserRole, WorkflowAction[]> = {
  student: [],
  counselor: [],
  dean: [],
  iic: ['request_permission', 'start_investigation', 'submit_findings'],
  registrar: ['approve_permission', 'forward_to_disciplinary'],
  disciplinary_committee: ['send_meeting_notice', 'record_verdict'],
  external_counselor: [],
  system_administrator: [],
};

function getStageLabel(workflowStage?: string): string {
  if (!workflowStage) return 'Unknown Stage';
  return WORKFLOW_STAGE_LABELS[workflowStage as keyof typeof WORKFLOW_STAGE_LABELS] || workflowStage;
}

export function CaseWorkflowPanel({ report, role, onWorkflowAction, saving }: CaseWorkflowPanelProps) {
  const [permissionRequest, setPermissionRequest] = useState('');
  const [findingsReport, setFindingsReport] = useState('');
  const [findingsFiles, setFindingsFiles] = useState<File[]>([]);
  const [meetingNotice, setMeetingNotice] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingEmails, setMeetingEmails] = useState<string[]>([]);
  const [meetingFiles, setMeetingFiles] = useState<File[]>([]);
  const [verdict, setVerdict] = useState('');
  const [verdictEmails, setVerdictEmails] = useState<string[]>([]);
  const [verdictFiles, setVerdictFiles] = useState<File[]>([]);
  const [responseNotes, setResponseNotes] = useState(report.responseNotes ?? '');

  const stage = report.workflowStage ?? 'at_iic';
  const availableAction = (action: WorkflowAction) => {
    const validActions = ROLE_WORKFLOW_ACTIONS[role] || [];
    if (!validActions.includes(action)) return false;
    if (role === 'iic') {
      if (stage === 'at_iic') return action === 'request_permission';
      if (stage === 'permission_approved') return action === 'start_investigation';
      if (stage === 'investigation') return action === 'submit_findings';
      return false;
    }
    if (role === 'registrar') {
      if (stage === 'permission_pending') return action === 'approve_permission';
      if (stage === 'findings_with_registrar') return action === 'forward_to_disciplinary';
      return false;
    }
    if (role === 'disciplinary_committee') {
      if (stage === 'with_disciplinary') return action === 'send_meeting_notice';
      if (stage === 'meeting_notice_sent') return action === 'record_verdict';
      return false;
    }
    return false;
  };

  const handleAction = (action: WorkflowAction) => {
    const payload: WorkflowActionPayload = {};
    if (action === 'request_permission') payload.permissionRequest = permissionRequest;
    if (action === 'submit_findings') {
      payload.findingsReport = findingsReport;
      payload.findingsFiles = findingsFiles;
    }
    if (action === 'send_meeting_notice') {
      payload.meetingNotice = meetingNotice;
      payload.meetingDate = meetingDate;
      payload.meetingEmails = meetingEmails;
      payload.meetingFiles = meetingFiles;
    }
    if (action === 'record_verdict') payload.verdict = verdict;
    if (action === 'approve_permission') payload.responseNotes = responseNotes;
    if (action === 'start_investigation') payload.responseNotes = responseNotes;
    if (action === 'forward_to_disciplinary') payload.responseNotes = responseNotes;
    onWorkflowAction(report.id, action, payload);
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground mb-1">Current Stage</p>
        <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
          {getStageLabel(stage)}
        </span>
      </div>

      {availableAction('request_permission') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Permission Request Details
          </label>
          <textarea
            value={permissionRequest}
            onChange={(e) => setPermissionRequest(e.target.value)}
            placeholder="Describe the reason for requesting investigation permission..."
            className="w-full min-h-[100px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={() => handleAction('request_permission')}
            disabled={saving || !permissionRequest.trim()}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Submitting...' : 'Send to Registrar'}
          </button>
        </div>
      )}

      {availableAction('approve_permission') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Response Notes
          </label>
          <textarea
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full min-h-[80px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={() => handleAction('approve_permission')}
            disabled={saving}
            className="w-full bg-success text-success-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-success/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Processing...' : 'Approve Permission'}
          </button>
        </div>
      )}

      {availableAction('start_investigation') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Response Notes
          </label>
          <textarea
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full min-h-[80px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={() => handleAction('start_investigation')}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Updating...' : 'Start Investigation'}
          </button>
        </div>
      )}

      {availableAction('submit_findings') && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              Findings Report
            </label>
            <textarea
              value={findingsReport}
              onChange={(e) => setFindingsReport(e.target.value)}
              placeholder="Document your investigation findings..."
              className="w-full min-h-[140px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground block">
              Attach findings document
            </label>
            <input
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
              onChange={(e) => {
                setFindingsFiles(Array.from(e.target.files || []));
              }}
              className="w-full text-sm text-foreground"
            />
            {findingsFiles.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-3 text-sm text-foreground space-y-1">
                <p className="font-medium">Selected files:</p>
                <ul className="list-disc list-inside">
                  {findingsFiles.map((file) => (
                    <li key={file.name + file.size}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <button
            onClick={() => handleAction('submit_findings')}
            disabled={saving || (!findingsReport.trim() && findingsFiles.length === 0)}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Submitting...' : 'Submit Findings'}
          </button>
        </div>
      )}

      {availableAction('forward_to_disciplinary') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Response Notes
          </label>
          <textarea
            value={responseNotes}
            onChange={(e) => setResponseNotes(e.target.value)}
            placeholder="Add any notes..."
            className="w-full min-h-[80px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <button
            onClick={() => handleAction('forward_to_disciplinary')}
            disabled={saving}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Forwarding...' : 'Send to Disciplinary'}
          </button>
        </div>
      )}

      {availableAction('send_meeting_notice') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Meeting Notice
          </label>
          <textarea
            value={meetingNotice}
            onChange={(e) => setMeetingNotice(e.target.value)}
            placeholder="Meeting notice details..."
            className="w-full min-h-[100px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <label className="text-xs font-medium text-muted-foreground block mt-2">
            Meeting Date
          </label>
          <input
            type="date"
            value={meetingDate}
            onChange={(e) => setMeetingDate(e.target.value)}
            className="w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm"
          />
            <label className="text-xs font-medium text-muted-foreground block mt-2">Send To (emails)</label>
            <EmailListInput emails={meetingEmails} onChange={setMeetingEmails} />

            <label className="text-xs font-medium text-muted-foreground block mt-2">Attach meeting notice document</label>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => setMeetingFiles(Array.from(e.target.files || []))}
              className="w-full text-sm text-foreground"
            />
            {meetingFiles.length > 0 && (
              <div className="rounded-lg border border-border bg-muted/10 p-3 text-sm text-foreground mt-2">
                <p className="font-medium">Selected files:</p>
                <ul className="list-disc list-inside">
                  {meetingFiles.map((f) => (
                    <li key={f.name + f.size}>{f.name}</li>
                  ))}
                </ul>
              </div>
            )}
          <button
            onClick={() => handleAction('send_meeting_notice')}
            disabled={saving || !meetingNotice.trim() || !meetingDate}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {saving ? 'Sending...' : 'Send Notice'}
          </button>
        </div>
      )}

      {availableAction('record_verdict') && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground block">
            Verdict
          </label>
          <textarea
            value={verdict}
            onChange={(e) => setVerdict(e.target.value)}
            placeholder="Record the verdict..."
            className="w-full min-h-[120px] rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none"
          />
          <label className="text-xs font-medium text-muted-foreground block mt-2">Send To (emails)</label>
          <EmailListInput emails={verdictEmails} onChange={setVerdictEmails} />

          <label className="text-xs font-medium text-muted-foreground block mt-2">Attach verdict document</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setVerdictFiles(Array.from(e.target.files || []))}
            className="w-full text-sm text-foreground"
          />
          {verdictFiles.length > 0 && (
            <div className="rounded-lg border border-border bg-muted/10 p-3 text-sm text-foreground mt-2">
              <p className="font-medium">Selected files:</p>
              <ul className="list-disc list-inside">
                {verdictFiles.map((f) => (
                  <li key={f.name + f.size}>{f.name}</li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={() => handleAction('record_verdict')}
            disabled={saving || !verdict.trim()}
            className="w-full bg-destructive text-destructive-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Record Verdict & Close'}
          </button>
        </div>
      )}

      {!role || !ROLE_WORKFLOW_ACTIONS[role]?.length ? (
        <p className="text-xs text-muted-foreground italic">No actionable steps for your role at this stage.</p>
      ) : null}
    </div>
  );
}
