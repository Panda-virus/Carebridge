import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface DismissCaseModalProps {
  isOpen: boolean;
  studentName: string;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export function DismissCaseModal({ isOpen, studentName, onConfirm, onCancel }: DismissCaseModalProps) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for dismissing this case.');
      return;
    }
    onConfirm(reason);
    setReason('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-foreground/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-2xl border border-border shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-warning" />
            Dismiss Case
          </h2>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-accent/30 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-muted-foreground text-sm mb-4">
          You are about to dismiss the case for <span className="text-foreground font-medium">{studentName}</span>. Please provide a reason for this dismissal.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Reason for Dismissal <span className="text-destructive">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError('');
              }}
              placeholder="e.g., Student did not show up for scheduled sessions, student requested cancellation, case resolved through other means, etc."
              className={`w-full px-3 py-2 rounded-lg border bg-input-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm resize-none h-32 ${
                error ? 'border-destructive' : 'border-border'
              }`}
            />
            {error && <p className="text-destructive text-xs mt-1">{error}</p>}
          </div>

          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground hover:bg-accent/30 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors text-sm font-medium"
            >
              Dismiss Case
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
