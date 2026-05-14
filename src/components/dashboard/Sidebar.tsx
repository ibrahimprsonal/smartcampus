'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Bell, 
  MessageSquare, 
  Users, 
  Settings, 
  LogOut,
  ClipboardList,
  UserCheck
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/utils/supabase/client'
import { useRouter } from 'next/navigation'

interface SidebarProps {
  profile: any
}

export default function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Notices', icon: Bell, href: '/dashboard/notices' },
    { name: 'Deadlines', icon: ClipboardList, href: '/dashboard/deadlines' },
    { name: 'Discussion', icon: MessageSquare, href: '/dashboard/discussion' },
    { name: 'Messages', icon: MessageSquare, href: '/dashboard/messages' },
  ]

  // Role-specific items
  if (profile.role === 'super_admin' || profile.role === 'cr' || profile.role === 'acr') {
    menuItems.push({ name: 'User Management', icon: UserCheck, href: '/dashboard/users' })
  }

  if (profile.role === 'super_admin') {
    menuItems.push({ name: 'System Settings', icon: Settings, href: '/dashboard/settings' })
  }

  return (
    <aside className="hidden md:flex md:flex-shrink-0 w-64 flex-col bg-white border-r">
      <div className="flex flex-col h-0 flex-1">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4 mb-5">
            <span className="text-xl font-bold text-blue-600">Smart Campus</span>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md'
                )}
              >
                <item.icon
                  className={cn(
                    pathname === item.href ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500',
                    'mr-3 flex-shrink-0 h-6 w-6'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex-shrink-0 flex border-t p-4">
          <Button variant="ghost" className="w-full justify-start text-gray-600" onClick={handleLogout}>
            <LogOut className="mr-3 h-6 w-6 text-gray-400" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  )
}
