'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { SectionRequest } from '@/types/database';
import { formatDateTime } from '@/lib/utils';

export default function SectionRequestsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [requests, setRequests] = useState<SectionRequest[]>([]);
  const [msg, setMsg] = useState({ success: '', error: '' });

  useEffect(() => {
    if (!profile || !['cr', 'acr'].includes(profile.role)) return;
    supabase.from('section_requests').select('*, student:users!user_id(full_name, student_id, role), requester:users!requested_by(full_name, role)')
      .eq('to_department', profile.department || '').eq('to_semester', profile.semester || 0).eq('to_section', profile.section || '')
      .eq('status', 'pending').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setRequests(data.map((r: Record<string, unknown>) => ({
          ...r,
          student_name: (r.student as Record<string, unknown>)?.full_name,
          student_id_number: (r.student as Record<string, unknown>)?.student_id,
          student_role: (r.student as Record<string, unknown>)?.role,
          requester_name: (r.requester as Record<string, unknown>)?.full_name,
          requester_role: (r.requester as Record<string, unknown>)?.role,
        })) as SectionRequest[]);
      });
  }, [profile, supabase]);

  const handleAction = async (id: number, status: string) => {
    const req = requests.find(r => r.id === id);
    if (!req) return;
    const { error } = await supabase.from('section_requests').update({ status }).eq('id', id);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    if (status === 'approved') {
      await supabase.from('users').update({ department: req.to_department, semester: req.to_semester, section: req.to_section }).eq('id', req.user_id);
    }
    setRequests(p => p.filter(r => r.id !== id));
    setMsg({ success: `Request ${status}.`, error: '' });
  };

  if (!profile || !['cr', 'acr'].includes(profile.role)) return <div className="card"><div className="empty-state"><p>CR/ACR access only.</p></div></div>;

  return (
    <>
      <h1 className="page-title">Section Requests</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Pending section transfer requests</p>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      <div className="card">
        {requests.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>Student</th><th>From</th><th>To</th><th>Requested By</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
              {requests.map(r => (
                <tr key={r.id}>
                  <td><div style={{ fontWeight: 600, color: '#fff' }}>{r.student_name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.student_id_number}</div></td>
                  <td>{r.from_department}/{r.from_section}</td>
                  <td>{r.to_department}/{r.to_section}</td>
                  <td>{r.requester_name}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(r.created_at)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-sm btn-success" onClick={() => handleAction(r.id, 'approved')}><i className="fas fa-check"></i> Approve</button>
                    <button className="btn-sm btn-danger" onClick={() => handleAction(r.id, 'rejected')} style={{ marginLeft: '0.35rem' }}><i className="fas fa-xmark"></i> Reject</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : <div className="empty-state"><i className="fas fa-check-circle" style={{ fontSize: '2rem', color: 'var(--accent-green)' }}></i><p>No pending requests.</p></div>}
      </div>
    </>
  );
}
