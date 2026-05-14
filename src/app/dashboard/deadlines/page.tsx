'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Calendar, CheckCircle } from 'lucide-react'

export default function DeadlinesPage() {
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

  const { data: deadlines, mutate } = useSWR(
    profile ? 'deadlines-list' : null,
    async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*, acknowledgments(user_id)')
        .eq('type', 'deadline')
        .order('deadline_at', { ascending: true })

      if (error) throw error
      return data
    }
  )

  const handleAcknowledge = async (noticeId: string) => {
    try {
      const { error } = await supabase
        .from('acknowledgments')
        .insert({ notice_id: noticeId, user_id: profile.id })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Deadline acknowledged.')
        mutate()
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  if (!profile) return <div>Loading...</div>

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Deadlines</h1>
        <p className="text-gray-500">Track your assignments and upcoming tasks.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {deadlines?.map((deadline) => {
          const isAcknowledged = deadline.acknowledgments.some((a: any) => a.user_id === profile.id)
          const isPast = deadline.deadline_at && new Date(deadline.deadline_at) < new Date()

          return (
            <Card key={deadline.id} className={isAcknowledged ? 'opacity-80' : ''}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-xl">{deadline.title}</CardTitle>
                  <div className="flex items-center text-sm text-gray-500">
                    <Calendar className="h-4 w-4 mr-1" />
                    Due: {deadline.deadline_at ? new Date(deadline.deadline_at).toLocaleString() : 'N/A'}
                    {isPast && !isAcknowledged && (
                      <Badge variant="destructive" className="ml-2">Overdue</Badge>
                    )}
                  </div>
                </div>
                {isAcknowledged && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    <CheckCircle className="h-3 w-3 mr-1" /> Acknowledged
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{deadline.content}</p>
              </CardContent>
              <CardFooter className="flex justify-end">
                {!isAcknowledged && (
                  <Button onClick={() => handleAcknowledge(deadline.id)}>
                    Mark as Acknowledged
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}

        {deadlines?.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active deadlines found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
