'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Deadline, Department } from '@/types/database';
import { formatDateTime, getPriorityColor, canCreateDeadline, isCrOrAcr } from '@/lib/utils';
import Link from 'next/link';

export default function DeadlinesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [myDeadlines, setMyDeadlines] = useState<Deadline[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ title: '', description: '', subject: '', due_date: '', priority: 'normal', target_department: '', target_semester: '', target_section: '', links: [{ url: '', text: '' }] });
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ success: '', error: '' });

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data } = await supabase.from('deadlines').select('*, creator:users!created_by(full_name)').order('due_date');
      if (data) {
        const all = (data as Record<string, unknown>[]).map(d => ({ ...d, creator_name: (d.creator as Record<string, unknown>)?.full_name })) as Deadline[];
        const filtered = all.filter(d => {
          if (d.created_by === profile.id || profile.role === 'super_admin') return true;
          const dm = !d.target_department || d.target_department === profile.department;
          const sm = !d.target_semester || d.target_semester === profile.semester;
          const scm = !d.target_section || d.target_section === profile.section;
          return dm && sm && scm;
        });
        setDeadlines(filtered);
        if (canCreateDeadline(profile.role)) setMyDeadlines(all.filter(d => d.created_by === profile.id));
      }
      const { data: depts } = await supabase.from('departments').select('*').order('name');
      if (depts) setDepartments(depts);
    };
    fetch();
  }, [profile, supabase]);

  const set = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg({ success: '', error: '' });
    if (!form.title || !form.due_date) { setMsg({ success: '', error: 'Title and due date required.' }); return; }
    setLoading(true);
    const crAcr = profile ? isCrOrAcr(profile.role) : false;
    const dlData = {
      title: form.title, description: form.description || null, subject: form.subject || null,
      due_date: form.due_date, priority: form.priority,
      target_department: crAcr ? profile!.department : (form.target_department || null),
      target_semester: crAcr ? profile!.semester : (form.target_semester ? parseInt(form.target_semester) : null),
      target_section: crAcr ? profile!.section : (form.target_section || null),
      created_by: profile!.id,
    };
    const { data, error } = await supabase.from('deadlines').insert(dlData).select().single();
    if (error) { setMsg({ success: '', error: error.message }); setLoading(false); return; }
    // Save links
    const valid = form.links.filter(l => l.url.trim());
    if (valid.length && data) {
      await supabase.from('deadline_links').insert(valid.map((l, i) => ({ deadline_id: data.id, url: l.url, button_text: l.text || 'Open Link', sort_order: i })));
    }
    setMsg({ success: 'Deadline created!', error: '' });
    setLoading(false); setShowCreate(false);
    window.location.reload();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this deadline?')) return;
    await supabase.from('deadlines').delete().eq('id', id);
    setDeadlines(p => p.filter(d => d.id !== id));
    setMyDeadlines(p => p.filter(d => d.id !== id));
  };

  if (!profile) return null;
  const upcoming = deadlines.filter(d => new Date(d.due_date) >= new Date());
  const past = deadlines.filter(d => new Date(d.due_date) < new Date());

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div><h1 className="page-title">Deadlines</h1><p className="page-subtitle">Track upcoming assignments and exams</p></div>
        {canCreateDeadline(profile.role) && <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}><i className="fas fa-plus"></i> Create</button>}
      </div>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      {showCreate && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-plus-circle card-icon" style={{ color: 'var(--accent-green)' }}></i> Create Deadline</div></div>
          <div className="card-body">
            <form onSubmit={handleCreate}>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Subject</label><input className="form-input" value={form.subject} onChange={e => set('subject', e.target.value)} /></div>
              </div>
              <div className="form-group"><label className="form-label">Description</label><textarea className="form-input form-textarea" value={form.description} onChange={e => set('description', e.target.value)} /></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Due Date *</label><input type="datetime-local" className="form-input" value={form.due_date} onChange={e => set('due_date', e.target.value)} /></div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-input form-select" value={form.priority} onChange={e => set('priority', e.target.value)}><option value="normal">Normal</option><option value="high">High</option><option value="urgent">Urgent</option></select>
                </div>
              </div>
              {!isCrOrAcr(profile.role) && (
                <div className="form-row">
                  <div className="form-group"><label className="form-label">Department</label><select className="form-input form-select" value={form.target_department} onChange={e => set('target_department', e.target.value)}><option value="">All</option>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select></div>
                  <div className="form-group"><label className="form-label">Section</label><input className="form-input" value={form.target_section} onChange={e => set('target_section', e.target.value)} placeholder="e.g. 1A" /></div>
                </div>
              )}
              <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner"></span> Creating...</> : <><i className="fas fa-check"></i> Create Deadline</>}</button>
            </form>
          </div>
        </div>
      )}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><div className="card-title"><i className="fas fa-clock card-icon" style={{ color: 'var(--accent-orange)' }}></i> Upcoming</div><span className="badge badge-orange">{upcoming.length}</span></div>
        {upcoming.length > 0 ? upcoming.map(d => (
          <Link href={`/deadlines/${d.id}`} key={d.id} className="deadline-item" style={{ textDecoration: 'none' }}>
            <div className="deadline-priority" style={{ background: getPriorityColor(d.priority) }}></div>
            <div className="deadline-info">
              <div className="deadline-title">{d.title}</div>
              <div className="deadline-meta">{d.subject && <span><i className="fas fa-book"></i> {d.subject}</span>}<span><i className="fas fa-user"></i> {d.creator_name}</span><span className="badge" style={{ background: getPriorityColor(d.priority) + '22', color: getPriorityColor(d.priority), fontSize: '0.6rem' }}>{d.priority}</span></div>
            </div>
            <div className="deadline-due" style={{ color: getPriorityColor(d.priority) }}>{formatDateTime(d.due_date)}</div>
          </Link>
        )) : <div className="empty-state"><p>No upcoming deadlines.</p></div>}
      </div>
      {past.length > 0 && (
        <div className="card">
          <div className="card-header"><div className="card-title"><i className="fas fa-history card-icon" style={{ color: 'var(--text-muted)' }}></i> Past Deadlines</div></div>
          {past.slice(0, 10).map(d => (
            <Link href={`/deadlines/${d.id}`} key={d.id} className="deadline-item" style={{ textDecoration: 'none', opacity: 0.6 }}>
              <div className="deadline-priority" style={{ background: 'var(--text-muted)' }}></div>
              <div className="deadline-info"><div className="deadline-title">{d.title}</div></div>
              <div className="deadline-due" style={{ color: 'var(--text-muted)' }}>{formatDateTime(d.due_date)}</div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
