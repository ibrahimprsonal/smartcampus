'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ActivityLog } from '@/types/database';
import { formatDateTime, getRoleDisplay } from '@/lib/utils';

export default function AuditLogsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [page, setPage] = useState(0);
  const limit = 50;

  useEffect(() => {
    if (!profile || profile.role !== 'super_admin') return;
    supabase.from('activity_log').select('*, user:users!user_id(full_name, role, department)').order('created_at', { ascending: false }).range(page * limit, (page + 1) * limit - 1).then(({ data }) => {
      if (data) setLogs(data.map((l: Record<string, unknown>) => ({ ...l, full_name: (l.user as Record<string, unknown>)?.full_name, role: (l.user as Record<string, unknown>)?.role, department: (l.user as Record<string, unknown>)?.department })) as ActivityLog[]);
    });
  }, [profile, page, supabase]);

  if (!profile || profile.role !== 'super_admin') return <div className="card"><div className="empty-state"><p>Admin access only.</p></div></div>;

  return (
    <>
      <h1 className="page-title">Audit Logs</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>System activity history</p>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>User</th><th>Action</th><th>Details</th><th>IP</th><th>Time</th></tr></thead><tbody>
            {logs.map(l => (
              <tr key={l.id}>
                <td><div style={{ fontWeight: 600, color: '#fff' }}>{l.full_name || '—'}</div>{l.role && <span className="badge badge-blue" style={{ fontSize: '0.6rem' }}>{getRoleDisplay(l.role)}</span>}</td>
                <td><span className="badge badge-purple">{l.action}</span></td>
                <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.details || '—'}</td>
                <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{l.ip_address || '—'}</td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(l.created_at)}</td>
              </tr>
            ))}
          </tbody></table>
        </div>
        {!logs.length && <div className="empty-state"><p>No logs found.</p></div>}
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'center' }}>
        <button className="btn btn-secondary" disabled={page === 0} onClick={() => setPage(p => p - 1)}><i className="fas fa-chevron-left"></i> Prev</button>
        <span style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page + 1}</span>
        <button className="btn btn-secondary" disabled={logs.length < limit} onClick={() => setPage(p => p + 1)}>Next <i className="fas fa-chevron-right"></i></button>
      </div>
    </>
  );
}
