'use client'

import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { useState, useEffect } from 'react'

export default function UserManagementPage() {
  const supabase = createClient()
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        setCurrentUserProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  const { data: users, mutate } = useSWR(
    currentUserProfile ? 'users-to-manage' : null,
    async () => {
      let query = supabase.from('profiles').select('*')

      if (currentUserProfile.role === 'cr' || currentUserProfile.role === 'acr') {
        query = query
          .eq('department', currentUserProfile.department)
          .eq('semester', currentUserProfile.semester)
          .eq('section', currentUserProfile.section)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return data
    }
  )

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status: newStatus as any })
        .eq('id', userId)

      if (error) {
        toast.error(error.message)
      } else {
        toast.success(`User ${newStatus} successfully.`)
        mutate()
      }
    } catch (err) {
      toast.error('An unexpected error occurred.')
    }
  }

  if (!currentUserProfile) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-500">
          {currentUserProfile.role === 'super_admin' 
            ? 'Manage all users across the campus.' 
            : `Manage students in ${currentUserProfile.department} - Section ${currentUserProfile.section}.`}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Student ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell>{user.student_id || 'N/A'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      user.status === 'approved' ? 'default' : 
                      user.status === 'pending' ? 'secondary' : 
                      'destructive'
                    }
                  >
                    {user.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {user.status === 'pending' && (
                    <>
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleStatusChange(user.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleStatusChange(user.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                  {user.status === 'approved' && user.role !== 'super_admin' && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleStatusChange(user.id, 'banned')}
                    >
                      Ban
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {users?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                  No users found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
