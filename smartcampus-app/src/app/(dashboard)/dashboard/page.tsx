'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Notice, Deadline, UserProfile } from '@/types/database';
import { formatDateTime, truncate, getInitial, getPriorityColor, canCreateNotice, getRoleDisplay } from '@/lib/utils';
import Link from 'next/link';
import CreateNoticeForm from '@/components/forms/CreateNoticeForm';

export default function DashboardPage() {
  const { profile } = useAuth();
  if (!profile) return null;
  switch (profile.role) {
    case 'student': return <StudentDashboard profile={profile} />;
    case 'cr': return <CRDashboard profile={profile} />;
    case 'acr': return <CRDashboard profile={profile} />;
    case 'teacher': return <TeacherDashboard profile={profile} />;
    case 'super_admin': return <AdminDashboard profile={profile} />;
    default: return <StudentDashboard profile={profile} />;
  }
}

function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <div className="notice-card-wrapper">
      <Link href={`/notices/${notice.id}`} className={`notice-card ${notice.is_global ? 'notice-card-global' : ''}`}>
        <div className="notice-card-top">
          <div className={`notice-card-icon-wrap ${notice.is_global ? 'global' : ''}`}>
            <i className={`fas ${notice.is_global ? 'fa-globe' : 'fa-paper-plane'}`}></i>
          </div>
          <div className="notice-card-badges">
            {notice.is_global ? <span className="badge badge-orange">Global</span> : <span className="badge badge-blue">{(notice.target_department || 'All') + '/' + (notice.target_section || 'All')}</span>}
            {notice.links && notice.links.length > 0 && <span className="badge badge-green"><i className="fas fa-link"></i> {notice.links.length}</span>}
          </div>
        </div>
        <div className="notice-card-title">{notice.title}</div>
        <div className="notice-card-preview">{truncate(notice.content, 120)}</div>
        <div className="notice-card-footer">
          <div className="notice-card-sender">
            <div className="notice-card-sender-avatar">{getInitial(notice.sender_name || 'A')}</div>
            <span>{notice.sender_name || 'Admin'}</span>
          </div>
          <span className="notice-card-time"><i className="far fa-clock"></i> {formatDateTime(notice.created_at)}</span>
        </div>
        <div className="notice-card-read-more">Read Full Notice <i className="fas fa-arrow-right"></i></div>
      </Link>
      {notice.links && notice.links.length > 0 && (
        <div className="notice-card-links-bar">
          {notice.links.map(l => (
            <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="notice-card-link-btn">
              <i className="fas fa-external-link-alt"></i> {l.button_text}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function DeadlineWidget({ deadlines }: { deadlines: Deadline[] }) {
  if (!deadlines.length) return null;
  const upcoming = deadlines.filter(d => new Date(d.due_date) >= new Date()).slice(0, 5);
  if (!upcoming.length) return null;
  return (
    <div className="card deadline-widget" style={{ marginBottom: '1.5rem' }}>
      <div className="card-header">
        <div className="card-title"><i className="fas fa-clock card-icon" style={{ color: 'var(--accent-orange)' }}></i> Upcoming Deadlines</div>
        <span className="badge badge-orange">{upcoming.length}</span>
      </div>
      {upcoming.map(d => (
        <Link href={`/deadlines/${d.id}`} key={d.id} className="deadline-item" style={{ textDecoration: 'none' }}>
          <div className="deadline-priority" style={{ background: getPriorityColor(d.priority) }}></div>
          <div className="deadline-info">
            <div className="deadline-title">{d.title}</div>
            <div className="deadline-meta">
              {d.subject && <span><i className="fas fa-book"></i> {d.subject}</span>}
              <span><i className="fas fa-user"></i> {d.creator_name}</span>
            </div>
          </div>
          <div className="deadline-due" style={{ color: getPriorityColor(d.priority) }}>
            {formatDateTime(d.due_date)}
          </div>
        </Link>
      ))}
    </div>
  );
}

function useNotices(profile: UserProfile) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [myNotices, setMyNotices] = useState<Notice[]>([]);
  const supabase = createClient();
  useEffect(() => {
    const fetch = async () => {
      // Targeted notices
      let query = supabase.from('notices').select('*, sender:users!sender_id(full_name)').order('created_at', { ascending: false });
      const { data } = await query;
      if (data) {
        const mapped = data.map((n: Record<string, unknown>) => ({
          ...n,
          sender_name: (n.sender as Record<string, unknown>)?.full_name || 'Unknown',
        })) as Notice[];
        // Filter by targeting logic
        const filtered = mapped.filter(n => {
          if (n.is_global) return true;
          if (n.sender_id === profile.id) return true;
          const deptMatch = !n.target_department || n.target_department === profile.department;
          const semMatch = !n.target_semester || n.target_semester === profile.semester;
          const secMatch = !n.target_section || n.target_section === profile.section;
          const hasTarget = n.target_department || n.target_semester || n.target_section;
          return hasTarget && deptMatch && semMatch && secMatch;
        });
        setNotices(filtered);
      }
      // My sent notices
      if (canCreateNotice(profile.role)) {
        const { data: mine } = await supabase.from('notices').select('*').eq('sender_id', profile.id).order('created_at', { ascending: false });
        if (mine) setMyNotices(mine as Notice[]);
      }
    };
    fetch();
  }, [profile, supabase]);
  // Attach links
  useEffect(() => {
    if (!notices.length) return;
    const ids = notices.map(n => n.id);
    supabase.from('notice_links').select('*').in('notice_id', ids).order('sort_order').then(({ data }) => {
      if (!data) return;
      const map: Record<number, typeof data> = {};
      data.forEach(l => { (map[l.notice_id] ??= []).push(l); });
      setNotices(prev => prev.map(n => ({ ...n, links: map[n.id] || [] })));
    });
  }, [notices.length, supabase]);
  return { notices, myNotices };
}

function useDeadlines(profile: UserProfile) {
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const supabase = createClient();
  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from('deadlines').select('*, creator:users!created_by(full_name)').order('due_date', { ascending: true });
      if (data) {
        const mapped = (data as Record<string, unknown>[]).map(d => ({ ...d, creator_name: (d.creator as Record<string, unknown>)?.full_name || 'Unknown' })) as Deadline[];
        const filtered = mapped.filter(d => {
          if (d.created_by === profile.id) return true;
          if (profile.role === 'super_admin') return true;
          const deptMatch = !d.target_department || d.target_department === profile.department;
          const semMatch = !d.target_semester || d.target_semester === profile.semester;
          const secMatch = !d.target_section || d.target_section === profile.section;
          return deptMatch && semMatch && secMatch;
        });
        setDeadlines(filtered);
      }
    };
    fetch();
  }, [profile, supabase]);
  return deadlines;
}

function StudentDashboard({ profile }: { profile: UserProfile }) {
  const { notices } = useNotices(profile);
  const deadlines = useDeadlines(profile);
  const globalNotices = notices.filter(n => n.is_global);
  const targetedNotices = notices.filter(n => !n.is_global);
  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Welcome back, {profile.full_name}</p>
      </div>
      <DeadlineWidget deadlines={deadlines} />
      {globalNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title"><i className="fas fa-globe card-icon" style={{ color: 'var(--accent-orange)' }}></i> Global Announcements</div>
            <span className="badge badge-orange">{globalNotices.length}</span>
          </div>
          <div className="notice-grid">{globalNotices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
      {targetedNotices.length > 0 && (
        <div className="card notice-board-card">
          <div className="card-header">
            <div className="card-title"><i className="fas fa-bullhorn card-icon"></i> Section Notices</div>
            <span className="badge badge-blue">{targetedNotices.length}</span>
          </div>
          <div className="notice-grid">{targetedNotices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
      {!notices.length && (
        <div className="card"><div className="empty-state"><i className="fas fa-inbox" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i><p>No notices yet.</p></div></div>
      )}
    </>
  );
}

function CRDashboard({ profile }: { profile: UserProfile }) {
  const { notices, myNotices } = useNotices(profile);
  const deadlines = useDeadlines(profile);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [msg, setMsg] = useState({ success: '', error: '' });
  const supabase = createClient();

  useEffect(() => {
    supabase.from('users').select('*')
      .eq('department', profile.department || '').eq('semester', profile.semester || 0).eq('section', profile.section || '')
      .eq('status', 'pending')
      .then(({ data }) => { if (data) setPendingUsers(data as UserProfile[]); });
  }, [profile, supabase]);

  const handleApproval = async (userId: string, status: string) => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setPendingUsers(p => p.filter(u => u.id !== userId));
    setMsg({ success: `User ${status} successfully.`, error: '' });
  };

  const targetedNotices = notices.filter(n => !n.is_global && n.sender_id !== profile.id);
  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">{profile.role === 'cr' ? 'CR' : 'ACR'} Command Center</h1>
        <p className="page-subtitle">Welcome, {profile.full_name}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card orange"><div className="stat-label">Department</div><div className="stat-value" style={{ fontSize: '1.35rem' }}>{profile.department || 'N/A'}</div></div>
        <div className="stat-card purple"><div className="stat-label">Section</div><div className="stat-value">{profile.section || '—'}</div></div>
        <div className="stat-card blue"><div className="stat-label">Notices Sent</div><div className="stat-value">{myNotices.length}</div></div>
        <div className="stat-card red"><div className="stat-label">Pending Users</div><div className="stat-value">{pendingUsers.length}</div></div>
      </div>
      {msg.success && <div className="alert success"><i className="fas fa-check-circle"></i> {msg.success}</div>}
      {msg.error && <div className="alert error"><i className="fas fa-circle-exclamation"></i> {msg.error}</div>}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><div className="card-title"><i className="fas fa-shield-halved card-icon"></i> Pending Section Approvals</div><span className="badge badge-red">{pendingUsers.length} pending</span></div>
        {pendingUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead><tbody>
              {pendingUsers.map(u => (
                <tr key={u.id}>
                  <td><div style={{ fontWeight: 600, color: '#fff' }}>{u.full_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}><i className="fas fa-id-card"></i> {u.student_id || 'N/A'}</div></td>
                  <td><span className="badge badge-blue">{u.role}</span></td>
                  <td>{formatDateTime(u.created_at)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-sm btn-success" onClick={() => handleApproval(u.id, 'approved')}><i className="fas fa-check"></i> Approve</button>
                    <button className="btn-sm btn-danger" onClick={() => handleApproval(u.id, 'rejected')} style={{ marginLeft: '0.35rem' }}><i className="fas fa-xmark"></i> Reject</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : <div className="empty-state"><i className="fas fa-check-circle" style={{ fontSize: '2rem', color: 'var(--accent-green)' }}></i><p>All students are verified.</p></div>}
      </div>
      <CreateNoticeForm profile={profile} />
      <DeadlineWidget deadlines={deadlines} />
      {myNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-list-check card-icon"></i> My Published Notices</div><div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}><span className="badge badge-orange">{myNotices.length}</span><Link href="/notices" className="btn-sm btn-primary" style={{ fontSize: '0.75rem' }}><i className="fas fa-cog"></i> Manage</Link></div></div>
          <div className="notice-grid">{myNotices.slice(0, 6).map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
      {targetedNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-bullhorn card-icon"></i> Incoming Notices</div><span className="badge badge-blue">{targetedNotices.length}</span></div>
          <div className="notice-grid">{targetedNotices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
    </>
  );
}

function TeacherDashboard({ profile }: { profile: UserProfile }) {
  const { notices, myNotices } = useNotices(profile);
  const targetedNotices = notices.filter(n => n.sender_id !== profile.id);
  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Teacher Dashboard</h1>
        <p className="page-subtitle">Welcome, {profile.full_name}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card green"><div className="stat-label">Department</div><div className="stat-value" style={{ fontSize: '1.35rem' }}>{profile.department || 'N/A'}</div></div>
        <div className="stat-card blue"><div className="stat-label">Notices Sent</div><div className="stat-value">{myNotices.length}</div></div>
      </div>
      <CreateNoticeForm profile={profile} />
      {myNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-list-check card-icon"></i> My Notices</div><span className="badge badge-blue">{myNotices.length}</span></div>
          <div className="notice-grid">{myNotices.slice(0, 6).map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
      {targetedNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-bullhorn card-icon"></i> Incoming Notices</div></div>
          <div className="notice-grid">{targetedNotices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
    </>
  );
}

function AdminDashboard({ profile }: { profile: UserProfile }) {
  const { notices, myNotices } = useNotices(profile);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [msg, setMsg] = useState({ success: '', error: '' });
  const supabase = createClient();

  useEffect(() => {
    supabase.from('users').select('*').eq('status', 'pending').order('created_at').then(({ data }) => { if (data) setPendingUsers(data as UserProfile[]); });
  }, [supabase]);

  const handleApproval = async (userId: string, status: string) => {
    const { error } = await supabase.from('users').update({ status }).eq('id', userId);
    if (error) { setMsg({ success: '', error: error.message }); return; }
    setPendingUsers(p => p.filter(u => u.id !== userId));
    setMsg({ success: `User ${status}.`, error: '' });
  };

  const targetedNotices = notices.filter(n => n.sender_id !== profile.id);
  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System Administrator — {profile.full_name}</p>
      </div>
      <div className="stats-grid">
        <div className="stat-card red" style={{ '--c': 'var(--accent-red)' } as React.CSSProperties}><div className="stat-label">Pending Approvals</div><div className="stat-value">{pendingUsers.length}</div></div>
        <div className="stat-card blue"><div className="stat-label">Notices Sent</div><div className="stat-value">{myNotices.length}</div></div>
        <div className="stat-card green"><div className="stat-label">System</div><div className="stat-value" style={{ fontSize: '1.1rem', color: 'var(--accent-green)' }}><i className="fas fa-circle" style={{ fontSize: '0.5rem', verticalAlign: 'middle', marginRight: '0.3rem' }}></i>Online</div></div>
      </div>
      {msg.success && <div className="alert success"><i className="fas fa-check-circle"></i> {msg.success}</div>}
      {msg.error && <div className="alert error"><i className="fas fa-circle-exclamation"></i> {msg.error}</div>}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header"><div className="card-title"><i className="fas fa-shield-halved card-icon"></i> Pending Role Approvals</div><span className="badge badge-red">{pendingUsers.length} pending</span></div>
        {pendingUsers.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table"><thead><tr><th>User</th><th>Role</th><th>Department</th><th>Date</th><th style={{ textAlign: 'right' }}>Action</th></tr></thead><tbody>
              {pendingUsers.map(u => (
                <tr key={u.id}>
                  <td><div style={{ fontWeight: 600, color: '#fff' }}>{u.full_name}</div><div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', gap: '0.5rem' }}><span><i className="fas fa-id-card"></i> {u.student_id || 'N/A'}</span><span><i className="fab fa-whatsapp" style={{ color: '#25D366' }}></i> {u.whatsapp_number || 'N/A'}</span></div></td>
                  <td><span className="badge badge-blue">{getRoleDisplay(u.role)}</span></td>
                  <td>{u.department || 'N/A'}</td>
                  <td>{formatDateTime(u.created_at)}</td>
                  <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button className="btn-sm btn-success" onClick={() => handleApproval(u.id, 'approved')}><i className="fas fa-check"></i> Approve</button>
                    <button className="btn-sm btn-danger" onClick={() => handleApproval(u.id, 'rejected')} style={{ marginLeft: '0.35rem' }}><i className="fas fa-xmark"></i> Reject</button>
                  </td>
                </tr>
              ))}
            </tbody></table>
          </div>
        ) : <div className="empty-state"><i className="fas fa-inbox" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i><p>No pending approvals.</p></div>}
      </div>
      <CreateNoticeForm profile={profile} />
      {myNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-list-check card-icon"></i> Admin Notices</div><span className="badge badge-red">{myNotices.length}</span></div>
          <div className="notice-grid">{myNotices.slice(0, 6).map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
      {targetedNotices.length > 0 && (
        <div className="card notice-board-card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-bullhorn card-icon"></i> Incoming Notices</div></div>
          <div className="notice-grid">{targetedNotices.map(n => <NoticeCard key={n.id} notice={n} />)}</div>
        </div>
      )}
    </>
  );
}
