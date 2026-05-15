'use client';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notice, NoticeLink } from '@/types/database';
import { formatDateTime, getRoleDisplay } from '@/lib/utils';
import Link from 'next/link';

export default function NoticeDetailPage() {
  const { id } = useParams();
  const { profile } = useAuth();
  const supabase = createClient();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [links, setLinks] = useState<NoticeLink[]>([]);
  const [isAcknowledged, setIsAcknowledged] = useState(false);
  const [receiptStats, setReceiptStats] = useState<{total_target:number,read_count:number,ack_count:number,details:{full_name:string,is_acknowledged:boolean}[]} | null>(null);

  useEffect(() => {
    if (!id || !profile) return;
    const fetch = async () => {
      const { data } = await supabase.from('notices').select('*, sender:users!sender_id(full_name, role, department)').eq('id', id).single();
      if (data) {
        const sender = data.sender as Record<string, unknown>;
        setNotice({ ...data, sender_name: sender?.full_name as string, sender_role: sender?.role, sender_department: sender?.department } as Notice);
      }
      const { data: l } = await supabase.from('notice_links').select('*').eq('notice_id', id).order('sort_order');
      if (l) setLinks(l as NoticeLink[]);
      // Mark as read
      await supabase.from('notice_reads').upsert({ notice_id: Number(id), user_id: profile.id, is_acknowledged: false }, { onConflict: 'notice_id,user_id', ignoreDuplicates: true });
      // Check acknowledgment
      const { data: r } = await supabase.from('notice_reads').select('is_acknowledged').eq('notice_id', id).eq('user_id', profile.id).single();
      if (r) setIsAcknowledged(r.is_acknowledged);
      // Receipt stats for sender/admin
      if (profile.role === 'super_admin' || data?.sender_id === profile.id) {
        const { data: reads } = await supabase.from('notice_reads').select('is_acknowledged, user:users!user_id(full_name)').eq('notice_id', id);
        const { count } = await supabase.from('users').select('id', { count: 'exact', head: true }).eq('status', 'approved').neq('role', 'super_admin');
        setReceiptStats({
          total_target: count || 0, read_count: reads?.length || 0,
          ack_count: reads?.filter((r: Record<string, unknown>) => r.is_acknowledged).length || 0,
          details: reads?.map((r: Record<string, unknown>) => ({ full_name: ((r.user as Record<string, unknown>)?.full_name as string) || 'Unknown', is_acknowledged: r.is_acknowledged as boolean })) || [],
        });
      }
    };
    fetch();
  }, [id, profile, supabase]);

  const handleAcknowledge = async () => {
    await supabase.from('notice_reads').upsert({ notice_id: Number(id), user_id: profile!.id, is_acknowledged: true }, { onConflict: 'notice_id,user_id' });
    setIsAcknowledged(true);
  };

  if (!notice) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div></div>;

  return (
    <>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link href="/dashboard" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}><i className="fas fa-arrow-left"></i> Back to Dashboard</Link>
        <h1 className="page-title" style={{ marginTop: '0.5rem' }}>{notice.title}</h1>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.5rem', flexWrap: 'wrap' }}>
          {notice.is_global && <span className="badge badge-orange">Global</span>}
          {!notice.is_global && <span className="badge badge-blue">{(notice.target_department || 'All') + '/' + (notice.target_section || 'All')}</span>}
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><i className="far fa-clock"></i> {formatDateTime(notice.created_at)}</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}><i className="fas fa-user"></i> {notice.sender_name} ({getRoleDisplay(notice.sender_role!)})</span>
        </div>
      </div>
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-body">
          <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: 'var(--text-primary)' }}>{notice.content}</div>
        </div>
        {links.length > 0 && (
          <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {links.map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary" style={{ fontSize: '0.85rem' }}>
                <i className="fas fa-external-link-alt"></i> {l.button_text}
              </a>
            ))}
          </div>
        )}
      </div>
      {!isAcknowledged ? (
        <button className="btn btn-success" onClick={handleAcknowledge}><i className="fas fa-check-double"></i> Acknowledge Notice</button>
      ) : (
        <div className="alert success"><i className="fas fa-check-double"></i> You have acknowledged this notice.</div>
      )}
      {receiptStats && (
        <div className="card" style={{ marginTop: '1.5rem' }}>
          <div className="card-header"><div className="card-title"><i className="fas fa-chart-bar card-icon"></i> Read Receipts</div></div>
          <div className="card-body">
            <div className="stats-grid" style={{ marginBottom: '1rem' }}>
              <div className="stat-card blue"><div className="stat-label">Target Audience</div><div className="stat-value">{receiptStats.total_target}</div></div>
              <div className="stat-card green"><div className="stat-label">Read</div><div className="stat-value">{receiptStats.read_count}</div></div>
              <div className="stat-card purple"><div className="stat-label">Acknowledged</div><div className="stat-value">{receiptStats.ack_count}</div></div>
            </div>
            {receiptStats.details.length > 0 && (
              <table className="data-table"><thead><tr><th>Name</th><th>Acknowledged</th></tr></thead><tbody>
                {receiptStats.details.map((d, i) => (
                  <tr key={i}><td>{d.full_name}</td><td>{d.is_acknowledged ? <span className="badge badge-green">Yes</span> : <span className="badge badge-orange">No</span>}</td></tr>
                ))}
              </tbody></table>
            )}
          </div>
        </div>
      )}
    </>
  );
}
