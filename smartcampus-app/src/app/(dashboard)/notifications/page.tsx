'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notification } from '@/types/database';
import { formatRelativeTime } from '@/lib/utils';
import Link from 'next/link';

export default function NotificationsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }).limit(100).then(({ data }) => {
      if (data) setNotifications(data as Notification[]);
    });
  }, [profile, supabase]);

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile!.id).eq('is_read', false);
    setNotifications(p => p.map(n => ({ ...n, is_read: true })));
  };

  const markRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(p => p.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  if (!profile) return null;
  const unread = notifications.filter(n => !n.is_read).length;
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div><h1 className="page-title">Notifications</h1><p className="page-subtitle">{unread} unread</p></div>
        {unread > 0 && <button className="btn btn-secondary" onClick={markAllRead}><i className="fas fa-check-double"></i> Mark All Read</button>}
      </div>
      <div className="card">
        {notifications.length > 0 ? notifications.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)} style={{ padding: '0.85rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'flex-start', background: n.is_read ? 'transparent' : 'rgba(88,166,255,0.03)', cursor: 'pointer' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: n.is_read ? 'transparent' : 'var(--accent)', marginTop: '0.5rem', flexShrink: 0 }}></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: n.is_read ? 500 : 700, color: n.is_read ? 'var(--text-secondary)' : '#fff', fontSize: '0.85rem' }}>
                {n.link ? <Link href={n.link} style={{ color: 'inherit' }}>{n.title}</Link> : n.title}
              </div>
              {n.message && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{n.message}</div>}
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{formatRelativeTime(n.created_at)}</div>
            </div>
          </div>
        )) : <div className="empty-state"><i className="fas fa-bell-slash" style={{ fontSize: '2rem' }}></i><p>No notifications yet.</p></div>}
      </div>
    </>
  );
}
