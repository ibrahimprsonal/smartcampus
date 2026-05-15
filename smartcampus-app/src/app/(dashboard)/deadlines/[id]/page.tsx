'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Deadline, DeadlineLink } from '@/types/database';
import { formatDateTime, getRoleDisplay, getPriorityColor } from '@/lib/utils';
import Link from 'next/link';

export default function DeadlineDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const [deadline, setDeadline] = useState<Deadline | null>(null);
  const [links, setLinks] = useState<DeadlineLink[]>([]);
  const [isAcked, setIsAcked] = useState(false);

  useEffect(() => {
    if (!id || !profile) return;
    const load = async () => {
      const { data } = await supabase.from('deadlines').select('*, creator:users!created_by(full_name, role, department)').eq('id', id).single();
      if (data) {
        const c = data.creator as Record<string, unknown>;
        setDeadline({ ...data, creator_name: c?.full_name as string, creator_role: c?.role, creator_department: c?.department } as Deadline);
      }
      const { data: l } = await supabase.from('deadline_links').select('*').eq('deadline_id', id).order('sort_order');
      if (l) setLinks(l as DeadlineLink[]);
      await supabase.from('deadline_reads').upsert({ deadline_id: Number(id), user_id: profile.id, is_acknowledged: false }, { onConflict: 'deadline_id,user_id', ignoreDuplicates: true });
      const { data: r } = await supabase.from('deadline_reads').select('is_acknowledged').eq('deadline_id', id).eq('user_id', profile.id).single();
      if (r) setIsAcked(r.is_acknowledged);
    };
    load();
  }, [id, profile, supabase]);

  const handleAck = async () => {
    await supabase.from('deadline_reads').upsert({ deadline_id: Number(id), user_id: profile!.id, is_acknowledged: true }, { onConflict: 'deadline_id,user_id' });
    setIsAcked(true);
  };

  if (!deadline) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div></div>;
  const isPast = new Date(deadline.due_date) < new Date();
  return (
    <>
      <Link href="/deadlines" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fas fa-arrow-left"></i> Back to Deadlines</Link>
      <h1 className="page-title" style={{ marginTop: '0.5rem' }}>{deadline.title}</h1>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
        <span className="badge" style={{ background: getPriorityColor(deadline.priority) + '22', color: getPriorityColor(deadline.priority) }}>{deadline.priority}</span>
        {deadline.subject && <span className="badge badge-blue"><i className="fas fa-book"></i> {deadline.subject}</span>}
        <span style={{ fontSize: '0.8rem', color: isPast ? 'var(--accent-red)' : 'var(--accent-orange)' }}><i className="fas fa-clock"></i> Due: {formatDateTime(deadline.due_date)}{isPast && ' (PAST DUE)'}</span>
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          {deadline.description ? <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{deadline.description}</div> : <p style={{ color: 'var(--text-muted)' }}>No description provided.</p>}
        </div>
        {links.length > 0 && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {links.map(l => <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem' }}><i className="fas fa-external-link-alt"></i> {l.button_text}</a>)}
          </div>
        )}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Created by {deadline.creator_name} ({getRoleDisplay(deadline.creator_role!)}) · {formatDateTime(deadline.created_at)}
        </div>
      </div>
      {!isAcked ? <button className="btn btn-success" onClick={handleAck}><i className="fas fa-check-double"></i> Acknowledge</button> : <div className="alert success"><i className="fas fa-check-double"></i> Acknowledged</div>}
    </>
  );
}
