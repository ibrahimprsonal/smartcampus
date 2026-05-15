import { UserRole } from '@/types/database';

export function getRoleDisplay(role: UserRole): string {
  const map: Record<UserRole, string> = {
    student: 'Student',
    cr: 'CR',
    acr: 'ACR',
    teacher: 'Teacher',
    super_admin: 'Super Admin',
  };
  return map[role] || role;
}

export function getRoleBadgeColor(role: UserRole): string {
  const map: Record<UserRole, string> = {
    student: 'blue',
    cr: 'orange',
    acr: 'purple',
    teacher: 'green',
    super_admin: 'red',
  };
  return map[role] || 'blue';
}

export function getStatusBadgeColor(status: string): string {
  const map: Record<string, string> = {
    pending: 'orange',
    approved: 'green',
    rejected: 'red',
    banned: 'red',
    accepted: 'green',
  };
  return map[status] || 'blue';
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.substring(0, len) + '...';
}

export function getInitial(name: string): string {
  return (name || 'U').charAt(0).toUpperCase();
}

export function getPriorityColor(priority: string): string {
  const map: Record<string, string> = {
    normal: 'var(--accent-green)',
    high: 'var(--accent-orange)',
    urgent: 'var(--accent-red)',
  };
  return map[priority] || 'var(--accent-green)';
}

export function canCreateNotice(role: UserRole): boolean {
  return ['cr', 'acr', 'teacher', 'super_admin'].includes(role);
}

export function canCreateDeadline(role: UserRole): boolean {
  return ['cr', 'acr', 'teacher', 'super_admin'].includes(role);
}

export function canManageUsers(role: UserRole): boolean {
  return ['cr', 'acr', 'super_admin'].includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'super_admin';
}

export function isCrOrAcr(role: UserRole): boolean {
  return role === 'cr' || role === 'acr';
}
