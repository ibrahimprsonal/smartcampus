'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LandingPage() {
  const { user, profile, isLoading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (!isLoading && user && profile) router.push('/dashboard');
  }, [user, profile, isLoading, router]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  if (isLoading) return <div className="loading-screen"><div className="spinner" style={{width:32,height:32}}></div></div>;

  return (
    <div style={landingStyles.body}>
      {/* Orbs */}
      <div style={landingStyles.orbs}>
        <div style={{...landingStyles.orb, width:400,height:400,background:'rgba(88,166,255,0.12)',top:'-10%',left:'-5%',animationDuration:'25s'}}></div>
        <div style={{...landingStyles.orb, width:350,height:350,background:'rgba(188,140,255,0.1)',top:'40%',right:'-8%',animationDuration:'30s',animationDelay:'-5s'}}></div>
        <div style={{...landingStyles.orb, width:300,height:300,background:'rgba(63,185,80,0.08)',bottom:'-5%',left:'30%',animationDuration:'22s',animationDelay:'-10s'}}></div>
      </div>
      {/* Nav */}
      <nav style={{...landingStyles.nav, background: scrolled ? 'rgba(6,8,15,0.9)' : 'rgba(6,8,15,0.6)', boxShadow: scrolled ? '0 4px 30px rgba(0,0,0,0.3)' : 'none'}}>
        <Link href="/" style={landingStyles.navBrand}>
          <div style={landingStyles.navBrandIcon}><i className="fas fa-graduation-cap"></i></div>
          Smart Campus
        </Link>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link href="/login" style={landingStyles.navLogin}><i className="fas fa-arrow-right-to-bracket" style={{marginRight:'0.35rem'}}></i> Sign In</Link>
        </div>
      </nav>
      {/* Hero */}
      <section style={landingStyles.hero}>
        <div style={landingStyles.heroBadge}><span style={landingStyles.pulseDot}></span> University Management Platform</div>
        <h1 style={landingStyles.heroTitle}>Your Campus, <br/><span style={landingStyles.gradientText}>Smarter & Connected</span></h1>
        <p style={landingStyles.heroSubtitle}>সকল নোটিশ, ডেডলাইন আর মেসেজিং একটি প্ল্যাটফর্মে। Real-time updates, role-based access, and seamless campus communication.</p>
        <div style={landingStyles.heroActions}>
          <Link href="/register" style={landingStyles.heroBtnPrimary}><i className="fas fa-user-plus"></i> Create Account</Link>
          <a href="#features" style={landingStyles.heroBtnSecondary} onClick={e => { e.preventDefault(); document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' }); }}><i className="fas fa-sparkles"></i> Explore Features</a>
        </div>
        <div style={landingStyles.statsBar}>
          <div style={{ textAlign: 'center' }}>
            <div style={{...landingStyles.statIconWrap, background:'var(--accent-glow)', color:'var(--accent)'}}><i className="fas fa-bullhorn"></i></div>
            <div style={landingStyles.statLabel}>Notices</div>
            <div style={landingStyles.statDesc}>Targeted Broadcasts</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{...landingStyles.statIconWrap, background:'rgba(188,140,255,0.15)', color:'var(--accent-purple)'}}><i className="fas fa-envelope"></i></div>
            <div style={landingStyles.statLabel}>Messaging</div>
            <div style={landingStyles.statDesc}>Secure & Private</div>
          </div>
        </div>
      </section>
      {/* Features */}
      <section id="features" style={landingStyles.featuresSection}>
        <div className="reveal" style={landingStyles.featuresHeader}>
          <h2 style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>Everything Your Campus Needs</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', maxWidth: 550, margin: '0 auto' }}>Smart Campus provides powerful tools to keep students, CRs, teachers, and admins connected.</p>
        </div>
        <div style={landingStyles.featuresGrid}>
          {features.map((f, i) => (
            <div key={i} className="reveal" style={landingStyles.featureCard}>
              <div style={{...landingStyles.featureIcon, background: f.bg, color: f.color}}><i className={f.icon}></i></div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      {/* Footer */}
      <footer style={landingStyles.footer}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>© {new Date().getFullYear()} Smart Campus. Built for universities that move fast.</p>
      </footer>
      <style jsx>{`
        .reveal { opacity: 0; transform: translateY(40px); transition: all 0.7s cubic-bezier(0.4, 0, 0.2, 1); }
        .reveal.visible { opacity: 1; transform: translateY(0); }
        @keyframes orbFloat { 0%, 100% { transform: translate(0, 0) scale(1); } 25% { transform: translate(30px, -40px) scale(1.05); } 50% { transform: translate(-20px, 20px) scale(0.95); } 75% { transform: translate(40px, 30px) scale(1.02); } }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(0.8); } }
        @keyframes gradientShift { 0%, 100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes heroFadeUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

const features = [
  { icon: 'fas fa-bullhorn', title: 'Targeted Notices', desc: 'Send notices to specific departments, semesters, and sections — or broadcast globally.', bg: 'var(--accent-glow)', color: 'var(--accent)' },
  { icon: 'fas fa-clock', title: 'Deadline Tracker', desc: 'Never miss an assignment. CRs and teachers can publish deadlines with priority levels.', bg: 'rgba(240,136,62,0.15)', color: 'var(--accent-orange)' },
  { icon: 'fas fa-envelope', title: 'Private Messaging', desc: 'Secure, request-based messaging between students and faculty.', bg: 'rgba(188,140,255,0.15)', color: 'var(--accent-purple)' },
  { icon: 'fas fa-comments', title: 'Discussion Forum', desc: 'Section-based boards where students and CRs can post and collaborate.', bg: 'rgba(248,81,73,0.15)', color: 'var(--accent-red)' },
  { icon: 'fas fa-shield-halved', title: 'Role-Based Access', desc: 'Five roles — Student, CR, ACR, Teacher, Super Admin — each with tailored dashboards.', bg: 'rgba(210,153,34,0.15)', color: 'var(--accent-yellow)' },
];

const landingStyles: Record<string, React.CSSProperties> = {
  body: { background: 'var(--bg-main)', minHeight: '100vh', overflow: 'hidden auto', backgroundImage: 'radial-gradient(ellipse at 15% 30%, rgba(88,166,255,0.07) 0%, transparent 55%), radial-gradient(ellipse at 85% 20%, rgba(188,140,255,0.05) 0%, transparent 55%)' },
  orbs: { position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: '50%', filter: 'blur(80px)', opacity: 0.4, animation: 'orbFloat 20s ease-in-out infinite' },
  nav: { position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 2.5rem', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(240,246,252,0.06)', transition: 'all 0.3s' },
  navBrand: { display: 'flex', alignItems: 'center', gap: '0.7rem', fontSize: '1.15rem', fontWeight: 800, color: '#fff', textDecoration: 'none' },
  navBrandIcon: { width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', color: '#fff' },
  navLogin: { padding: '0.55rem 1.25rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: 'none', border: '1px solid var(--border)', background: 'rgba(255,255,255,0.03)' },
  hero: { position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minHeight: '100vh', padding: '8rem 2rem 4rem' },
  heroBadge: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', borderRadius: 50, background: 'rgba(88,166,255,0.08)', border: '1px solid rgba(88,166,255,0.15)', color: 'var(--accent)', fontSize: '0.8rem', fontWeight: 600, marginBottom: '2rem', animation: 'heroFadeUp 0.8s ease backwards' },
  pulseDot: { width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block', animation: 'pulse 2s ease-in-out infinite' },
  heroTitle: { fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', fontWeight: 800, color: '#fff', lineHeight: 1.15, letterSpacing: '-0.03em', marginBottom: '1.25rem', maxWidth: 800, animation: 'heroFadeUp 0.8s ease 0.1s backwards' },
  gradientText: { background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-purple) 50%, var(--accent-green) 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundSize: '200% 200%', animation: 'gradientShift 5s ease infinite' },
  heroSubtitle: { fontSize: 'clamp(1rem, 2vw, 1.2rem)', color: 'var(--text-secondary)', maxWidth: 600, lineHeight: 1.7, marginBottom: '2.5rem', animation: 'heroFadeUp 0.8s ease 0.2s backwards' },
  heroActions: { display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', animation: 'heroFadeUp 0.8s ease 0.3s backwards' },
  heroBtnPrimary: { display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2rem', borderRadius: 12, background: 'linear-gradient(135deg, var(--accent), #3d8bfd)', color: '#fff', fontSize: '1rem', fontWeight: 700, textDecoration: 'none', boxShadow: '0 4px 24px rgba(88,166,255,0.25)' },
  heroBtnSecondary: { display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.9rem 2rem', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 600, textDecoration: 'none' },
  statsBar: { display: 'flex', justifyContent: 'center', gap: '2.5rem', padding: '2.5rem 2rem', marginTop: '1rem', animation: 'heroFadeUp 0.8s ease 0.4s backwards' },
  statIconWrap: { width: 48, height: 48, borderRadius: 14, margin: '0 auto 0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.15rem' },
  statLabel: { fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: '0.15rem' },
  statDesc: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 },
  featuresSection: { position: 'relative', zIndex: 1, padding: '5rem 2rem 6rem', maxWidth: 1200, margin: '0 auto' },
  featuresHeader: { textAlign: 'center', marginBottom: '3.5rem' },
  featuresGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' },
  featureCard: { background: 'rgba(13,17,23,0.6)', backdropFilter: 'blur(10px)', border: '1px solid var(--border)', borderRadius: 16, padding: '2rem 1.75rem', transition: 'all 0.35s' },
  featureIcon: { width: 48, height: 48, borderRadius: 12, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem' },
  footer: { position: 'relative', zIndex: 1, textAlign: 'center', padding: '4rem 2rem 3rem', borderTop: '1px solid var(--border)' },
};
