import { CaseWorkflowStage, UserRole } from '../types';

export const WORKFLOW_STAGE_LABELS: Record<CaseWorkflowStage, string> = {
  at_iic: 'New — At IIC',
  permission_pending: 'Permission Request — Pending Registrar',
  permission_approved: 'Permission Approved — Awaiting Investigation',
  investigation: 'Under Investigation',
  findings_with_registrar: 'Findings — Pending Registrar Review',
  with_disciplinary: 'With Disciplinary Committee',
  meeting_notice_sent: 'Meeting Notice Sent',
  closed: 'Closed',
};

export const WORKFLOW_STAGE_COLORS: Record<CaseWorkflowStage, string> = {
  at_iic: 'bg-info/10 text-info border-info/20',
  permission_pending: 'bg-warning/10 text-warning-foreground border-warning/20',
  permission_approved: 'bg-info/10 text-info border-info/20',
  investigation: 'bg-warning/10 text-warning-foreground border-warning/20',
  findings_with_registrar: 'bg-accent/20 text-accent-foreground border-accent/30',
  with_disciplinary: 'bg-primary/10 text-primary border-primary/20',
  meeting_notice_sent: 'bg-primary/10 text-primary border-primary/20',
  closed: 'bg-muted text-muted-foreground border-border',
};

export function isWorkflowCase(report: { category?: string; workflowStage?: CaseWorkflowStage }): boolean {
  return report.category === 'sexual_harassment_gbv' || !!report.workflowStage;
}

export function iicActiveStages(): CaseWorkflowStage[] {
  return ['at_iic', 'permission_pending', 'permission_approved', 'investigation'];
}

export function registrarWorkflowStages(): CaseWorkflowStage[] {
  return ['permission_pending', 'findings_with_registrar'];
}

export function disciplinaryWorkflowStages(): CaseWorkflowStage[] {
  return ['with_disciplinary', 'meeting_notice_sent', 'closed'];
}

export type WorkflowAction =
  | 'request_permission'
  | 'approve_permission'
  | 'start_investigation'
  | 'submit_findings'
  | 'forward_to_disciplinary'
  | 'dismiss_case'
  | 'send_meeting_notice'
  | 'record_verdict';

export const WORKFLOW_ACTION_LABELS: Record<WorkflowAction, string> = {
  request_permission: 'Send Permission Request to Registrar',
  approve_permission: 'Approve Investigation Permission',
  start_investigation: 'Start Investigation',
  submit_findings: 'Submit Findings to Registrar',
  forward_to_disciplinary: 'Forward to Disciplinary Committee',
  dismiss_case: 'Dismiss Case',
  send_meeting_notice: 'Send Meeting Notice',
  record_verdict: 'Record Verdict & Close Case',
};

export function getAvailableAction(
  stage: CaseWorkflowStage | undefined,
  role: UserRole
): WorkflowAction | null {
  const s = stage ?? 'at_iic';
  if (role === 'iic') {
    if (s === 'at_iic') return 'request_permission';
    if (s === 'permission_approved') return 'start_investigation';
    if (s === 'investigation') return 'submit_findings';
  }
  if (role === 'registrar') {
    if (s === 'permission_pending') return 'approve_permission';
    if (s === 'findings_with_registrar') return 'forward_to_disciplinary';
  }
  if (role === 'disciplinary_committee') {
    if (s === 'with_disciplinary') return 'send_meeting_notice';
    if (s === 'meeting_notice_sent') return 'record_verdict';
  }
  return null;
}

