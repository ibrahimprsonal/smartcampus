'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { DiscussionPost } from '@/types/database';
import { formatRelativeTime, getInitial, getRoleDisplay } from '@/lib/utils';

export default function DiscussionPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [posts, setPosts] = useState<DiscussionPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [replyTo, setReplyTo] = useState<DiscussionPost | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const loadPosts = async () => {
    if (!profile?.department || !profile?.section) return;
    const { data } = await supabase.from('discussion_posts').select('*, user:users!user_id(full_name, role), parent:discussion_posts!parent_id(content, puser:users!user_id(full_name))').eq('department', profile.department).eq('section', profile.section).order('created_at').limit(100);
    if (data) {
      setPosts(data.map((p: Record<string, unknown>) => ({
        ...p,
        full_name: (p.user as Record<string, unknown>)?.full_name,
        role: (p.user as Record<string, unknown>)?.role,
        parent_content: (p.parent as Record<string, unknown>)?.content,
        parent_name: ((p.parent as Record<string, unknown>)?.puser as Record<string, unknown>)?.full_name,
      })) as DiscussionPost[]);
    }
  };

  useEffect(() => { loadPosts(); const i = setInterval(loadPosts, 5000); return () => clearInterval(i); }, [profile]);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [posts]);

  const handlePost = async () => {
    if (!newPost.trim() || !profile) return;
    const content = newPost.trim().substring(0, 1000);
    await supabase.from('discussion_posts').insert({ section: profile.section!, department: profile.department!, user_id: profile.id, content, parent_id: replyTo?.id || null });
    setNewPost(''); setReplyTo(null); loadPosts();
  };

  if (!profile) return null;
  if (!profile.department || !profile.section) return <div className="card"><div className="empty-state"><p>You need a department and section to access discussions.</p></div></div>;

  return (
    <>
      <h1 className="page-title">Discussion</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>{profile.department} — Section {profile.section}</p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12rem)' }}>
        <div className="chat-container" style={{ flex: 1 }}>
          {posts.map(p => (
            <div key={p.id} className={`chat-bubble ${p.user_id === profile.id ? 'mine' : 'other'}`}>
              {p.user_id !== profile.id && <div className="chat-sender" style={{ color: 'var(--accent)' }}>{p.full_name} <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>· {getRoleDisplay(p.role!)}</span></div>}
              {p.parent_content && <div className="chat-reply-quote"><strong>{p.parent_name}:</strong> {p.parent_content?.substring(0, 80)}</div>}
              <div>{p.content}</div>
              <div className="chat-time" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={() => setReplyTo(p)} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.6rem' }}>Reply</button>
                {formatRelativeTime(p.created_at)}
              </div>
            </div>
          ))}
          <div ref={chatEnd}></div>
        </div>
        {replyTo && (
          <div style={{ padding: '0.5rem 1rem', background: 'var(--bg-hover)', borderTop: '1px solid var(--border)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
            <span>Replying to <strong>{replyTo.full_name}</strong>: {replyTo.content?.substring(0, 50)}...</span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
          </div>
        )}
        <div className="chat-input-bar">
          <input value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()} placeholder="Write a message..." maxLength={1000} />
          <button className="btn btn-primary" onClick={handlePost} style={{ padding: '0.6rem 1rem' }}><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </>
  );
}
