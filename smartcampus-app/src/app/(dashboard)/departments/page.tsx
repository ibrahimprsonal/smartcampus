'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Department } from '@/types/database';

export default function DepartmentsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newName, setNewName] = useState('');
  const [msg, setMsg] = useState({ success: '', error: '' });

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => { if (data) setDepartments(data as Department[]); });
  }, [supabase]);

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const { data, error } = await supabase.from('departments').insert({ name: newName.trim() }).select().single();
    if (error) { setMsg({ success: '', error: error.message }); return; }
    if (data) setDepartments(p => [...p, data as Department].sort((a, b) => a.name.localeCompare(b.name)));
    setNewName(''); setMsg({ success: 'Department added.', error: '' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this department?')) return;
    const { error } = await supabase.from('departments').delete().eq('id', id);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setDepartments(p => p.filter(d => d.id !== id));
    setMsg({ success: 'Department deleted.', error: '' });
  };

  if (!profile || profile.role !== 'super_admin') return <div className="card"><div className="empty-state"><p>Admin access only.</p></div></div>;

  return (
    <>
      <h1 className="page-title">Manage Departments</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{departments.length} departments</p>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><div className="card-title"><i className="fas fa-plus card-icon" style={{ color: 'var(--accent-green)' }}></i> Add Department</div></div>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <input className="form-input" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Department name (e.g. CSE)" onKeyDown={e => e.key === 'Enter' && handleAdd()} style={{ flex: 1 }} />
            <button className="btn btn-primary" onClick={handleAdd}><i className="fas fa-plus"></i> Add</button>
          </div>
        </div>
      </div>
      <div className="card">
        <table className="data-table"><thead><tr><th>Name</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead><tbody>
          {departments.map(d => (
            <tr key={d.id}>
              <td style={{ fontWeight: 600, color: '#fff' }}>{d.name}</td>
              <td style={{ textAlign: 'right' }}><button className="btn-sm btn-danger" onClick={() => handleDelete(d.id)}><i className="fas fa-trash"></i> Delete</button></td>
            </tr>
          ))}
        </tbody></table>
        {!departments.length && <div className="empty-state"><p>No departments.</p></div>}
      </div>
    </>
  );
}
