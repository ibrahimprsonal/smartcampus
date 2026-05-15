'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { CrAcrChatPost } from '@/types/database';
import { formatRelativeTime, getRoleDisplay } from '@/lib/utils';

export default function CrAcrChatPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [posts, setPosts] = useState<CrAcrChatPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [replyTo, setReplyTo] = useState<CrAcrChatPost | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  const loadPosts = async () => {
    const { data } = await supabase.from('cr_acr_chat').select('*, user:users!user_id(full_name, role, section, department), parent:cr_acr_chat!parent_id(content, puser:users!user_id(full_name, role, section))').order('created_at').limit(200);
    if (data) {
      setPosts(data.map((p: Record<string, unknown>) => ({
        ...p, full_name: (p.user as Record<string, unknown>)?.full_name, role: (p.user as Record<string, unknown>)?.role,
        section: (p.user as Record<string, unknown>)?.section, department: (p.user as Record<string, unknown>)?.department,
        parent_content: (p.parent as Record<string, unknown>)?.content,
        parent_name: ((p.parent as Record<string, unknown>)?.puser as Record<string, unknown>)?.full_name,
        parent_role: ((p.parent as Record<string, unknown>)?.puser as Record<string, unknown>)?.role,
        parent_section: ((p.parent as Record<string, unknown>)?.puser as Record<string, unknown>)?.section,
      })) as CrAcrChatPost[]);
    }
  };

  useEffect(() => { loadPosts(); const i = setInterval(loadPosts, 5000); return () => clearInterval(i); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [posts]);

  const handlePost = async () => {
    if (!newPost.trim() || !profile) return;
    await supabase.from('cr_acr_chat').insert({ user_id: profile.id, content: newPost.trim().substring(0, 1000), parent_id: replyTo?.id || null });
    setNewPost(''); setReplyTo(null); loadPosts();
  };

  if (!profile || !['cr', 'acr'].includes(profile.role)) return <div className="card"><div className="empty-state"><p>Access restricted to CR and ACR.</p></div></div>;

  return (
    <>
      <h1 className="page-title">CR / ACR Discussion</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Private group chat for Class Representatives</p>
      <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 12rem)' }}>
        <div className="chat-container" style={{ flex: 1 }}>
          {posts.map(p => (
            <div key={p.id} className={`chat-bubble ${p.user_id === profile.id ? 'mine' : 'other'}`}>
              {p.user_id !== profile.id && <div className="chat-sender" style={{ color: 'var(--accent-orange)' }}>{p.full_name}.{getRoleDisplay(p.role!)}.{p.section}</div>}
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
            <span>Replying to <strong>{replyTo.full_name}</strong></span>
            <button onClick={() => setReplyTo(null)} style={{ background: 'none', border: 'none', color: 'var(--accent-red)', cursor: 'pointer' }}><i className="fas fa-times"></i></button>
          </div>
        )}
        <div className="chat-input-bar">
          <input value={newPost} onChange={e => setNewPost(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePost()} placeholder="Message CRs and ACRs..." maxLength={1000} />
          <button className="btn btn-primary" onClick={handlePost} style={{ padding: '0.6rem 1rem' }}><i className="fas fa-paper-plane"></i></button>
        </div>
      </div>
    </>
  );
}
