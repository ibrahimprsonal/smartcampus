'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getRoleDisplay, getRoleBadgeColor } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ full_name: profile?.full_name || '', whatsapp_number: profile?.whatsapp_number || '', address: profile?.address || '' });
  const [msg, setMsg] = useState({ success: '', error: '' });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!profile || !form.full_name.trim()) { setMsg({ success: '', error: 'Name is required.' }); return; }
    setLoading(true);
    const { error } = await supabase.from('users').update({ full_name: form.full_name.trim(), whatsapp_number: form.whatsapp_number || null, address: form.address || null }).eq('id', profile.id);
    if (error) { setMsg({ success: '', error: error.message }); } else { setMsg({ success: 'Profile updated!', error: '' }); setEditing(false); await refreshProfile(); }
    setLoading(false);
  };

  if (!profile) return null;
  const badgeColor = getRoleBadgeColor(profile.role);
  return (
    <>
      <h1 className="page-title">My Profile</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Your personal information</p>
      {msg.success && <div className="alert success">{msg.success}</div>}
      {msg.error && <div className="alert error">{msg.error}</div>}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <div className="card-title"><i className="fas fa-user card-icon"></i> Profile Information</div>
          {!editing ? <button className="btn-sm btn-primary" onClick={() => { setEditing(true); setForm({ full_name: profile.full_name, whatsapp_number: profile.whatsapp_number || '', address: profile.address || '' }); }}><i className="fas fa-pen"></i> Edit</button> : null}
        </div>
        <div className="card-body">
          {editing ? (
            <>
              <div className="form-group"><label className="form-label">Full Name</label><input className="form-input" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
              <div className="form-group"><label className="form-label">WhatsApp Number</label><input className="form-input" value={form.whatsapp_number} onChange={e => setForm({ ...form, whatsapp_number: e.target.value })} placeholder="+880XXXXXXXXXX" /></div>
              <div className="form-group"><label className="form-label">Address</label><input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={handleSave} disabled={loading}>{loading ? <span className="spinner"></span> : <><i className="fas fa-check"></i> Save</>}</button>
                <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
              </div>
            </>
          ) : (
            <div className="profile-grid">
              <div className="profile-field"><div className="profile-label">Full Name</div><div className="profile-value">{profile.full_name}</div></div>
              <div className="profile-field"><div className="profile-label">Email</div><div className="profile-value">{profile.email}</div></div>
              <div className="profile-field"><div className="profile-label">Role</div><div className="profile-value"><span className={`badge badge-${badgeColor}`}>{getRoleDisplay(profile.role)}</span></div></div>
              <div className="profile-field"><div className="profile-label">Student ID</div><div className="profile-value">{profile.student_id || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">Department</div><div className="profile-value">{profile.department || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">Semester</div><div className="profile-value">{profile.semester || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">Section</div><div className="profile-value">{profile.section || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">WhatsApp</div><div className="profile-value">{profile.whatsapp_number || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">Address</div><div className="profile-value">{profile.address || '—'}</div></div>
              <div className="profile-field"><div className="profile-label">Status</div><div className="profile-value"><span className={`badge badge-${profile.status === 'approved' ? 'green' : 'orange'}`}>{profile.status}</span></div></div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
