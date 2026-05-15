'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { UserProfile } from '@/types/database';
import { getRoleDisplay, getRoleBadgeColor, formatDateTime, getStatusBadgeColor } from '@/lib/utils';

export default function UsersPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filter, setFilter] = useState('all');
  const [msg, setMsg] = useState({ success: '', error: '' });

  useEffect(() => {
    if (!profile) return;
    const load = async () => {
      let query = supabase.from('users').select('*').order('created_at', { ascending: false });
      if (profile.role !== 'super_admin') {
        query = query.eq('department', profile.department || '').eq('semester', profile.semester || 0).eq('section', profile.section || '');
      }
      const { data } = await query;
      if (data) setUsers(data as UserProfile[]);
    };
    load();
  }, [profile, supabase]);

  const handleStatusUpdate = async (userId: string, status: string) => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setUsers(p => p.map(u => u.id === userId ? { ...u, status: status as UserProfile['status'] } : u));
    setMsg({ success: `User ${status}.`, error: '' });
  };

  const handleRoleChange = async (userId: string, role: string) => {
    const { error } = await supabase.from('users').update({ role }).eq('id', userId);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setUsers(p => p.map(u => u.id === userId ? { ...u, role: role as UserProfile['role'] } : u));
    setMsg({ success: 'Role updated.', error: '' });
  };

  if (!profile) return null;
  const filtered = filter === 'all' ? users : users.filter(u => u.status === filter);

  return (
    <>
      <h1 className="page-title">{profile.role === 'super_admin' ? 'All Users' : 'Section Users'}</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{filtered.length} users</p>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        {['all', 'pending', 'approved', 'rejected', 'banned'].map(f => (
          <button key={f} className={`btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setFilter(f)} style={{ border: '1px solid var(--border)', textTransform: 'capitalize' }}>{f}</button>
        ))}
      </div>
      <div className="card">
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Section</th><th>Status</th><th>Joined</th>{profile.role === 'super_admin' && <th style={{ textAlign: 'right' }}>Actions</th>}</tr></thead><tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td><div style={{ fontWeight: 600, color: '#fff' }}>{u.full_name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.student_id || u.email}</div></td>
                <td>{profile.role === 'super_admin' ? (
                  <select className="form-input form-select" value={u.role} onChange={e => handleRoleChange(u.id, e.target.value)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', width: 'auto' }}>
                    <option value="student">Student</option><option value="cr">CR</option><option value="acr">ACR</option><option value="teacher">Teacher</option><option value="super_admin">Super Admin</option>
                  </select>
                ) : <span className={`badge badge-${getRoleBadgeColor(u.role)}`}>{getRoleDisplay(u.role)}</span>}</td>
                <td>{u.department || '—'}</td>
                <td>{u.section || '—'}</td>
                <td><span className={`badge badge-${getStatusBadgeColor(u.status)}`}>{u.status}</span></td>
                <td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(u.created_at)}</td>
                {profile.role === 'super_admin' && (
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    {u.status === 'pending' && <button className="btn-sm btn-success" onClick={() => handleStatusUpdate(u.id, 'approved')}><i className="fas fa-check"></i></button>}
                    {u.status !== 'banned' && <button className="btn-sm btn-danger" onClick={() => handleStatusUpdate(u.id, 'banned')} style={{ marginLeft: '0.25rem' }}><i className="fas fa-ban"></i></button>}
                    {u.status === 'banned' && <button className="btn-sm btn-success" onClick={() => handleStatusUpdate(u.id, 'approved')} style={{ marginLeft: '0.25rem' }}><i className="fas fa-undo"></i></button>}
                  </td>
                )}
              </tr>
            ))}
          </tbody></table>
        </div>
        {!filtered.length && <div className="empty-state"><p>No users found.</p></div>}
      </div>
    </>
  );
}
