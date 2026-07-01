import React, { useState } from 'react';

export function EmailListInput({ emails, onChange }: { emails: string[]; onChange: (emails: string[]) => void }) {
  const [input, setInput] = useState('');

  const addEmail = () => {
    const v = input.trim();
    if (!v) return;
    // basic validation
    const parts = v.split(/[;,\s]+/).map((p) => p.trim()).filter(Boolean);
    const next = [...emails];
    parts.forEach((p) => {
      if (p && !next.includes(p)) next.push(p);
    });
    onChange(next);
    setInput('');
  };

  const removeEmail = (idx: number) => {
    const next = emails.slice();
    next.splice(idx, 1);
    onChange(next);
  };

  return (
    <div>
      <div className="flex gap-2">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type email and press Add or Enter" className="flex-1 rounded-lg border border-border px-3 py-2 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addEmail(); } }} />
        <button type="button" onClick={addEmail} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground">Add</button>
      </div>
      {emails.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {emails.map((em, idx) => (
            <div key={em + idx} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-muted/10 border border-border text-sm">
              <span className="truncate max-w-[160px]">{em}</span>
              <button onClick={() => removeEmail(idx)} className="text-sm text-destructive ml-2">×</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
