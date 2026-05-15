'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Notice, Deadline } from '@/types/database';
import { formatDateTime, truncate } from '@/lib/utils';
import Link from 'next/link';

export default function SearchPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [query, setQuery] = useState('');
  const [notices, setNotices] = useState<Notice[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!query.trim() || !profile) return;
    setSearched(true);
    const q = `%${query.trim()}%`;
    const { data: n } = await supabase.from('notices').select('*, sender:users!sender_id(full_name)').or(`title.ilike.${q},content.ilike.${q}`).order('created_at', { ascending: false }).limit(20);
    if (n) setNotices(n.map((x: Record<string, unknown>) => ({ ...x, sender_name: (x.sender as Record<string, unknown>)?.full_name })) as Notice[]);
    const { data: d } = await supabase.from('deadlines').select('*, creator:users!created_by(full_name)').or(`title.ilike.${q},description.ilike.${q},subject.ilike.${q}`).order('due_date', { ascending: false }).limit(20);
    if (d) setDeadlines(d.map((x: Record<string, unknown>) => ({ ...x, creator_name: (x.creator as Record<string, unknown>)?.full_name })) as Deadline[]);
  };

  return (
    <>
      <h1 className="page-title">Global Search</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Search across notices and deadlines</p>
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <input className="form-input" value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()} placeholder="Search..." style={{ flex: 1 }} />
        <button className="btn btn-primary" onClick={handleSearch}><i className="fas fa-search"></i> Search</button>
      </div>
      {searched && (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header"><div className="card-title"><i className="fas fa-newspaper card-icon"></i> Notices</div><span className="badge badge-blue">{notices.length}</span></div>
            {notices.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table"><thead><tr><th>Title</th><th>By</th><th>Date</th></tr></thead><tbody>
                  {notices.map(n => (
                    <tr key={n.id}><td><Link href={`/notices/${n.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{truncate(n.title, 60)}</Link></td><td>{n.sender_name}</td><td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(n.created_at)}</td></tr>
                  ))}
                </tbody></table>
              </div>
            ) : <div className="empty-state"><p>No notices found.</p></div>}
          </div>
          <div className="card">
            <div className="card-header"><div className="card-title"><i className="fas fa-clock card-icon" style={{ color: 'var(--accent-orange)' }}></i> Deadlines</div><span className="badge badge-orange">{deadlines.length}</span></div>
            {deadlines.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table"><thead><tr><th>Title</th><th>Subject</th><th>Due</th></tr></thead><tbody>
                  {deadlines.map(d => (
                    <tr key={d.id}><td><Link href={`/deadlines/${d.id}`} style={{ color: 'var(--accent)', fontWeight: 600 }}>{truncate(d.title, 60)}</Link></td><td>{d.subject || '—'}</td><td style={{ whiteSpace: 'nowrap' }}>{formatDateTime(d.due_date)}</td></tr>
                  ))}
                </tbody></table>
              </div>
            ) : <div className="empty-state"><p>No deadlines found.</p></div>}
          </div>
        </>
      )}
    </>
  );
}
