'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getRoleDisplay } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, isLoading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadNotif, setUnreadNotif] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);
  const supabase = createClient();

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  // Badge polling
  useEffect(() => {
    if (!user) return;
    const fetchBadges = async () => {
      const [n, m] = await Promise.all([
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false).eq('status', 'accepted'),
      ]);
      setUnreadNotif(n.count ?? 0);
      setUnreadMsg(m.count ?? 0);
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 15000);
    return () => clearInterval(interval);
  }, [user, supabase]);

  if (isLoading) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div><span>Loading Smart Campus...</span></div>;

  if (!profile) {
    return (
      <div className="loading-screen">
        <div style={{textAlign: 'center', color: '#fff'}}>
          <div style={{marginBottom: '1rem', fontSize: '1.2rem'}}><i className="fas fa-exclamation-circle" style={{color: 'var(--accent-orange)'}}></i> Failed to load user profile</div>
          <button onClick={async () => { await signOut(); router.push('/login'); }} style={{padding: '0.75rem 1.5rem', background: 'var(--accent)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 600}}>
            Sign Out & Try Again
          </button>
        </div>
      </div>
    );
  }

  const role = profile.role;
  const isActive = (path: string) => pathname === path ? 'active' : '';
  const toggle = () => setSidebarOpen(!sidebarOpen);
  const closeOnMobile = () => { if (window.innerWidth <= 768) setSidebarOpen(false); };

  const handleSignOut = async () => { await signOut(); router.push('/login'); };

  return (
    <>
      <div className="mobile-header">
        <div className="brand"><i className="fas fa-graduation-cap"></i> Smart Campus</div>
        <button className="hamburger" onClick={toggle}><i className="fas fa-bars"></i></button>
      </div>
      <div className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={toggle}></div>
      <div className="dashboard-layout">
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-brand">
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
              <div className="brand-icon"><i className="fas fa-graduation-cap"></i></div>
              Smart Campus
            </div>
            <button className="hamburger sidebar-close-btn" onClick={toggle} style={{display:'none',background:'none',border:'none',color:'#fff',fontSize:'1.25rem',cursor:'pointer'}}><i className="fas fa-times"></i></button>
          </div>
          <div className={`user-info role-${role}`}>
            <strong>{profile.full_name}</strong>
            <span className="role-badge">{getRoleDisplay(role)}</span>
          </div>
          <ul className="nav-links">
            <li><Link href="/dashboard" className={isActive('/dashboard')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-house"></i></span> Dashboard</Link></li>
            <li><Link href="/search" className={isActive('/search')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-search"></i></span> Global Search</Link></li>
            <li><Link href="/profile" className={isActive('/profile')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-user"></i></span> My Profile</Link></li>
            <li><Link href="/notifications" className={isActive('/notifications')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-bell"></i></span> Notifications {unreadNotif > 0 && <span className="nav-badge">{unreadNotif}</span>}</Link></li>
            <li className="nav-section">Communication</li>
            <li><Link href="/messages" className={isActive('/messages')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-envelope"></i></span> Messages {unreadMsg > 0 && <span className="nav-badge" style={{background:'var(--accent)'}}>{unreadMsg}</span>}</Link></li>
            <li><Link href="/discussion" className={isActive('/discussion')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-comments"></i></span> Discussion</Link></li>
            {(role === 'cr' || role === 'acr') && <li><Link href="/cr-acr-chat" className={isActive('/cr-acr-chat')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-crown" style={{color:'var(--accent-orange)'}}></i></span> CR ACR Discussion</Link></li>}
            {['cr','acr','teacher','super_admin'].includes(role) && (
              <>
                <li className="nav-section">Management</li>
                <li><Link href="/notices" className={isActive('/notices')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-newspaper"></i></span> Manage Notices</Link></li>
                <li><Link href="/deadlines" className={isActive('/deadlines')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-clock"></i></span> Manage Deadlines</Link></li>
                <li><Link href="/calendar" className={isActive('/calendar')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-calendar-alt"></i></span> Calendar View</Link></li>
              </>
            )}
            {role === 'student' && (
              <>
                <li className="nav-section">Academic</li>
                <li><Link href="/deadlines" className={isActive('/deadlines')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-clock"></i></span> Deadlines</Link></li>
                <li><Link href="/calendar" className={isActive('/calendar')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-calendar-alt"></i></span> Academic Calendar</Link></li>
              </>
            )}
            {['super_admin','cr','acr'].includes(role) && (
              <>
                <li className="nav-section">Administration</li>
                {role === 'super_admin' && (
                  <>
                    <li><Link href="/analytics" className={isActive('/analytics')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-chart-pie"></i></span> Analytics</Link></li>
                    <li><Link href="/departments" className={isActive('/departments')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-building-columns"></i></span> Manage Departments</Link></li>
                    <li><Link href="/audit-logs" className={isActive('/audit-logs')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-history"></i></span> Audit Logs</Link></li>
                  </>
                )}
                <li><Link href="/users" className={isActive('/users')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-users"></i></span> {role === 'super_admin' ? 'All Users' : 'Section Users'}</Link></li>
                {(role === 'cr' || role === 'acr') && <li><Link href="/section-requests" className={isActive('/section-requests')} onClick={closeOnMobile}><span className="nav-icon"><i className="fas fa-exchange-alt"></i></span> Section Requests</Link></li>}
              </>
            )}
          </ul>
          <button onClick={handleSignOut} className="logout-btn"><i className="fas fa-right-from-bracket"></i> Sign Out</button>
        </aside>
        <main className="main-content fade-in">{children}</main>
      </div>
    </>
  );
}
