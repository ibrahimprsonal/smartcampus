'use client'

import { User } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface NavbarProps {
  profile: any
}

export default function Navbar({ profile }: NavbarProps) {
  return (
    <header className="bg-white border-b h-16 flex items-center justify-between px-4 md:px-8">
      <div className="md:hidden font-bold text-blue-600 text-lg">Smart Campus</div>
      <div className="hidden md:block text-gray-500 italic">
        Welcome back, {profile.full_name}!
      </div>
      <div className="flex items-center space-x-4">
        <span className="text-sm font-medium text-gray-700 hidden sm:inline-block">
          {profile.role.toUpperCase()}
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="rounded-full bg-gray-100">
              <User className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile Settings</DropdownMenuItem>
            <DropdownMenuItem>Notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
