'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const { signIn, user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoading && user && profile) {
      if (profile.status === 'rejected' || profile.status === 'banned') return;
      router.push('/dashboard');
    }
  }, [user, profile, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Email and password are required.'); return; }
    setLoading(true); setError('');
    const result = await signIn(email, password);
    if (result.error) { setError(result.error); setLoading(false); return; }
    // Auth state change will handle redirect
  };

  if (isLoading) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div></div>;

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-brand">
          <div style={{width:48,height:48,borderRadius:12,background:'linear-gradient(135deg,var(--accent),var(--accent-purple))',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.25rem',color:'#fff',margin:'0 auto'}}>
            <i className="fas fa-graduation-cap"></i>
          </div>
          <h1>Welcome Back</h1>
          <p>Sign in to Smart Campus</p>
        </div>
        {error && <div className="alert error"><i className="fas fa-circle-exclamation"></i> {error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{width:'100%',justifyContent:'center',marginTop:'0.5rem'}}>
            {loading ? <><span className="spinner"></span> Signing in...</> : <><i className="fas fa-arrow-right-to-bracket"></i> Sign In</>}
          </button>
        </form>
        <div className="auth-footer">
          Don&apos;t have an account? <Link href="/register">Create Account</Link>
        </div>
      </div>
    </div>
  );
}
