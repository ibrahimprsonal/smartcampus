'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { createClient } from '@/utils/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import Link from 'next/link'
import { Plus, ExternalLink, CheckCircle } from 'lucide-react'

export default function NoticesPage() {
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

  const { data: notices, mutate } = useSWR(
    profile ? 'notices-list' : null,
    async () => {
      const { data, error } = await supabase
        .from('notices')
        .select('*, notice_links(*), acknowledgments(user_id)')
        .order('created_at', { ascending: false })

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
        toast.success('Notice acknowledged.')
        mutate()
      }
    } catch (err) {
      toast.error('An error occurred.')
    }
  }

  if (!profile) return <div>Loading...</div>

  const canCreate = ['super_admin', 'teacher', 'cr', 'acr'].includes(profile.role)

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notices</h1>
          <p className="text-gray-500">Stay updated with the latest campus news.</p>
        </div>
        {canCreate && (
          <Button asChild>
            <Link href="/dashboard/notices/create">
              <Plus className="h-4 w-4 mr-2" /> Create Notice
            </Link>
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {notices?.map((notice) => {
          const isAcknowledged = notice.acknowledgments.some((a: any) => a.user_id === profile.id)

          return (
            <Card key={notice.id} className={isAcknowledged ? 'bg-gray-50 opacity-80' : ''}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{notice.title}</CardTitle>
                    {notice.is_global ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">Global</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">Targeted</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Posted on {new Date(notice.created_at).toLocaleDateString()}
                  </p>
                </div>
                {isAcknowledged && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">
                    <CheckCircle className="h-3 w-3 mr-1" /> Acknowledged
                  </Badge>
                )}
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-gray-700">{notice.content}</p>

                {notice.notice_links.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {notice.notice_links.map((link: any) => (
                      <Button key={link.id} variant="outline" size="sm" asChild>
                        <a href={link.url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-3 w-3 mr-2" />
                          {link.button_text}
                        </a>
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-gray-50/50 pt-4 flex justify-between items-center">
                <div className="text-xs text-gray-400">
                  {notice.acknowledgments.length} student(s) acknowledged
                </div>
                {!isAcknowledged && (
                  <Button size="sm" onClick={() => handleAcknowledge(notice.id)}>
                    Acknowledge
                  </Button>
                )}
              </CardFooter>
            </Card>
          )
        })}

        {notices?.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-lg border-2 border-dashed">
            <p className="text-gray-500">No notices found for your section.</p>
          </div>
        )}
      </div>
    </div>
  )
}
