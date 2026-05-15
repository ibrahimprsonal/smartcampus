'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { Department } from '@/types/database';

export default function RegisterPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const supabase = createClient();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [form, setForm] = useState({ student_id:'', full_name:'', email:'', password:'', role:'student', department:'', semester:'', section:'', whatsapp_number:'', address:'' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user && profile) router.push('/dashboard');
  }, [user, profile, isLoading, router]);

  useEffect(() => {
    supabase.from('departments').select('*').order('name').then(({ data }) => {
      if (data) setDepartments(data);
    });
  }, [supabase]);

  const set = (key: string, val: string) => setForm(p => ({ ...p, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setSuccess('');
    const { student_id, full_name, email, password, role, department, semester, section } = form;
    if (!full_name || !email || !password) { setError('Full name, email, and password are required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (role !== 'super_admin' && !department) { setError('Department is required.'); return; }
    if (['student','cr','acr'].includes(role) && (!semester || !section)) { setError('Semester and Section required for this role.'); return; }
    if (role !== 'teacher' && !student_id) { setError('Student ID is required.'); return; }

    setLoading(true);
    // First sign up with Supabase Auth
    const { error: authError } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name } }
    });
    if (authError) { setError(authError.message); setLoading(false); return; }

    // Wait a moment for the trigger to create the user row, then update profile
    await new Promise(r => setTimeout(r, 1500));
    const { data: { user: newUser } } = await supabase.auth.getUser();
    if (newUser) {
      await supabase.from('users').update({
        student_id: role === 'teacher' ? null : student_id,
        role, department: department || null,
        semester: semester ? parseInt(semester) : null,
        section: section || null,
        whatsapp_number: form.whatsapp_number || null,
        address: form.address || null,
      }).eq('id', newUser.id);
    }
    setSuccess('Registration successful! Your account is pending approval.');
    setLoading(false);
    // Sign out after registration since account needs approval
    await supabase.auth.signOut();
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div></div>;

  const getSemesterLabel = (sem: number) => {
    if (sem === 1) return '1st';
    if (sem === 2) return '2nd';
    if (sem === 3) return '3rd';
    return `${sem}th`;
  };

  const getSectionOptions = (semStr: string) => {
    if (!semStr) return [];
    const sem = parseInt(semStr);
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    return letters.map(letter => `${sem}${letter}`);
  };

  const sectionOptions = getSectionOptions(form.semester);

  const showStudentFields = ['student','cr','acr'].includes(form.role);
  const showStudentId = form.role !== 'teacher';

  return (
    <div className="auth-container">
      <div className="auth-card wide">
        <div className="auth-brand">
          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,var(--accent),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',color:'#fff',margin:'0 auto'}}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h1>Create Account</h1>
          <p>Join Smart Campus</p>
        </div>
        {error && <div className="alert error"><i className="fas fa-circle-exclamation"></i> {error}</div>}
        {success && <div className="alert success"><i className="fas fa-check-circle"></i> {success}</div>}
        {!success && (
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <input className="form-input" value={form.full_name} onChange={e => set('full_name', e.target.value)} placeholder="Your full name" />
            </div>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="you@university.edu" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="student">Student</option>
                <option value="cr">CR (Class Representative)</option>
                <option value="acr">ACR (Assistant CR)</option>
                <option value="teacher">Teacher</option>
              </select>
            </div>
          </div>
          {showStudentId && (
            <div className="form-group">
              <label className="form-label">Student ID *</label>
              <input className="form-input" value={form.student_id} onChange={e => set('student_id', e.target.value)} placeholder="11-digit Student ID" />
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Department {form.role !== 'super_admin' ? '*' : ''}</label>
              <select className="form-input form-select" value={form.department} onChange={e => set('department', e.target.value)}>
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="EEE">EEE</option>
                <option value="BBA">BBA</option>
                {departments.filter(d => !['CSE', 'EEE', 'BBA'].includes(d.name)).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
            {showStudentFields && (
            <div className="form-group">
              <label className="form-label">Semester *</label>
              <select className="form-input form-select" value={form.semester} onChange={e => { set('semester', e.target.value); set('section', ''); }}>
                <option value="">Select</option>
                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{getSemesterLabel(s)}</option>)}
              </select>
            </div>
            )}
          </div>
          {showStudentFields && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Section *</label>
              <select className="form-input form-select" value={form.section} onChange={e => set('section', e.target.value)} disabled={!form.semester}>
                <option value="">Select Section</option>
                {sectionOptions.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">WhatsApp Number</label>
              <input className="form-input" value={form.whatsapp_number} onChange={e => set('whatsapp_number', e.target.value)} placeholder="+880XXXXXXXXXX" />
            </div>
          </div>
          )}
          <div className="form-group">
            <label className="form-label">Address</label>
            <input className="form-input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="Your address (optional)" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:'0.5rem'}}>
            {loading ? <><span className="spinner"></span> Creating Account...</> : <><i className="fas fa-user-plus"></i> Create Account</>}
          </button>
        </form>
        )}
        <div className="auth-footer">Already have an account? <Link href="/login">Sign In</Link></div>
      </div>
    </div>
  );
}
