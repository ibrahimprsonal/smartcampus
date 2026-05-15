'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Department } from '@/types/database';
import { UserProfile } from '@/types/database';
import { isCrOrAcr } from '@/lib/utils';

export default function CreateNoticeForm({ profile }: { profile: UserProfile }) {
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ title: '', content: '', target_department: '', target_semester: '', target_section: '', is_global: false, links: [{ url: '', text: '' }] });
  const [msg, setMsg] = useState({ success: '', error: '' });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => { if (data) setDepartments(data); });
  }, [supabase]);

  const set = (key: string, val: unknown) => setForm(p => ({ ...p, [key]: val }));

  const addLink = () => setForm(p => ({ ...p, links: [...p.links, { url: '', text: '' }] }));
  const removeLink = (i: number) => setForm(p => ({ ...p, links: p.links.filter((_, idx) => idx !== i) }));
  const updateLink = (i: number, key: string, val: string) => setForm(p => ({ ...p, links: p.links.map((l, idx) => idx === i ? { ...l, [key]: val } : l) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg({ success: '', error: '' });
    if (!form.title.trim() || !form.content.trim()) { setMsg({ success: '', error: 'Title and content are required.' }); return; }
    setLoading(true);
    const crAcr = isCrOrAcr(profile.role);
    const isGlobal = !crAcr && form.is_global;
    const noticeData = {
      sender_id: profile.id, title: form.title.trim(), content: form.content.trim(),
      target_department: isGlobal ? null : (crAcr ? profile.department : (form.target_department || null)),
      target_semester: isGlobal ? null : (crAcr ? profile.semester : (form.target_semester ? parseInt(form.target_semester) : null)),
      target_section: isGlobal ? null : (crAcr ? profile.section : (form.target_section || null)),
      external_link: null, is_global: isGlobal,
    };
    const { data, error } = await supabase.from('notices').insert(noticeData).select().single();
    if (error) { setMsg({ success: '', error: error.message }); setLoading(false); return; }
    // Save links
    const validLinks = form.links.filter(l => l.url.trim());
    if (validLinks.length && data) {
      await supabase.from('notice_links').insert(validLinks.map((l, i) => ({ notice_id: data.id, url: l.url, button_text: l.text || 'Open Link', sort_order: i })));
    }
    // Send notifications to targeted users
    if (data) {
      let query = supabase.from('users').select('id').eq('status', 'approved').neq('id', profile.id);
      if (!isGlobal) {
        if (noticeData.target_department) query = query.eq('department', noticeData.target_department);
        if (noticeData.target_semester) query = query.eq('semester', noticeData.target_semester);
        if (noticeData.target_section) query = query.eq('section', noticeData.target_section);
      }
      const { data: users } = await query;
      if (users?.length) {
        const notifs = users.map(u => ({ user_id: u.id, type: 'notice', title: '📢 ' + form.title.trim(), message: 'New notice from ' + profile.full_name, link: '/notices/' + data.id }));
        await supabase.from('notifications').insert(notifs);
      }
    }
    setMsg({ success: 'Notice published!', error: '' });
    setForm({ title: '', content: '', target_department: '', target_semester: '', target_section: '', is_global: false, links: [{ url: '', text: '' }] });
    setLoading(false); setOpen(false);
    window.location.reload();
  };

  return (
    <div className="card" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header" style={{ cursor: 'pointer' }} onClick={() => setOpen(!open)}>
        <div className="card-title"><i className="fas fa-plus-circle card-icon" style={{ color: 'var(--accent-green)' }}></i> Create Notice</div>
        <i className={`fas fa-chevron-${open ? 'up' : 'down'}`} style={{ color: 'var(--text-muted)' }}></i>
      </div>
      {open && (
        <div className="card-body">
          {msg.success && <div className="alert success"><i className="fas fa-check-circle"></i> {msg.success}</div>}
          {msg.error && <div className="alert error"><i className="fas fa-circle-exclamation"></i> {msg.error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-group"><label className="form-label">Title *</label><input className="form-input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Notice title" /></div>
            <div className="form-group"><label className="form-label">Content *</label><textarea className="form-input form-textarea" value={form.content} onChange={e => set('content', e.target.value)} placeholder="Notice content..." /></div>
            {!isCrOrAcr(profile.role) && (
              <>
                <div className="form-check" style={{ marginBottom: '1rem' }}>
                  <input type="checkbox" id="is_global" checked={form.is_global} onChange={e => set('is_global', e.target.checked)} />
                  <label htmlFor="is_global" className="form-label" style={{ marginBottom: 0 }}>Global Notice (send to everyone)</label>
                </div>
                {!form.is_global && (
                  <div className="form-row">
                    <div className="form-group"><label className="form-label">Target Department</label>
                      <select className="form-input form-select" value={form.target_department} onChange={e => set('target_department', e.target.value)}><option value="">All Departments</option>{departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}</select>
                    </div>
                    <div className="form-group"><label className="form-label">Target Semester</label>
                      <select className="form-input form-select" value={form.target_semester} onChange={e => set('target_semester', e.target.value)}><option value="">All</option>{[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}</select>
                    </div>
                  </div>
                )}
                {!form.is_global && (
                  <div className="form-group"><label className="form-label">Target Section</label><input className="form-input" value={form.target_section} onChange={e => set('target_section', e.target.value)} placeholder="e.g. 1A, 2B (leave empty for all)" /></div>
                )}
              </>
            )}
            <div style={{ marginBottom: '1rem' }}>
              <label className="form-label">Links</label>
              {form.links.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input className="form-input" value={l.url} onChange={e => updateLink(i, 'url', e.target.value)} placeholder="https://..." style={{ flex: 2 }} />
                  <input className="form-input" value={l.text} onChange={e => updateLink(i, 'text', e.target.value)} placeholder="Button text" style={{ flex: 1 }} />
                  {form.links.length > 1 && <button type="button" className="btn-sm btn-danger" onClick={() => removeLink(i)}><i className="fas fa-times"></i></button>}
                </div>
              ))}
              <button type="button" className="btn-sm btn-secondary" onClick={addLink} style={{ border: '1px solid var(--border)' }}><i className="fas fa-plus"></i> Add Link</button>
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <><span className="spinner"></span> Publishing...</> : <><i className="fas fa-paper-plane"></i> Publish Notice</>}</button>
          </form>
        </div>
      )}
    </div>
  );
}
