'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Deadline } from '@/types/database';
import { getPriorityColor } from '@/lib/utils';

export default function CalendarPage() {
  const { profile } = useAuth();
  const supabase = createClient();
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    if (!profile) return;
    supabase.from('deadlines').select('*').order('due_date').then(({ data }) => {
      if (data) {
        const filtered = (data as Deadline[]).filter(d => {
          if (profile.role === 'super_admin' || d.created_by === profile.id) return true;
          const dm = !d.target_department || d.target_department === profile.department;
          const sm = !d.target_semester || d.target_semester === profile.semester;
          const sc = !d.target_section || d.target_section === profile.section;
          return dm && sm && sc;
        });
        setDeadlines(filtered);
      }
    });
  }, [profile, supabase]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();

  const getDeadlinesForDay = (day: number) => {
    return deadlines.filter(d => {
      const dd = new Date(d.due_date);
      return dd.getFullYear() === year && dd.getMonth() === month && dd.getDate() === day;
    });
  };

  const prev = () => setCurrentMonth(new Date(year, month - 1));
  const next = () => setCurrentMonth(new Date(year, month + 1));
  const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <>
      <h1 className="page-title">Academic Calendar</h1>
      <p className="page-subtitle" style={{ marginBottom: '1.5rem' }}>Deadlines at a glance</p>
      <div className="card">
        <div className="card-header">
          <button className="btn-sm btn-secondary" onClick={prev} style={{ border: '1px solid var(--border)' }}><i className="fas fa-chevron-left"></i></button>
          <div className="card-title">{monthName}</div>
          <button className="btn-sm btn-secondary" onClick={next} style={{ border: '1px solid var(--border)' }}><i className="fas fa-chevron-right"></i></button>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {days.map(d => <div key={d} style={{ textAlign: 'center', padding: '0.5rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d}</div>)}
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`}></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dl = getDeadlinesForDay(day);
              const isToday = today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;
              return (
                <div key={day} style={{ minHeight: 70, padding: '0.35rem', border: '1px solid var(--border)', borderRadius: 6, background: isToday ? 'rgba(88,166,255,0.05)' : 'transparent' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: isToday ? 700 : 500, color: isToday ? 'var(--accent)' : 'var(--text-secondary)', marginBottom: '0.2rem' }}>{day}</div>
                  {dl.map(d => (
                    <div key={d.id} style={{ fontSize: '0.6rem', padding: '0.15rem 0.3rem', borderRadius: 4, marginBottom: '0.15rem', background: getPriorityColor(d.priority) + '22', color: getPriorityColor(d.priority), fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
