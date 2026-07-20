import { useEffect, useState } from 'react';

export function ReportsPage() {
  const [tab, setTab] = useState<'counseling'|'appointments'|'cases'|'users'>('counseling');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTab();
  }, [tab]);

  const fetchTab = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${tab === 'counseling' ? 'counseling-progress' : tab}`);
      if (res.ok) {
        const json = await res.json();
        setData(Array.isArray(json) ? json : []);
      } else {
        setData([]);
      }
    } catch (e) {
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  const renderCounseling = () => {
    if (!data.length) return <div className="text-sm text-muted-foreground">No counseling records.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground bg-muted/10">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Concern</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Progress</th>
              <th className="px-3 py-2">Counselor</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((r: any) => (
              <tr key={r.id} className="border-b border-border hover:bg-muted/5">
                <td className="px-3 py-2 text-sm">{r.id}</td>
                <td className="px-3 py-2 text-sm">{r.student?.name ?? r.student?.id ?? ''}</td>
                <td className="px-3 py-2 text-sm">{r.concern}</td>
                <td className="px-3 py-2 text-sm">{r.status}</td>
                <td className="px-3 py-2 text-sm">{r.progress?.progress_percent ?? r.progress_percent ?? '—'}</td>
                <td className="px-3 py-2 text-sm">{r.sessions?.[0]?.counselor_id ?? ''}</td>
                <td className="px-3 py-2 text-sm">{r.created_at ? new Date(r.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAppointments = () => {
    if (!data.length) return <div className="text-sm text-muted-foreground">No appointments.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground bg-muted/10">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Student</th>
              <th className="px-3 py-2">Counselor</th>
              <th className="px-3 py-2">Scheduled</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((s: any) => (
              <tr key={s.id} className="border-b border-border hover:bg-muted/5">
                <td className="px-3 py-2 text-sm">{s.id}</td>
                <td className="px-3 py-2 text-sm">{s.student?.name ?? s.student?.id ?? ''}</td>
                <td className="px-3 py-2 text-sm">{s.counselor?.name ?? s.counselor_id ?? ''}</td>
                <td className="px-3 py-2 text-sm">{s.scheduled_at ? new Date(s.scheduled_at).toLocaleString() : '—'}</td>
                <td className="px-3 py-2 text-sm">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderCases = () => {
    if (!data.length) return <div className="text-sm text-muted-foreground">No cases.</div>;
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground bg-muted/10">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Subject</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Affected Student</th>
              <th className="px-3 py-2">Reported By</th>
              <th className="px-3 py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {data.map((c: any) => (
              <tr key={c.id} className="border-b border-border hover:bg-muted/5">
                <td className="px-3 py-2 text-sm">{c.id}</td>
                <td className="px-3 py-2 text-sm">{c.subject}</td>
                <td className="px-3 py-2 text-sm">{c.category}</td>
                <td className="px-3 py-2 text-sm">{c.affected_student?.name ?? ''}</td>
                <td className="px-3 py-2 text-sm">{c.reported_by?.name ?? ''}</td>
                <td className="px-3 py-2 text-sm">{c.created_at ? new Date(c.created_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderUsers = () => {
    if (!data.length) return <div className="text-sm text-muted-foreground">No user records.</div>;

    // If this looks like an access log (has path), render as audit logs
    if (data[0] && data[0].path) {
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs text-muted-foreground bg-muted/10">
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Method</th>
                <th className="px-3 py-2">Path</th>
                <th className="px-3 py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {data.map((l: any) => (
                <tr key={l.id} className="border-b border-border hover:bg-muted/5">
                  <td className="px-3 py-2 text-sm">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</td>
                  <td className="px-3 py-2 text-sm">{l.user_name ?? l.user_email ?? `#${l.user_id ?? '—'}`}</td>
                  <td className="px-3 py-2 text-sm">{l.user_role ?? '—'}</td>
                  <td className="px-3 py-2 text-sm">{l.method}</td>
                  <td className="px-3 py-2 text-sm">{l.path}</td>
                  <td className="px-3 py-2 text-sm">{l.ip_address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Otherwise assume this is a simple users list
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-xs text-muted-foreground bg-muted/10">
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Last Login</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u: any) => (
              <tr key={u.id} className="border-b border-border hover:bg-muted/5">
                <td className="px-3 py-2 text-sm">{u.id}</td>
                <td className="px-3 py-2 text-sm">{u.name}</td>
                <td className="px-3 py-2 text-sm">{u.email}</td>
                <td className="px-3 py-2 text-sm">{u.role}</td>
                <td className="px-3 py-2 text-sm">{u.last_login_at ? new Date(u.last_login_at).toLocaleString() : ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="rounded-[20px] border border-border/70 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports</h2>
        <div className="inline-flex gap-2">
          <button onClick={() => setTab('counseling')} className={`rounded-2xl px-3 py-1 ${tab==='counseling' ? 'bg-primary text-primary-foreground' : 'border'}`}>Counselling progress</button>
          <button onClick={() => setTab('appointments')} className={`rounded-2xl px-3 py-1 ${tab==='appointments' ? 'bg-primary text-primary-foreground' : 'border'}`}>Appointments</button>
          <button onClick={() => setTab('cases')} className={`rounded-2xl px-3 py-1 ${tab==='cases' ? 'bg-primary text-primary-foreground' : 'border'}`}>Cases</button>
          <button onClick={() => setTab('users')} className={`rounded-2xl px-3 py-1 ${tab==='users' ? 'bg-primary text-primary-foreground' : 'border'}`}>Users</button>
        </div>
      </div>

      <div className="min-h-[200px]">
        {loading ? <div>Loading...</div> : (
          <div>
            {tab === 'counseling' && renderCounseling()}
            {tab === 'appointments' && renderAppointments()}
            {tab === 'cases' && renderCases()}
            {tab === 'users' && renderUsers()}
          </div>
        )}
      </div>
    </div>
  );
}
