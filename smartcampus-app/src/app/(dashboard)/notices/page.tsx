'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notice } from '@/types/database';
import { formatDateTime, truncate } from '@/lib/utils';
import Link from 'next/link';

export default function ManageNoticesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [msg, setMsg] = useState({ success: '', error: '' });

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      let query = supabase.from('notices').select('*, sender:users!sender_id(full_name)').order('created_at', { ascending: false });
      if (profile.role !== 'super_admin') query = query.eq('sender_id', profile.id);
      const { data } = await query;
      if (data) setNotices(data.map((n: Record<string, unknown>) => ({ ...n, sender_name: (n.sender as Record<string, unknown>)?.full_name })) as Notice[]);
    };
    fetch();
  }, [profile, supabase]);

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this notice?')) return;
    const { error } = await supabase.from('notices').delete().eq('id', id);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setNotices(p => p.filter(n => n.id !== id));
    setMsg({ success: 'Notice deleted.', error: '' });
  };

  if (!profile) return null;
  return (
    <>
      <h1 className="page-title">Manage Notices</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{profile.role === 'super_admin' ? 'All notices' : 'Your published notices'}</p>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      <div className="card">
        {notices.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>Title</th><th>Target</th><th>Date</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead><tbody>
              {notices.map(n => (
                <tr key={n.id}>
                  <td><div style={{ fontWeight: 600, color: '#fff' }}>{truncate(n.title, 50)}</div>{n.sender_name && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>by {n.sender_name}</div>}</td>
                  <td>{n.is_global ? <span className="badge badge-orange">Global</span> : <span className="badge badge-blue">{(n.target_department || 'All') + '/' + (n.target_section || 'All')}</span>}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(n.created_at)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <Link href={`/notices/${n.id}`} className="btn-sm btn-primary"><i className="fas fa-eye"></i> View</Link>
                    <button className="btn-sm btn-danger" onClick={() => handleDelete(n.id)} style={{ marginLeft: '0.35rem' }}><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : <div className="empty-state"><i className="fas fa-inbox" style={{ fontSize: '2rem' }}></i><p>No notices found.</p></div>}
      </div>
    </>
  );
}
