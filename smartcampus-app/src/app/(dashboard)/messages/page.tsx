'use client';
import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Message, InboxConversation, UserProfile } from '@/types/database';
import { formatRelativeTime, getInitial } from '@/lib/utils';

export default function MessagesPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [inbox, setInbox] = useState<InboxConversation[]>([]);
  const [pendingReqs, setPendingReqs] = useState<{id:number,requester_name:string}[]>([]);
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [chatUser, setChatUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!profile) return;
    loadInbox();
    loadPending();
  }, [profile]);

  useEffect(() => {
    if (!chatWith || !profile) return;
    loadChat();
    const interval = setInterval(loadChat, 5000);
    return () => clearInterval(interval);
  }, [chatWith, profile]);

  useEffect(() => { chatEnd.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const loadInbox = async () => {
    if (!profile) return;
    const { data } = await supabase.from('conversation_requests').select('*, ua:users!user_a(full_name), ub:users!user_b(full_name)').or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`).eq('status', 'accepted');
    if (data) {
      const mapped = data.map((c: Record<string, unknown>) => {
        const isA = c.user_a === profile.id;
        return { ...c, other_name: isA ? (c.ub as Record<string, unknown>)?.full_name : (c.ua as Record<string, unknown>)?.full_name, other_id: isA ? c.user_b : c.user_a, last_message: null, unread_count: 0 };
      }) as InboxConversation[];
      setInbox(mapped);
    }
  };

  const loadPending = async () => {
    if (!profile) return;
    const { data } = await supabase.from('conversation_requests').select('*, req:users!initiated_by(full_name)').or(`user_a.eq.${profile.id},user_b.eq.${profile.id}`).neq('initiated_by', profile.id).eq('status', 'pending');
    if (data) setPendingReqs(data.map((r: Record<string, unknown>) => ({ id: r.id as number, requester_name: ((r.req as Record<string, unknown>)?.full_name as string) || 'Unknown' })));
  };

  const loadChat = async () => {
    if (!chatWith || !profile) return;
    const { data: u } = await supabase.from('users').select('*').eq('id', chatWith).single();
    if (u) setChatUser(u as UserProfile);
    const { data } = await supabase.from('messages').select('*, sender:users!sender_id(full_name)').or(`and(sender_id.eq.${profile.id},receiver_id.eq.${chatWith}),and(sender_id.eq.${chatWith},receiver_id.eq.${profile.id})`).eq('status', 'accepted').order('created_at');
    if (data) setMessages(data.map((m: Record<string, unknown>) => ({ ...m, sender_name: (m.sender as Record<string, unknown>)?.full_name })) as Message[]);
    await supabase.from('messages').update({ is_read: true }).eq('sender_id', chatWith).eq('receiver_id', profile.id).eq('is_read', false);
  };

  const sendMessage = async () => {
    if (!newMsg.trim() || !chatWith || !profile) return;
    const content = newMsg.trim().substring(0, 1000);
    // Check conversation exists
    const a = profile.id < chatWith ? profile.id : chatWith;
    const b = profile.id < chatWith ? chatWith : profile.id;
    const { data: conv } = await supabase.from('conversation_requests').select('*').eq('user_a', a).eq('user_b', b).single();
    if (!conv) {
      await supabase.from('conversation_requests').insert({ user_a: a, user_b: b, status: 'pending', initiated_by: profile.id });
    }
    const status = conv?.status === 'accepted' ? 'accepted' : 'pending';
    await supabase.from('messages').insert({ sender_id: profile.id, receiver_id: chatWith, content, status });
    setNewMsg('');
    loadChat();
  };

  const acceptRequest = async (convId: number) => {
    await supabase.from('conversation_requests').update({ status: 'accepted' }).eq('id', convId);
    loadInbox(); loadPending();
  };

  const searchUsers = async (q: string) => {
    setSearchQ(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase.from('users').select('*').neq('id', profile!.id).eq('status', 'approved').or(`full_name.ilike.%${q}%,email.ilike.%${q}%,student_id.ilike.%${q}%`).limit(10);
    if (data) setSearchResults(data as UserProfile[]);
  };

  const startChat = async (userId: string) => {
    const a = profile!.id < userId ? profile!.id : userId;
    const b = profile!.id < userId ? userId : profile!.id;
    const { data: existing } = await supabase.from('conversation_requests').select('*').eq('user_a', a).eq('user_b', b).single();
    if (!existing) await supabase.from('conversation_requests').insert({ user_a: a, user_b: b, status: 'pending', initiated_by: profile!.id });
    setChatWith(userId);
    setSearchQ(''); setSearchResults([]);
    loadInbox();
  };

  if (!profile) return null;

  return (
    <div style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - 6rem)' }}>
      {/* Sidebar */}
      <div className="card" style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '1rem' }}>
          <input className="form-input" placeholder="Search users..." value={searchQ} onChange={e => searchUsers(e.target.value)} style={{ fontSize: '0.8rem' }} />
        </div>
        {searchResults.length > 0 && (
          <div style={{ padding: '0 0.5rem', maxHeight: '200px', overflowY: 'auto' }}>
            {searchResults.map(u => (
              <div key={u.id} onClick={() => startChat(u.id)} style={{ padding: '0.5rem', cursor: 'pointer', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem' }} className="deadline-item">
                <div className="notice-card-sender-avatar">{getInitial(u.full_name)}</div>
                <div><div style={{ fontWeight: 600, color: '#fff' }}>{u.full_name}</div><div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{u.department} · {u.role}</div></div>
              </div>
            ))}
          </div>
        )}
        {pendingReqs.length > 0 && (
          <div style={{ padding: '0.5rem', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-orange)', padding: '0.25rem 0.5rem' }}>PENDING REQUESTS</div>
            {pendingReqs.map(r => (
              <div key={r.id} style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem' }}>{r.requester_name}</span>
                <button className="btn-sm btn-success" onClick={() => acceptRequest(r.id)}>Accept</button>
              </div>
            ))}
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {inbox.map(c => (
            <div key={c.id} onClick={() => setChatWith(c.other_id)} style={{ padding: '0.75rem 1rem', cursor: 'pointer', borderBottom: '1px solid var(--border)', background: chatWith === c.other_id ? 'var(--bg-hover)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="notice-card-sender-avatar">{getInitial(c.other_name)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>{c.other_name}</div>
                  {c.last_message && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message}</div>}
                </div>
              </div>
            </div>
          ))}
          {!inbox.length && <div className="empty-state"><p>No conversations yet.</p></div>}
        </div>
      </div>
      {/* Chat area */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {chatWith && chatUser ? (
          <>
            <div className="card-header">
              <div className="card-title"><div className="notice-card-sender-avatar" style={{ marginRight: '0.5rem' }}>{getInitial(chatUser.full_name)}</div>{chatUser.full_name}</div>
              <span className="badge badge-blue">{chatUser.role}</span>
            </div>
            <div className="chat-container" style={{ flex: 1 }}>
              {messages.map(m => (
                <div key={m.id} className={`chat-bubble ${m.sender_id === profile.id ? 'mine' : 'other'}`}>
                  {m.sender_id !== profile.id && <div className="chat-sender">{m.sender_name}</div>}
                  <div>{m.content}</div>
                  <div className="chat-time">{formatRelativeTime(m.created_at)}</div>
                </div>
              ))}
              <div ref={chatEnd}></div>
            </div>
            <div className="chat-input-bar">
              <input value={newMsg} onChange={e => setNewMsg(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Type a message..." maxLength={1000} />
              <button className="btn btn-primary" onClick={sendMessage} style={{ padding: '0.6rem 1rem' }}><i className="fas fa-paper-plane"></i></button>
            </div>
          </>
        ) : (
          <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div><i className="fas fa-comments" style={{ fontSize: '3rem', color: 'var(--text-muted)', marginBottom: '1rem' }}></i><p>Select a conversation or search for a user</p></div>
          </div>
        )}
      </div>
    </div>
  );
}
