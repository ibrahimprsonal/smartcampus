'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export default function AnalyticsPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [stats, setStats] = useState({ totalUsers: 0, students: 0, crs: 0, acrs: 0, teachers: 0, admins: 0, pending: 0, notices: 0, deadlines: 0, departments: 0 });

  useEffect(() => {
    if (!profile || profile.role !== 'super_admin') return;
    const load = async () => {
      const [u, n, d, dept] = await Promise.all([
        supabase.from('users').select('role, status'),
        supabase.from('notices').select('id', { count: 'exact', head: true }),
        supabase.from('deadlines').select('id', { count: 'exact', head: true }),
        supabase.from('departments').select('id', { count: 'exact', head: true }),
      ]);
      const users = (u.data || []) as { role: string; status: string }[];
      setStats({
        totalUsers: users.length, students: users.filter(x => x.role === 'student').length,
        crs: users.filter(x => x.role === 'cr').length, acrs: users.filter(x => x.role === 'acr').length,
        teachers: users.filter(x => x.role === 'teacher').length, admins: users.filter(x => x.role === 'super_admin').length,
        pending: users.filter(x => x.status === 'pending').length,
        notices: n.count || 0, deadlines: d.count || 0, departments: dept.count || 0,
      });
    };
    load();
  }, [profile, supabase]);

  if (!profile || profile.role !== 'super_admin') return <div className="card"><div className="empty-state"><p>Admin access only.</p></div></div>;

  return (
    <>
      <h1 className="page-title">Analytics</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>System overview</p>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-label">Total Users</div><div className="stat-value">{stats.totalUsers}</div></div>
        <div className="stat-card green"><div className="stat-label">Students</div><div className="stat-value">{stats.students}</div></div>
        <div className="stat-card orange"><div className="stat-label">CRs</div><div className="stat-value">{stats.crs}</div></div>
        <div className="stat-card purple"><div className="stat-label">ACRs</div><div className="stat-value">{stats.acrs}</div></div>
        <div className="stat-card green"><div className="stat-label">Teachers</div><div className="stat-value">{stats.teachers}</div></div>
        <div className="stat-card red"><div className="stat-label">Pending</div><div className="stat-value">{stats.pending}</div></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card blue"><div className="stat-label">Total Notices</div><div className="stat-value">{stats.notices}</div></div>
        <div className="stat-card orange"><div className="stat-label">Total Deadlines</div><div className="stat-value">{stats.deadlines}</div></div>
        <div className="stat-card purple"><div className="stat-label">Departments</div><div className="stat-value">{stats.departments}</div></div>
      </div>
    </>
  );
}
