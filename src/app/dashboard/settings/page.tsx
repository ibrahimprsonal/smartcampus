'use client'

import { useState, useEffect } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function SettingsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function getProfile() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
        setProfile(data)
      }
    }
    getProfile()
  }, [supabase])

  const { data: logs } = useSWR(
    profile?.role === 'super_admin' ? 'activity-logs' : null,
    async () => {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, profiles(full_name, role)')
        .order('created_at', { ascending: false })
        .limit(100)
      if (error) throw error
      return data
    }
  )

  if (profile?.role !== 'super_admin') {
    return <div>Access Denied.</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">System Settings & Audit Logs</h1>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.map((log: any) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="font-medium">{log.profiles?.full_name || 'System'}</div>
                    <div className="text-xs text-gray-500 capitalize">{log.profiles?.role}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.action}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 max-w-xs truncate">
                    {JSON.stringify(log.details)}
                  </TableCell>
                  <TableCell className="text-xs text-gray-400">
                    {new Date(log.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
